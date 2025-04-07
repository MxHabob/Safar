import logging
from twilio.rest import Client
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_email(subject, message, recipient_list, html_message=None, from_email=None, context=None):
        """
        Enhanced email sending with:
        - Better template handling
        - Context support
        - Improved error handling
        """
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            
            if not html_message:
                template_context = {
                    'message': message,
                    'subject': subject,
                    'current_year': timezone.now().year,
                    'site_name': settings.SITE_NAME,
                    **(context or {})
                }
                html_message = render_to_string('templates/emails/notification.html', template_context)
            
            if NotificationService._email_rate_limit_exceeded(recipient_list):
                logger.warning(f"Email rate limit exceeded for {recipient_list}")
                return False
                
            send_mail(
                subject=subject,
                message=strip_tags(message),
                from_email=from_email,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Email sent to {recipient_list} with subject: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_list}: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def _email_rate_limit_exceeded(recipient_list, limit=5, period_minutes=60):
        """
        Cache-based rate limiting using Django's cache framework
        """
        cache_key = f"email_rate_limit:{','.join(sorted(recipient_list))}"
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            return True
            
        # Increment count and set expiration
        cache.set(cache_key, current_count + 1, timeout=period_minutes * 60)
        return False

    @staticmethod
    def send_sms(to_number, message):
        """
        Enhanced SMS sending with:
        - Better error handling
        - Message validation
        - Rate limiting
        """
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER]):
            logger.error("Twilio credentials not configured")
            return False
            
        if not to_number or not message:
            logger.error("Missing recipient number or message content")
            return False
            
        try:
            if not to_number.startswith('+'):
                logger.error(f"Invalid phone number format: {to_number}")
                return False
                
            if NotificationService._sms_rate_limit_exceeded(to_number):
                logger.warning(f"SMS rate limit exceeded for {to_number}")
                return False
                
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message[:160],
                from_=settings.TWILIO_FROM_NUMBER,
                to=to_number
            )
            
            logger.info(f"SMS sent to {to_number}, SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_number}: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def _sms_rate_limit_exceeded(to_number, limit=3, period_hours=24):
        """
        SMS rate limiting to prevent abuse
        """
        from apps.safar.models import SmsLog
        
        period_ago = timezone.now() - timedelta(hours=period_hours)
        recent_count = SmsLog.objects.filter(
            to_number=to_number,
            created_at__gte=period_ago,
            status='success'
        ).count()
        
        return recent_count >= limit

    @staticmethod
    def send_push_notification(user, title, message, data=None):
        """
        Enhanced push notification with:
        - Device token validation
        - Payload size checking
        - Better error handling
        """
        if not hasattr(user, 'profile'):
            logger.error(f"No profile found for user {user.id}")
            return False
            
        if not user.profile.notification_push_token:
            logger.warning(f"No push token for user {user.id}")
            return False
            
        try:
            payload = {
                'to': user.profile.notification_push_token,
                'title': title[:100],
                'body': message[:200],
                'data': data or {}
            }
            
            if len(str(payload)) > 4000:
                logger.error("Push notification payload too large")
                return False
                
            logger.info(f"Push notification prepared for user {user.id}: {title} - {message}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send push to user {user.id}: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def send_notification(user, notification_type, message, data=None):
        """
        Unified notification method that coordinates across all channels
        with proper error handling and logging
        """
        from apps.safar.models import Notification
        
        try:
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                message=message,
                metadata=data or {},
                status='pending'
            )
            
            results = {
                'email': False,
                'sms': False,
                'push': False
            }
            
            # Check user preferences and send accordingly
            if getattr(user.profile, 'wants_email_notifications', True) and user.email:
                results['email'] = NotificationService.send_email(
                    subject=f"{settings.SITE_NAME}: {notification_type}",
                    message=message,
                    recipient_list=[user.email],
                    context={
                        'user': user,
                        'notification': notification
                    }
                )
                
            if getattr(user.profile, 'wants_sms_notifications', False) and user.profile.phone_number:
                results['sms'] = NotificationService.send_sms(
                    to_number=str(user.profile.phone_number),
                    message=f"{notification_type}: {message[:120]}..."
                )
                
            if getattr(user.profile, 'wants_push_notifications', True) and user.profile.notification_push_token:
                results['push'] = NotificationService.send_push_notification(
                    user=user,
                    title=notification_type,
                    message=message,
                    data=data
                )
            
            notification.status = 'sent' if any(results.values()) else 'failed'
            notification.channels = [k for k, v in results.items() if v]
            notification.save()
            
            return notification.status == 'sent'
            
        except Exception as e:
            logger.error(f"Failed to send notification to user {user.id}: {str(e)}", exc_info=True)
            return False