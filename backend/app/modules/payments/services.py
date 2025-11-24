"""
خدمات المدفوعات - Payment Services
"""
import stripe
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.modules.bookings.models import Booking, Payment, PaymentStatus, PaymentMethod
from app.modules.bookings.models import BookingStatus

settings = get_settings()

# Initialize Stripe if key is available
if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


class PaymentService:
    """خدمة المدفوعات - Payment service"""
    
    @staticmethod
    async def create_payment_intent(
        db: AsyncSession,
        booking_id: int,
        amount: float,
        currency: str = "USD"
    ) -> dict:
        """إنشاء payment intent - Create payment intent"""
        if not settings.stripe_secret_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service is not configured"
            )
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency.lower(),
                metadata={"booking_id": booking_id}
            )
            
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create payment intent: {str(e)}"
            )
    
    @staticmethod
    async def process_payment(
        db: AsyncSession,
        booking_id: int,
        payment_intent_id: str,
        payment_method: PaymentMethod
    ) -> Payment:
        """معالجة دفعة - Process payment"""
        # Get booking
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Verify payment intent with Stripe
        if settings.stripe_secret_key:
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                if intent.status != "succeeded":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Payment not completed"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Payment verification failed: {str(e)}"
                )
        
        # Create payment record
        payment = Payment(
            booking_id=booking_id,
            amount=booking.total_price,
            currency=booking.currency,
            payment_method=payment_method,
            status=PaymentStatus.COMPLETED,
            stripe_payment_intent_id=payment_intent_id
        )
        
        db.add(payment)
        
        # Update booking
        booking.payment_status = PaymentStatus.COMPLETED
        booking.payment_intent_id = payment_intent_id
        booking.status = BookingStatus.CONFIRMED
        
        await db.commit()
        await db.refresh(payment)
        
        return payment
    
    @staticmethod
    async def refund_payment(
        db: AsyncSession,
        payment_id: int,
        amount: Optional[float] = None
    ) -> Payment:
        """استرداد دفعة - Refund payment"""
        result = await db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        refund_amount = amount or float(payment.amount)
        
        # Process refund with Stripe
        if settings.STRIPE_SECRET_KEY and payment.stripe_payment_intent_id:
            try:
                refund = stripe.Refund.create(
                    payment_intent=payment.stripe_payment_intent_id,
                    amount=int(refund_amount * 100) if amount else None
                )
                
                payment.status = PaymentStatus.REFUNDED if refund_amount >= float(payment.amount) else PaymentStatus.PARTIALLY_REFUNDED
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Refund failed: {str(e)}"
                )
        else:
            payment.status = PaymentStatus.REFUNDED
        
        await db.commit()
        await db.refresh(payment)
        
        return payment

