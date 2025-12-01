"""
Notification background tasks.
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.modules.notifications.models import Notification
from app.modules.users.models import User
from app.modules.users.device_service import DeviceService
from app.infrastructure.email.service import EmailService
from app.infrastructure.notifications.push import PushNotificationService

settings = get_settings()


async def _send_email_notification_async(notification_id: int):
    """Send an email notification asynchronously."""
    async with AsyncSessionLocal() as db:
        # Get notification
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        
        if not notification or notification.sent_email:
            return
        
        # Get user
        result = await db.execute(
            select(User).where(User.id == notification.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.email:
            return
        
        # Send email
        success = await EmailService.send_email(
            to_email=user.email,
            subject=notification.title,
            body=notification.message,
            html_body=f"<html><body><h2>{notification.title}</h2><p>{notification.message}</p></body></html>"
        )
        
        if success:
            notification.sent_email = True
            await db.commit()


@celery_app.task(name="send_email_notification")
def send_email_notification(notification_id: int):
    """Send an email notification (Celery task)."""
    asyncio.run(_send_email_notification_async(notification_id))


async def _send_push_notification_async(notification_id: int):
    """Send a push notification asynchronously."""
    async with AsyncSessionLocal() as db:
        # Get notification
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        
        if not notification or notification.sent_push:
            return
        
        # Get user
        result = await db.execute(
            select(User).where(User.id == notification.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return
        
        # Send push notification to all user devices
        try:
            results = await DeviceService.send_notification_to_user_devices(
                db,
                user_id=user.id,
                title=notification.title,
                body=notification.message,
                data=notification.notification_metadata or {}
            )
            
            # Mark as sent if at least one device received it
            if any(results.values()):
                notification.sent_push = True
                await db.commit()
        except Exception as e:
            # Log error but don't fail the task
            print(f"❌ Error sending push notification: {str(e)}")


@celery_app.task(name="send_push_notification")
def send_push_notification(notification_id: int):
    """Send a push notification (Celery task)."""
    asyncio.run(_send_push_notification_async(notification_id))


async def _send_sms_notification_async(notification_id: int):
    """Send an SMS notification asynchronously."""
    async with AsyncSessionLocal() as db:
        # Get notification
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        
        if not notification or notification.sent_sms:
            return
        
        # Get user
        result = await db.execute(
            select(User).where(User.id == notification.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.phone_number:
            return
        
        # Send SMS via Twilio
        if settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                from twilio.rest import Client
                client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
                message = client.messages.create(
                    body=notification.message,
                    from_=settings.twilio_phone_number,
                    to=user.phone_number
                )
                if message.sid:
                    notification.sent_sms = True
                    await db.commit()
            except Exception as e:
                print(f"❌ Error sending SMS: {str(e)}")
        else:
            print(f"⚠️ Twilio not configured. SMS would be sent to {user.phone_number}: {notification.message}")


@celery_app.task(name="send_sms_notification")
def send_sms_notification(notification_id: int):
    """Send an SMS notification (Celery task)."""
    asyncio.run(_send_sms_notification_async(notification_id))

