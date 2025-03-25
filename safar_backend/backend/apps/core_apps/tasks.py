from celery import shared_task
from django.contrib.auth import get_user_model
from apps.core_apps.services import NotificationService
from apps.safar.models import Notification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=3)
def send_email_task(self, subject, message, recipient_list, html_message=None, from_email=None):
    try:
        success = NotificationService.send_email(
            subject=subject,
            message=message,
            recipient_list=recipient_list,
            html_message=html_message,
            from_email=from_email
        )
        if not success:
            raise Exception("Email sending failed")
        return True
    except Exception as e:
        logger.error(f"Email task failed: {str(e)}")
        self.retry(exc=e, countdown=60 * self.request.retries)

@shared_task(bind=True, max_retries=3)
def send_sms_task(self, to_number, message):
    try:
        success = NotificationService.send_sms(
            to_number=to_number,
            message=message
        )
        if not success:
            raise Exception("SMS sending failed")
        return True
    except Exception as e:
        logger.error(f"SMS task failed: {str(e)}")
        self.retry(exc=e, countdown=60 * self.request.retries)

@shared_task(bind=True, max_retries=3)
def send_push_notification_task(self, user_id, title, message, data=None):
    try:
        user = User.objects.get(id=user_id)
        success = NotificationService.send_push_notification(
            user=user,
            title=title,
            message=message,
            data=data
        )
        if not success:
            raise Exception("Push notification failed")
        return True
    except Exception as e:
        logger.error(f"Push notification task failed: {str(e)}")
        self.retry(exc=e, countdown=60 * self.request.retries)

@shared_task
def process_notification(notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
        user = notification.user
        
        # Send via email if user has email
        if user.email:
            send_email_task.delay(
                subject=f"Notification: {notification.type}",
                message=notification.message,
                recipient_list=[user.email]
            )
        
        if user.profile.phone_number:
            send_sms_task.delay(
                to_number=str(user.profile.phone_number),
                message=f"{notification.type}: {notification.message}"
            )
        
        # Send push notification if user has token
        if user.profile.expo_push_token:
            send_push_notification_task.delay(
                user_id=user.id,
                title=notification.type,
                message=notification.message
            )
        
        # Mark as processed
        notification.is_read = True
        notification.save()
        return True
    except Exception as e:
        logger.error(f"Failed to process notification {notification_id}: {str(e)}")
        return False