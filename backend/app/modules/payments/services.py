"""
Payment services.
Integrates with Stripe, PayPal, and coordinates booking payment workflows.
"""
import stripe
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.modules.bookings.models import Booking, Payment, PaymentStatus, PaymentMethodType
from app.modules.bookings.models import BookingStatus
from app.infrastructure.payments.paypal import PayPalService
from app.infrastructure.payments.mpesa import MPesaService
from app.infrastructure.payments.fawry import FawryService
from app.infrastructure.payments.klarna import KlarnaService

settings = get_settings()

# Initialize Stripe if key is available
if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


class PaymentService:
    """Payment service for creating, processing, and refunding payments."""
    
    @staticmethod
    async def create_payment_intent(
        db: AsyncSession,
        booking_id: int,
        amount: float,
        currency: str = "USD",
        payment_method: Optional[PaymentMethodType] = PaymentMethodType.CREDIT_CARD
    ) -> Dict[str, Any]:
        """
        Create a payment intent for a booking.
        Supports both Stripe and PayPal.
        """
        if payment_method == PaymentMethodType.PAYPAL:
            # Create PayPal order
            if not settings.paypal_client_id:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="PayPal is not configured"
                )
            
            try:
                order = await PayPalService.create_order(
                    amount=amount,
                    currency=currency,
                    booking_id=str(booking_id)
                )
                return {
                    "payment_intent_id": order["order_id"],
                    "approval_url": order["approval_url"],
                    "payment_method": "paypal"
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create PayPal order: {str(e)}"
                )
        elif payment_method == PaymentMethodType.MPESA:
            # M-Pesa STK Push
            if not settings.mpesa_consumer_key:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="M-Pesa is not configured"
                )
            
            try:
                # Get phone number from booking metadata or request
                # In production, this should come from the request
                phone_number = f"254712345678"  # Placeholder - should be from request
                stk_response = await MPesaService.stk_push(
                    phone_number=phone_number,
                    amount=amount,
                    account_reference=f"BOOKING_{booking_id}",
                    transaction_desc=f"Payment for booking {booking_id}"
                )
                return {
                    "payment_intent_id": stk_response.get("CheckoutRequestID"),
                    "customer_message": stk_response.get("CustomerMessage"),
                    "payment_method": "mpesa",
                    "requires_customer_action": True
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create M-Pesa payment: {str(e)}"
                )
        elif payment_method == PaymentMethodType.FAWRY:
            # Fawry payment
            if not settings.fawry_merchant_code:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Fawry is not configured"
                )
            
            try:
                # Get customer info from booking
                booking_result = await db.execute(
                    select(Booking).where(Booking.id == booking_id)
                )
                booking = booking_result.scalar_one_or_none()
                
                if not booking:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Booking not found"
                    )
                
                charge_response = await FawryService.create_charge(
                    merchant_ref_num=f"BOOKING_{booking_id}",
                    amount=amount,
                    customer_name=f"Guest {booking_id}",
                    customer_mobile="",  # Should come from user profile
                    customer_email="",  # Should come from user profile
                    description=f"Payment for booking {booking_id}"
                )
                return {
                    "payment_intent_id": charge_response.get("referenceNumber"),
                    "payment_url": charge_response.get("paymentUrl"),
                    "payment_method": "fawry",
                    "requires_customer_action": True
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create Fawry payment: {str(e)}"
                )
        elif payment_method in [PaymentMethodType.KLARNA, PaymentMethodType.TAMARA, PaymentMethodType.TABBY]:
            # Buy Now Pay Later (Klarna/Tamara/Tabby)
            provider = "klarna" if payment_method == PaymentMethodType.KLARNA else \
                      "tamara" if payment_method == PaymentMethodType.TAMARA else "tabby"
            
            if provider == "klarna" and not settings.klarna_username:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Klarna is not configured"
                )
            elif provider == "tamara" and not settings.tamara_token:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Tamara is not configured"
                )
            elif provider == "tabby" and not settings.tabby_secret_key:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Tabby is not configured"
                )
            
            try:
                # Get booking details
                booking_result = await db.execute(
                    select(Booking).where(Booking.id == booking_id)
                )
                booking = booking_result.scalar_one_or_none()
                
                if not booking:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Booking not found"
                    )
                
                order_lines = [{
                    "name": f"Booking {booking_id}",
                    "quantity": 1,
                    "unit_price": int(amount * 100) if provider == "klarna" else amount,
                    "total_amount": int(amount * 100) if provider == "klarna" else amount
                }]
                
                session_response = await KlarnaService.create_session(
                    amount=amount,
                    currency=currency,
                    order_lines=order_lines,
                    provider=provider
                )
                
                return {
                    "payment_intent_id": session_response.get("session_id") or session_response.get("id"),
                    "client_token": session_response.get("client_token") or session_response.get("token"),
                    "payment_url": session_response.get("redirect_url"),
                    "payment_method": provider,
                    "requires_customer_action": True
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create {provider} payment: {str(e)}"
                )
        elif payment_method in [PaymentMethodType.APPLE_PAY, PaymentMethodType.GOOGLE_PAY]:
            # Apple Pay / Google Pay via Stripe Payment Intents
            if not settings.stripe_secret_key:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Stripe is not configured for Apple Pay/Google Pay"
                )
            
            try:
                # Get booking details for payment intent metadata
                booking_result = await db.execute(
                    select(Booking).where(Booking.id == booking_id)
                )
                booking = booking_result.scalar_one_or_none()
                
                if not booking:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Booking not found"
                    )
                
                # Create Payment Intent with Apple Pay / Google Pay enabled
                payment_method_types = []
                if payment_method == PaymentMethodType.APPLE_PAY:
                    payment_method_types = ["card", "apple_pay"]
                elif payment_method == PaymentMethodType.GOOGLE_PAY:
                    payment_method_types = ["card", "google_pay"]
                
                intent = stripe.PaymentIntent.create(
                    amount=int(amount * 100),  # Convert to cents
                    currency=currency.lower(),
                    payment_method_types=payment_method_types,
                    metadata={
                        "booking_id": str(booking_id),
                        "payment_method": payment_method.value
                    },
                    # Enable automatic payment methods for better UX
                    automatic_payment_methods={
                        "enabled": True,
                        "allow_redirects": "never"  # Prefer inline payment methods
                    }
                )
                
                return {
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "payment_method": payment_method.value,
                    "apple_pay_merchant_id": settings.apple_pay_merchant_id if payment_method == PaymentMethodType.APPLE_PAY else None,
                    "google_pay_merchant_id": settings.google_pay_merchant_id if payment_method == PaymentMethodType.GOOGLE_PAY else None
                }
            except stripe.error.StripeError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create {payment_method.value} payment intent: {str(e)}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create payment intent: {str(e)}"
                )
        else:
            # Default to Stripe (credit card)
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
                    "payment_intent_id": intent.id,
                    "payment_method": "stripe"
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
        """Process a payment intent and persist the payment.
        
        CRITICAL: Includes idempotency checks to prevent duplicate processing and
        uses row-level locking to ensure atomic operations.
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
        
        # Verify payment based on payment method
        from decimal import Decimal, ROUND_HALF_UP
        
        processor_ref = None
        
        if payment_method == PaymentMethodType.MPESA:
            # Verify M-Pesa transaction
            try:
                status_response = await MPesaService.query_transaction_status(payment_intent_id)
                if status_response.get("ResultCode") != 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"M-Pesa payment not completed: {status_response.get('ResultDesc')}"
                    )
                processor_ref = status_response.get("CheckoutRequestID")
            except HTTPException:
                # Re-raise HTTPExceptions as-is (they already have correct status codes)
                raise
            except Exception as e:
                logger.error(f"M-Pesa verification error: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"M-Pesa payment verification failed: {str(e)}"
                )
        elif payment_method == PaymentMethodType.FAWRY:
            # Verify Fawry payment
            try:
                verify_response = await FawryService.verify_payment(payment_intent_id)
                if verify_response.get("paymentStatus") != "PAID":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Fawry payment not completed: {verify_response.get('paymentStatus')}"
                    )
                processor_ref = verify_response.get("referenceNumber")
            except HTTPException:
                # Re-raise HTTPExceptions as-is (they already have correct status codes)
                raise
            except Exception as e:
                logger.error(f"Fawry verification error: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Fawry payment verification failed: {str(e)}"
                )
        elif payment_method in [PaymentMethodType.KLARNA, PaymentMethodType.TAMARA, PaymentMethodType.TABBY]:
            # BNPL payments are typically verified via webhooks
            # For now, accept if payment_intent_id exists (webhook will verify)
            processor_ref = payment_intent_id
        elif payment_method == PaymentMethodType.PAYPAL:
            # Verify PayPal order
            try:
                capture_data = await PayPalService.capture_order(payment_intent_id)
                
                if capture_data["status"] != "COMPLETED":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"PayPal payment not completed. Status: {capture_data['status']}"
                    )
                
                # Verify amount matches
                paypal_amount = Decimal(str(capture_data["amount"]))
                booking_amount = Decimal(str(booking.total_amount))
                
                paypal_amount_rounded = paypal_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                booking_amount_rounded = booking_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                
                if paypal_amount_rounded != booking_amount_rounded:
                    logger.error(
                        f"PayPal payment amount mismatch. booking_id={booking_id}, "
                        f"booking_amount={booking_amount_rounded}, paypal_amount={paypal_amount_rounded}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payment amount mismatch: expected {booking_amount_rounded}, got {paypal_amount_rounded}"
                    )
                
                processor_ref = capture_data.get("capture_id") or capture_data.get("payment_id")
            except HTTPException:
                # Re-raise HTTPExceptions as-is (they already have correct status codes)
                raise
            except Exception as e:
                logger.error(
                    f"PayPal API error during payment verification. "
                    f"order_id={payment_intent_id}, error={str(e)}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PayPal payment verification failed: {str(e)}"
                )
        else:
            # Default to Stripe
            if settings.stripe_secret_key:
                try:
                    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                    if intent.status != "succeeded":
                        # Provide user-friendly error messages based on payment intent status
                        status_messages = {
                            "requires_payment_method": "Please complete the payment by providing your payment details.",
                            "requires_confirmation": "Payment requires confirmation. Please try again.",
                            "requires_action": "Additional authentication is required. Please complete the verification step.",
                            "processing": "Your payment is being processed. Please wait a moment and try again.",
                            "requires_capture": "Payment requires capture. Please contact support.",
                            "canceled": "The payment was canceled. Please create a new payment.",
                            "requires_source": "Payment method is required. Please provide your payment details.",
                            "requires_source_action": "Additional action is required on your payment method. Please check and try again."
                        }
                        error_message = status_messages.get(
                            intent.status,
                            f"Payment not completed. Status: {intent.status}"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=error_message
                        )
                    
                    # Verify amount matches (strict - use Decimal for exact comparison)
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
                    
                    processor_ref = payment_intent_id
                except HTTPException:
                    # Re-raise HTTPExceptions as-is (they already have correct status codes)
                    raise
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
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Payment service is not configured"
                )
        
        # Create payment record (within locked transaction)
        # FIXED: Use total_amount instead of total_price (total_price is nullable legacy field)
        # CRITICAL: Use Decimal for exact amount storage
        from decimal import Decimal
        payment_amount = Decimal(str(booking.total_amount))
        
        # Determine processor
        if payment_method == PaymentMethodType.PAYPAL:
            processor = "paypal"
            stripe_payment_intent_id = None
            paypal_order_id = payment_intent_id
        elif payment_method == PaymentMethodType.MPESA:
            processor = "mpesa"
            stripe_payment_intent_id = None
            paypal_order_id = None
        elif payment_method == PaymentMethodType.FAWRY:
            processor = "fawry"
            stripe_payment_intent_id = None
            paypal_order_id = None
        elif payment_method in [PaymentMethodType.KLARNA, PaymentMethodType.TAMARA, PaymentMethodType.TABBY]:
            processor = "klarna" if payment_method == PaymentMethodType.KLARNA else \
                       "tamara" if payment_method == PaymentMethodType.TAMARA else "tabby"
            stripe_payment_intent_id = None
            paypal_order_id = None
        else:
            processor = "stripe"
            stripe_payment_intent_id = payment_intent_id
            paypal_order_id = None
        
        payment = Payment(
            booking_id=booking_id,
            amount=payment_amount,
            currency=booking.currency,
            payment_method=payment_method,
            status=PaymentStatus.COMPLETED,
            stripe_payment_intent_id=stripe_payment_intent_id,
            paypal_order_id=paypal_order_id,
            processor=processor,
            processor_ref=processor_ref,
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
            
            # Award loyalty points after successful payment (async, non-blocking)
            # Points will be awarded when booking is completed (after checkout)
            # This is handled by a Celery task or when booking status changes to COMPLETED
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
        """Refund a payment (fully or partially, depending on the amount)."""
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
        
        # Process refund based on processor
        if payment.processor == "paypal" and payment.paypal_order_id:
            try:
                # Get capture ID from payment metadata or processor_ref
                capture_id = payment.processor_ref or payment.paypal_order_id
                await PayPalService.refund_payment(
                    capture_id=capture_id,
                    amount=refund_amount if amount else None
                )
                payment.status = PaymentStatus.REFUNDED if refund_amount >= float(payment.amount) else PaymentStatus.PARTIALLY_REFUNDED
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PayPal refund failed: {str(e)}"
                )
        elif payment.processor == "stripe" and payment.stripe_payment_intent_id:
            try:
                refund = stripe.Refund.create(
                    payment_intent=payment.stripe_payment_intent_id,
                    amount=int(refund_amount * 100) if amount else None
                )
                payment.status = PaymentStatus.REFUNDED if refund_amount >= float(payment.amount) else PaymentStatus.PARTIALLY_REFUNDED
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stripe refund failed: {str(e)}"
                )
        else:
            # Manual refund or no processor
            payment.status = PaymentStatus.REFUNDED
        
        # Note: Transaction commit is managed by caller (UnitOfWork or route handler)
        await db.flush()  # Flush changes, but don't commit yet
        await db.refresh(payment)
        
        return payment

