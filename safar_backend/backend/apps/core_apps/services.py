import logging
from twilio.rest import Client
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_email(subject, message, recipient_list, html_message=None, from_email=None):
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            if not html_message:
                html_message = render_to_string('email/base_template.html', {
                    'message': message,
                    'subject': subject
                })
            
            send_mail(
                subject=subject,
                message=strip_tags(message),
                from_email=from_email,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_sms(to_number, message):
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER]):
            logger.error("Twilio credentials not configured")
            return False
            
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message,
                from_=settings.TWILIO_FROM_NUMBER,
                to=to_number
            )
            logger.info(f"SMS sent to {to_number}, SID: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False

    @staticmethod
    def send_push_notification(user, title, message, data=None):
        if not user.profile.notification_push_token:
            logger.warning(f"No Expo push token for user {user.id}")
            return False
            
        try:
            logger.info(f"Would send push to {user.profile.notification_push_token}: {title} - {message}")
            return True
        except Exception as e:
            logger.error(f"Failed to send push notification: {str(e)}")
            return False