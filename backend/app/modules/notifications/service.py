"""
Notification service for sending booking and payment notifications.
"""
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.notifications.models import Notification, NotificationType
from app.modules.users.models import User
from app.modules.bookings.models import Booking
from app.modules.bookings.models import PaymentMethodType
from app.core.id import ID
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and sending notifications."""
    
    @staticmethod
    async def booking_confirmed(
        db: AsyncSession,
        booking_id: ID,
        guest_id: ID,
        host_id: ID
    ) -> None:
        """Send notification when booking is confirmed."""
        try:
            # Get booking details
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            
            if not booking:
                logger.warning(f"Booking not found for notification: {booking_id}")
                return
            
            # Notify guest
            guest_notification = Notification(
                user_id=guest_id,
                notification_type=NotificationType.BOOKING_CONFIRMED,
                title="Booking Confirmed",
                message=f"Your booking #{booking.booking_number} has been confirmed!",
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number,
                    "check_in": booking.check_in.isoformat() if booking.check_in else None,
                    "check_out": booking.check_out.isoformat() if booking.check_out else None
                }
            )
            db.add(guest_notification)
            
            # Notify host
            host_notification = Notification(
                user_id=host_id,
                notification_type=NotificationType.BOOKING_CONFIRMED,
                title="New Booking Confirmed",
                message=f"Booking #{booking.booking_number} has been confirmed.",
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number,
                    "guest_id": str(guest_id)
                }
            )
            db.add(host_notification)
            
            await db.commit()
            
            # Trigger async notification sending
            try:
                from app.modules.notifications.tasks import send_email_notification, send_push_notification
                send_email_notification.delay(guest_notification.id)
                send_push_notification.delay(guest_notification.id)
                send_email_notification.delay(host_notification.id)
                send_push_notification.delay(host_notification.id)
            except Exception as e:
                logger.warning(f"Failed to queue notification tasks: {e}")
                
        except Exception as e:
            logger.error(f"Error sending booking confirmed notification: {e}", exc_info=True)
    
    @staticmethod
    async def booking_completed(
        db: AsyncSession,
        booking_id: ID,
        guest_id: ID,
        host_id: ID
    ) -> None:
        """Send notification when booking is completed."""
        try:
            # Get booking details
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            
            if not booking:
                logger.warning(f"Booking not found for notification: {booking_id}")
                return
            
            # Notify guest
            guest_notification = Notification(
                user_id=guest_id,
                notification_type=NotificationType.BOOKING_CONFIRMED,  # Reuse type
                title="Stay Completed",
                message=f"Your stay at booking #{booking.booking_number} has been completed. Thank you!",
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number
                }
            )
            db.add(guest_notification)
            
            # Notify host
            host_notification = Notification(
                user_id=host_id,
                notification_type=NotificationType.BOOKING_CONFIRMED,
                title="Stay Completed",
                message=f"Guest has checked out from booking #{booking.booking_number}.",
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number,
                    "guest_id": str(guest_id)
                }
            )
            db.add(host_notification)
            
            await db.commit()
            
            # Trigger async notification sending
            try:
                from app.modules.notifications.tasks import send_email_notification, send_push_notification
                send_email_notification.delay(guest_notification.id)
                send_push_notification.delay(guest_notification.id)
                send_email_notification.delay(host_notification.id)
                send_push_notification.delay(host_notification.id)
            except Exception as e:
                logger.warning(f"Failed to queue notification tasks: {e}")
                
        except Exception as e:
            logger.error(f"Error sending booking completed notification: {e}", exc_info=True)
    
    @staticmethod
    async def payment_succeeded(
        db: AsyncSession,
        booking_id: ID,
        guest_id: ID,
        payment_method: Optional[PaymentMethodType] = None,
        amount: Optional[float] = None
    ) -> None:
        """Send notification when payment succeeds.
        
        Args:
            db: Database session
            booking_id: Booking ID
            guest_id: Guest user ID
            payment_method: Payment method used (e.g., APPLE_PAY, GOOGLE_PAY)
            amount: Payment amount
        """
        try:
            # Get booking details
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            
            if not booking:
                logger.warning(f"Booking not found for payment notification: {booking_id}")
                return
            
            # Determine notification message based on payment method
            payment_method_name = payment_method.value if payment_method else "card"
            if payment_method == PaymentMethodType.APPLE_PAY:
                title = "Apple Pay Payment Successful"
                message = f"Your Apple Pay payment for booking #{booking.booking_number} was successful!"
            elif payment_method == PaymentMethodType.GOOGLE_PAY:
                title = "Google Pay Payment Successful"
                message = f"Your Google Pay payment for booking #{booking.booking_number} was successful!"
            else:
                title = "Payment Successful"
                message = f"Your payment for booking #{booking.booking_number} was successful!"
            
            notification = Notification(
                user_id=guest_id,
                notification_type=NotificationType.PAYMENT_RECEIVED,
                title=title,
                message=message,
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number,
                    "payment_method": payment_method_name,
                    "amount": float(amount) if amount else None
                }
            )
            db.add(notification)
            await db.commit()
            
            # Trigger async notification sending
            try:
                from app.modules.notifications.tasks import send_email_notification, send_push_notification
                send_email_notification.delay(notification.id)
                send_push_notification.delay(notification.id)
            except Exception as e:
                logger.warning(f"Failed to queue notification tasks: {e}")
                
        except Exception as e:
            logger.error(f"Error sending payment notification: {e}", exc_info=True)
    
    @staticmethod
    async def booking_cancelled(
        db: AsyncSession,
        booking_id: ID,
        guest_id: ID,
        host_id: Optional[ID],
        cancelled_by: ID,
        reason: Optional[str] = None
    ) -> None:
        """Send notification when booking is cancelled."""
        try:
            # Get booking details
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            
            if not booking:
                logger.warning(f"Booking not found for cancellation notification: {booking_id}")
                return
            
            # Notify guest
            guest_notification = Notification(
                user_id=guest_id,
                notification_type=NotificationType.BOOKING_CANCELLED,
                title="Booking Cancelled",
                message=f"Your booking #{booking.booking_number} has been cancelled." + (f" Reason: {reason}" if reason else ""),
                related_entity_type="booking",
                related_entity_id=str(booking_id),
                notification_metadata={
                    "booking_id": str(booking_id),
                    "booking_number": booking.booking_number,
                    "cancelled_by": str(cancelled_by),
                    "cancellation_reason": reason
                }
            )
            db.add(guest_notification)
            
            # Notify host if available
            if host_id:
                host_notification = Notification(
                    user_id=host_id,
                    notification_type=NotificationType.BOOKING_CANCELLED,
                    title="Booking Cancelled",
                    message=f"Booking #{booking.booking_number} has been cancelled." + (f" Reason: {reason}" if reason else ""),
                    related_entity_type="booking",
                    related_entity_id=str(booking_id),
                    notification_metadata={
                        "booking_id": str(booking_id),
                        "booking_number": booking.booking_number,
                        "guest_id": str(guest_id),
                        "cancelled_by": str(cancelled_by),
                        "cancellation_reason": reason
                    }
                )
                db.add(host_notification)
            
            await db.commit()
            
            # Trigger async notification sending
            try:
                from app.modules.notifications.tasks import send_email_notification, send_push_notification
                send_email_notification.delay(guest_notification.id)
                send_push_notification.delay(guest_notification.id)
                if host_id:
                    send_email_notification.delay(host_notification.id)
                    send_push_notification.delay(host_notification.id)
            except Exception as e:
                logger.warning(f"Failed to queue notification tasks: {e}")
                
        except Exception as e:
            logger.error(f"Error sending booking cancellation notification: {e}", exc_info=True)

