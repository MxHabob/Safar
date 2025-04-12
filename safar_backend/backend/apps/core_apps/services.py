import logging
import json
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from twilio.rest import Client
from firebase_admin import messaging
import firebase_admin
from firebase_admin import credentials

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK if not already initialized
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {str(e)}")

class NotificationService:
    """
    Modern notification service with support for email, SMS, and push notifications.
    Includes rate limiting, template rendering, and comprehensive error handling.
    """
    
    @staticmethod
    def send_email(subject, message, recipient_list, html_message=None, from_email=None, context=None):
        """
        Send an email with HTML support and template rendering
        """
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            
            # Rate limiting check
            if NotificationService._email_rate_limit_exceeded(recipient_list):
                logger.warning(f"Email rate limit exceeded for {recipient_list}")
                return False
            
            # Prepare HTML message with template if not provided
            if not html_message and context is not None:
                template_context = {
                    'message': message,
                    'subject': subject,
                    'current_year': timezone.now().year,
                    'site_name': settings.SITE_NAME,
                    **context
                }
                html_message = render_to_string('emails/notification.html', template_context)
            
            # Send the email
            send_mail(
                subject=subject,
                message=strip_tags(message) if html_message else message,
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
        Rate limiting for emails to prevent abuse
        """
        if not settings.ENABLE_EMAIL_RATE_LIMITING:
            return False
            
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
        Send SMS using Twilio with rate limiting and error handling
        """
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER]):
            logger.error("Twilio credentials not configured")
            return False
            
        if not to_number or not message:
            logger.error("Missing recipient number or message content")
            return False
            
        try:
            # Ensure number is in E.164 format
            if not to_number.startswith('+'):
                logger.error(f"Invalid phone number format: {to_number}")
                return False
                
            # Rate limiting check
            if NotificationService._sms_rate_limit_exceeded(to_number):
                logger.warning(f"SMS rate limit exceeded for {to_number}")
                return False
                
            # Send SMS via Twilio
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            sms = client.messages.create(
                body=message[:160],  # SMS length limit
                from_=settings.TWILIO_FROM_NUMBER,
                to=to_number
            )
            
            # Log SMS in database
            from apps.safar.models import SmsLog
            SmsLog.objects.create(
                to_number=to_number,
                message=message[:160],
                status='success',
                provider='twilio',
                provider_message_id=sms.sid
            )
            
            logger.info(f"SMS sent to {to_number}, SID: {sms.sid}")
            return True
            
        except Exception as e:
            # Log failure
            from apps.safar.models import SmsLog
            SmsLog.objects.create(
                to_number=to_number,
                message=message[:160],
                status='failed',
                provider='twilio',
                error_message=str(e)[:255]
            )
            
            logger.error(f"Failed to send SMS to {to_number}: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def _sms_rate_limit_exceeded(to_number, limit=3, period_hours=24):
        """
        SMS rate limiting to prevent abuse
        """
        if not settings.ENABLE_SMS_RATE_LIMITING:
            return False
            
        from apps.safar.models import SmsLog
        from django.db.models import Count
        
        period_ago = timezone.now() - timezone.timedelta(hours=period_hours)
        recent_count = SmsLog.objects.filter(
            to_number=to_number,
            created_at__gte=period_ago,
            status='success'
        ).count()
        
        return recent_count >= limit

    @staticmethod
    def send_push_notification(user, title, message, data=None, image_url=None):
        """
        Send push notification using Firebase Cloud Messaging
        """
        if not hasattr(user, 'profile'):
            logger.error(f"No profile found for user {user.id}")
            return False
            
        if not user.profile.notification_push_token:
            logger.warning(f"No push token for user {user.id}")
            return False
            
        try:
            # Prepare notification
            notification = messaging.Notification(
                title=title[:100],
                body=message[:200],
                image=image_url
            )
            
            # Prepare data payload
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='notification_icon',
                    color='#4CAF50',
                    click_action='FLUTTER_NOTIFICATION_CLICK'
                )
            )
            
            apns_config = messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        badge=1,
                        sound='default',
                        content_available=True
                    )
                )
            )
            
            # Create message
            fcm_message = messaging.Message(
                notification=notification,
                data=data or {},
                token=user.profile.notification_push_token,
                android=android_config,
                apns=apns_config
            )
            
            # Send message
            response = messaging.send(fcm_message)
            
            # Log push notification
            from apps.safar.models import PushNotificationLog
            PushNotificationLog.objects.create(
                user=user,
                title=title,
                message=message,
                data=json.dumps(data) if data else None,
                status='success',
                provider='firebase',
                provider_message_id=response
            )
            
            logger.info(f"Push notification sent to user {user.id}, response: {response}")
            return True
            
        except Exception as e:
            # Log failure
            from apps.safar.models import PushNotificationLog
            PushNotificationLog.objects.create(
                user=user,
                title=title,
                message=message,
                data=json.dumps(data) if data else None,
                status='failed',
                provider='firebase',
                error_message=str(e)[:255]
            )
            
            logger.error(f"Failed to send push to user {user.id}: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def send_notification(user, notification_type, message, data=None, image_url=None, immediate=False):
        """
        Unified notification method that coordinates across all channels
        with proper error handling and logging.
        
        If immediate=True, sends notifications directly.
        If immediate=False, creates a notification record to be processed by Celery.
        """
        from apps.safar.models import Notification
        from apps.core_apps.tasks import process_notification
        
        try:
            # Create notification record
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                message=message,
                metadata=data or {},
                status='pending',
                channels=[]
            )
            
            # If immediate, send directly
            if immediate:
                results = {
                    'email': False,
                    'sms': False,
                    'push': False
                }
                
                # Check user preferences and send accordingly
                if getattr(user, 'email', None) and getattr(user.profile, 'wants_email_notifications', True):
                    results['email'] = NotificationService.send_email(
                        subject=f"{settings.SITE_NAME}: {notification_type}",
                        message=message,
                        recipient_list=[user.email],
                        context={
                            'user': user,
                            'notification': notification,
                            'action_url': data.get('deep_link', settings.SITE_URL) if data else settings.SITE_URL
                        }
                    )
                    
                if hasattr(user, 'profile') and user.profile.phone_number and getattr(user.profile, 'wants_sms_notifications', False):
                    results['sms'] = NotificationService.send_sms(
                        to_number=str(user.profile.phone_number),
                        message=f"{notification_type}: {message[:120]}..."
                    )
                    
                if hasattr(user, 'profile') and user.profile.notification_push_token and getattr(user.profile, 'wants_push_notifications', True):
                    results['push'] = NotificationService.send_push_notification(
                        user=user,
                        title=notification_type,
                        message=message,
                        data=data,
                        image_url=image_url
                    )
                
                # Update notification status
                notification.status = 'sent' if any(results.values()) else 'failed'
                notification.channels = [k for k, v in results.items() if v]
                notification.processed_at = timezone.now()
                notification.save()
                
                return notification.status == 'sent'
            else:
                # Queue for processing by Celery
                process_notification.delay(notification.id)
                return True
            
        except Exception as e:
            logger.error(f"Failed to send notification to user {user.id}: {str(e)}", exc_info=True)
            return False