"""
خدمات المدفوعات - Payment Services
"""
import stripe
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.modules.bookings.models import Booking, Payment, PaymentStatus, PaymentMethodType
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
        payment_method: PaymentMethodType
    ) -> Payment:
        """معالجة دفعة - Process payment
        
        CRITICAL: Includes idempotency checks to prevent duplicate payment processing.
        Uses row-level locking to ensure atomicity.
        """
        import logging
        from sqlalchemy.orm import selectinload
        from sqlalchemy.exc import IntegrityError
        
        logger = logging.getLogger(__name__)
        
        # CRITICAL: Lock payment row first to prevent race conditions
        # Check if payment with this intent_id already exists WITH LOCK
        # This ensures atomicity - no other transaction can check/create at same time
        existing_payment_result = await db.execute(
            select(Payment)
            .where(Payment.stripe_payment_intent_id == payment_intent_id)
            .with_for_update(nowait=True)
        )
        payment_record = existing_payment_result.scalar_one_or_none()
        
        if payment_record:
            logger.info(
                f"Payment already processed (idempotent). payment_intent_id={payment_intent_id}, "
                f"existing_payment_id={payment_record.id}, booking_id={booking_id}"
            )
            # Return existing payment - idempotent operation
            return payment_record
        
        # Get booking with lock to prevent race conditions
        booking_result = await db.execute(
            select(Booking)
            .where(Booking.id == booking_id)
            .with_for_update(nowait=True)
            .options(selectinload(Booking.payments))
        )
        booking = booking_result.scalar_one_or_none()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # CRITICAL: Check if booking already has completed payment (within locked transaction)
        if booking.payment_status == PaymentStatus.COMPLETED:
            logger.warning(
                f"Booking already has completed payment. booking_id={booking_id}, "
                f"payment_status={booking.payment_status}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking already has a completed payment"
            )
        
        # Verify payment intent with Stripe
        if settings.stripe_secret_key:
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                if intent.status != "succeeded":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payment not completed. Status: {intent.status}"
                    )
                
                # Verify amount matches (strict - use Decimal for exact comparison)
                from decimal import Decimal, ROUND_HALF_UP
                intent_amount = Decimal(intent.amount) / Decimal(100)  # Convert from cents
                booking_amount = Decimal(str(booking.total_amount))  # Convert to Decimal for exact comparison
                
                # Use exact match - any discrepancy is a critical error
                # Round both to 2 decimal places for comparison (currency precision)
                intent_amount_rounded = intent_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                booking_amount_rounded = booking_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                
                if intent_amount_rounded != booking_amount_rounded:
                    difference = abs(booking_amount_rounded - intent_amount_rounded)
                    logger.error(
                        f"Payment amount mismatch. booking_id={booking_id}, "
                        f"booking_amount={booking_amount_rounded}, intent_amount={intent_amount_rounded}, "
                        f"difference={difference}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payment amount mismatch: expected {booking_amount_rounded}, got {intent_amount_rounded}"
                    )
            except stripe.error.StripeError as e:
                logger.error(
                    f"Stripe API error during payment verification. "
                    f"payment_intent_id={payment_intent_id}, error={str(e)}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Payment verification failed: {str(e)}"
                )
            except Exception as e:
                logger.error(
                    f"Unexpected error during payment verification. "
                    f"payment_intent_id={payment_intent_id}, error={str(e)}",
                    exc_info=True
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Payment verification failed"
                )
        
        # Create payment record (within locked transaction)
        # FIXED: Use total_amount instead of total_price (total_price is nullable legacy field)
        # CRITICAL: Use Decimal for exact amount storage
        from decimal import Decimal
        payment_amount = Decimal(str(booking.total_amount))
        
        payment = Payment(
            booking_id=booking_id,
            amount=payment_amount,
            currency=booking.currency,
            payment_method=payment_method,
            status=PaymentStatus.COMPLETED,
            stripe_payment_intent_id=payment_intent_id,
            processor="stripe",
            processor_ref=payment_intent_id,
            captured_at=datetime.utcnow()
        )
        
        db.add(payment)
        
        # Update booking (within locked transaction)
        booking.payment_status = PaymentStatus.COMPLETED
        booking.payment_intent_id = payment_intent_id
        booking.status = BookingStatus.CONFIRMED
        booking.paid_at = datetime.utcnow()
        
        # Note: Transaction commit is managed by caller (UnitOfWork or route handler)
        # CRITICAL: Flush to check for unique constraint violations before commit
        try:
            await db.flush()  # Flush to get payment ID and check constraints
        except IntegrityError as e:
            # Handle race condition where another transaction created payment
            # between our check and insert (shouldn't happen with lock, but safety net)
            await db.rollback()
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            logger.warning(
                f"Payment creation failed due to constraint violation (likely duplicate). "
                f"payment_intent_id={payment_intent_id}, booking_id={booking_id}, error={error_msg}"
            )
            # Retry by fetching existing payment
            existing_payment_result = await db.execute(
                select(Payment).where(Payment.stripe_payment_intent_id == payment_intent_id)
            )
            existing_payment = existing_payment_result.scalar_one_or_none()
            if existing_payment:
                logger.info(
                    f"Payment already exists (idempotent). "
                    f"payment_intent_id={payment_intent_id}, existing_payment_id={existing_payment.id}"
                )
                return existing_payment
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment already exists or conflict occurred"
            )
        
        await db.refresh(payment)
        
        logger.info(
            f"Payment processed successfully. payment_id={payment.id}, "
            f"payment_intent_id={payment_intent_id}, booking_id={booking_id}, "
            f"amount={payment.amount}"
        )
        
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
        # FIXED: Use correct lowercase attribute name
        if settings.stripe_secret_key and payment.stripe_payment_intent_id:
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
        
        # Note: Transaction commit is managed by caller (UnitOfWork or route handler)
        await db.flush()  # Flush changes, but don't commit yet
        await db.refresh(payment)
        
        return payment

