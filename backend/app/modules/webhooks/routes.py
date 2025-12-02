"""
Webhook routes.
CRITICAL: Includes Stripe webhook signature verification.
"""
import logging
from typing import Any
from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.database import get_db
from app.core.config import get_settings
from app.modules.bookings.models import Booking, Payment, PaymentStatus, BookingStatus
from app.modules.payments.services import PaymentService
from app.modules.webhooks.models import WebhookEvent
from sqlalchemy import select

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe_signature"),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Stripe webhook endpoint with signature verification
    
    CRITICAL: Verifies webhook signature to prevent spoofing attacks.
    Only processes webhooks that are cryptographically verified.
    """
    if not settings.stripe_webhook_secret:
        logger.error("Stripe webhook secret not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook secret not configured"
        )
    
    # Get raw request body
    body = await request.body()
    
    try:
        # CRITICAL: Verify webhook signature
        # This prevents attackers from sending fake webhook events
        event = stripe.Webhook.construct_event(
            body,
            stripe_signature,
            settings.stripe_webhook_secret
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Handle different event types
    event_type = event.get("type")
    event_data = event.get("data", {}).get("object", {})
    event_id = event.get("id")
    
    logger.info(f"Received Stripe webhook: {event_type}, id={event_id}")
    
    # CRITICAL: Check if event already processed (idempotency)
    # Lock webhook event row to prevent concurrent processing
    existing_event_result = await db.execute(
        select(WebhookEvent)
        .where(WebhookEvent.event_id == event_id)
        .with_for_update(nowait=True)
    )
    existing_event = existing_event_result.scalar_one_or_none()
    
    if existing_event:
        logger.info(
            f"Webhook event already processed (idempotent). "
            f"event_id={event_id}, event_type={event_type}, "
            f"processed_at={existing_event.processed_at}"
        )
        # Return success - idempotent operation
        return {
            "received": True,
            "event_type": event_type,
            "event_id": event_id,
            "status": "already_processed"
        }
    
    # Create webhook event record BEFORE processing (prevents duplicate processing)
    webhook_event = WebhookEvent(
        event_id=event_id,
        event_type=event_type,
        source="stripe",
        payload=event,
        status="processing"
    )
    db.add(webhook_event)
    await db.flush()  # Flush to ensure event is tracked before processing
    
    try:
        # Process webhook event
        if event_type == "payment_intent.succeeded":
            await handle_payment_intent_succeeded(event_data, db)
        elif event_type == "payment_intent.payment_failed":
            await handle_payment_intent_failed(event_data, db)
        elif event_type == "charge.refunded":
            await handle_charge_refunded(event_data, db)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
        
        # Mark event as processed
        webhook_event.status = "processed"
        await db.commit()
        
        return {"received": True, "event_type": event_type, "event_id": event_id}
    
    except HTTPException as exc:
        # Re-raise HTTP exceptions (these are expected errors)
        # Mark event as failed
        try:
            webhook_event.status = "failed"
            webhook_event.error_message = str(exc.detail) if hasattr(exc, 'detail') else "HTTP Exception"
            await db.commit()
        except Exception:
            await db.rollback()
        raise
    except Exception as e:
        # CRITICAL: Return 500 to allow Stripe to retry transient failures
        # Only return 200 for permanent failures that shouldn't be retried
        logger.error(
            f"Error processing webhook event {event_type} (id={event_id}): {e}",
            exc_info=True
        )
        # Mark event as failed
        try:
            webhook_event.status = "failed"
            webhook_event.error_message = str(e)[:500]  # Limit error message length
            await db.commit()
        except Exception:
            # If we can't even save the error, rollback and continue
            await db.rollback()
        
        # Return 500 for transient errors (database issues, network issues, etc.)
        # Stripe will retry these automatically
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook event: {str(e)}"
        )


async def handle_payment_intent_succeeded(
    intent_data: dict,
    db: AsyncSession
) -> None:
    """Handle payment_intent.succeeded webhook
    
    CRITICAL: Uses row-level locking to prevent race conditions when processing
    the same payment_intent_id concurrently.
    """
    from datetime import datetime
    from sqlalchemy.orm import selectinload
    
    payment_intent_id = intent_data.get("id")
    
    if not payment_intent_id:
        logger.error("Payment intent ID missing from webhook data")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment intent ID missing from webhook data"
        )
    
    # CRITICAL: Lock payment row to prevent concurrent processing
    # Check if payment already processed (idempotency) with lock
    existing_payment = await db.execute(
        select(Payment)
        .where(Payment.stripe_payment_intent_id == payment_intent_id)
        .with_for_update(nowait=True)
    )
    payment = existing_payment.scalar_one_or_none()
    
    if payment:
        logger.info(
            f"Payment already processed via webhook. "
            f"payment_intent_id={payment_intent_id}, payment_id={payment.id}"
        )
        return  # Idempotent - already processed
    
    # Get booking from metadata
    metadata = intent_data.get("metadata", {})
    booking_id = metadata.get("booking_id")
    
    if not booking_id:
        logger.error(
            f"Booking ID missing from payment intent metadata. "
            f"payment_intent_id={payment_intent_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking ID missing from payment intent metadata"
        )
    
    # CRITICAL: Lock booking row to prevent concurrent modifications
    booking_result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update(nowait=True)
        .options(selectinload(Booking.payments))
    )
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        logger.error(
            f"Booking not found for webhook. "
            f"booking_id={booking_id}, payment_intent_id={payment_intent_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking not found: {booking_id}"
        )
    
    # Check if booking already paid (double-check within locked transaction)
    if booking.payment_status == PaymentStatus.COMPLETED:
        logger.warning(
            f"Booking already has completed payment. "
            f"booking_id={booking_id}, payment_intent_id={payment_intent_id}"
        )
        return  # Idempotent - already paid
    
    # Create payment record
    # CRITICAL: Use Decimal for exact amount calculation
    from decimal import Decimal
    from sqlalchemy.exc import IntegrityError
    
    amount = Decimal(intent_data.get("amount", 0)) / Decimal(100)  # Convert from cents
    
    # Extract payment method from payment intent
    payment_method_type = None
    payment_method_data = intent_data.get("payment_method", {})
    if isinstance(payment_method_data, dict):
        payment_method_type_str = payment_method_data.get("type", "")
        if payment_method_type_str == "apple_pay":
            from app.modules.bookings.models import PaymentMethodType
            payment_method_type = PaymentMethodType.APPLE_PAY
        elif payment_method_type_str == "google_pay":
            from app.modules.bookings.models import PaymentMethodType
            payment_method_type = PaymentMethodType.GOOGLE_PAY
    
    # Also check metadata for payment method
    if not payment_method_type:
        payment_method_meta = metadata.get("payment_method")
        if payment_method_meta:
            from app.modules.bookings.models import PaymentMethodType
            try:
                payment_method_type = PaymentMethodType(payment_method_meta)
            except ValueError:
                pass
    
    payment = Payment(
        booking_id=booking_id,
        amount=amount,
        currency=intent_data.get("currency", "usd").upper(),
        status=PaymentStatus.COMPLETED,
        stripe_payment_intent_id=payment_intent_id,
        processor="stripe",
        processor_ref=payment_intent_id,
        captured_at=datetime.utcnow()
    )
    
    db.add(payment)
    
    # Update booking payment method if available
    if payment_method_type:
        booking.payment_method = payment_method_type
    
    # Update booking (within locked transaction)
    booking.payment_status = PaymentStatus.COMPLETED
    booking.payment_intent_id = payment_intent_id
    booking.status = BookingStatus.CONFIRMED
    
    try:
        await db.flush()  # Flush to check for constraint violations
    except IntegrityError as e:
        # Handle duplicate payment_intent_id (shouldn't happen with lock, but safety net)
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.warning(
            f"Payment creation failed due to constraint violation (likely duplicate). "
            f"payment_intent_id={payment_intent_id}, booking_id={booking_id}, error={error_msg}"
        )
        # Payment already exists - this is idempotent, so return success
        return
    
    # Track analytics event with payment method
    try:
        from app.modules.analytics.service import AnalyticsService
        await AnalyticsService.track_event(
            db=db,
            user_id=booking.guest_id,
            event_name="payment_succeeded",
            source="webhook",
            payload={
                "booking_id": str(booking_id),
                "payment_intent_id": payment_intent_id,
                "amount": float(amount),
                "currency": intent_data.get("currency", "usd"),
                "payment_method": payment_method_type.value if payment_method_type else "card"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to track payment analytics event: {e}")
    
    # Send notification with payment method
    try:
        from app.modules.notifications.service import NotificationService
        await NotificationService.payment_succeeded(
            db=db,
            booking_id=booking_id,
            guest_id=booking.guest_id,
            payment_method=payment_method_type,
            amount=float(amount)
        )
    except Exception as e:
        logger.warning(f"Failed to send payment notification: {e}")
    
    logger.info(
        f"Payment processed via webhook. "
        f"payment_intent_id={payment_intent_id}, booking_id={booking_id}, amount={amount}, "
        f"payment_method={payment_method_type.value if payment_method_type else 'card'}"
    )


async def handle_payment_intent_failed(
    intent_data: dict,
    db: AsyncSession
) -> None:
    """Handle payment_intent.payment_failed webhook"""
    payment_intent_id = intent_data.get("id")
    
    logger.warning(
        f"Payment intent failed. payment_intent_id={payment_intent_id}, "
        f"failure_code={intent_data.get('last_payment_error', {}).get('code')}"
    )
    
    # Optionally update booking status to reflect payment failure
    # This depends on your business logic


async def handle_charge_refunded(
    charge_data: dict,
    db: AsyncSession
) -> None:
    """Handle charge.refunded webhook
    
    CRITICAL: Uses row-level locking to prevent race conditions.
    """
    payment_intent_id = charge_data.get("payment_intent")
    
    if not payment_intent_id:
        logger.warning("Payment intent ID missing from refund webhook")
        return
    
    # CRITICAL: Lock payment row to prevent concurrent modifications
    payment_result = await db.execute(
        select(Payment)
        .where(Payment.stripe_payment_intent_id == payment_intent_id)
        .with_for_update(nowait=True)
    )
    payment = payment_result.scalar_one_or_none()
    
    if not payment:
        logger.warning(
            f"Payment not found for refund webhook. "
            f"payment_intent_id={payment_intent_id}"
        )
        return
    
    # Update payment status (within locked transaction)
    refund_amount = charge_data.get("amount_refunded", 0) / 100.0
    
    if refund_amount >= float(payment.amount):
        payment.status = PaymentStatus.REFUNDED
    else:
        payment.status = PaymentStatus.PARTIALLY_REFUNDED
    
    logger.info(
        f"Payment refunded via webhook. "
        f"payment_id={payment.id}, payment_intent_id={payment_intent_id}, "
        f"refund_amount={refund_amount}"
    )

