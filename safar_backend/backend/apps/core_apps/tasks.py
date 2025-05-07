from datetime import timedelta
from celery import shared_task
from django.core.cache import cache
from django.db import transaction
import logging
from django.utils import timezone
from apps.authentication.models import User
from apps.core_apps.services import NotificationService
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_task(self, subject, message, recipient_list, html_message=None, from_email=None, context=None):
    """
    Task for sending emails asynchronously
    """
    try:
        success = NotificationService.send_email(
            subject=subject,
            message=message,
            recipient_list=recipient_list,
            html_message=html_message,
            from_email=from_email,
            context=context
        )
        if not success:
            raise Exception("Email sending reported failure")
        return True
    except Exception as e:
        logger.error(f"Email task failed for {recipient_list}: {str(e)}", exc_info=True)
        self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 3600))
        return False

@shared_task(bind=True, max_retries=3)
def send_sms_task(self, to_number, message):
    """
    Task for sending SMS asynchronously
    """
    try:
        if not to_number or not message:
            logger.error("Invalid SMS task parameters")
            return False
            
        success = NotificationService.send_sms(
            to_number=to_number,
            message=message
        )
        if not success:
            raise Exception("SMS sending reported failure")
        return True
    except Exception as e:
        logger.error(f"SMS task failed for {to_number}: {str(e)}", exc_info=True)
        self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 3600))
        return False

@shared_task(bind=True, max_retries=3)
def send_push_notification_task(self, user_id, title, message, data=None, image_url=None):
    """
    Task for sending push notifications asynchronously
    """
    try:
        user = User.objects.get(id=user_id)
        success = NotificationService.send_push_notification(
            user=user,
            title=title,
            message=message,
            data=data,
            image_url=image_url
        )
        if not success:
            raise Exception("Push notification reported failure")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for push notification")
        return False
    except Exception as e:
        logger.error(f"Push task failed for user {user_id}: {str(e)}", exc_info=True)
        self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 3600))
        return False

@shared_task(bind=True, max_retries=3)
def process_notification(self, notification_id):
    """
    Process a notification by sending it through all appropriate channels
    """
    from apps.safar.models import Notification
    
    try:
        with transaction.atomic():
            notification = Notification.objects.select_for_update().get(id=notification_id)
            
            if notification.processed_at or notification.status in ['sent', 'failed']:
                logger.info(f"Notification {notification_id} already processed")
                return True
                
            notification.processing_started = timezone.now()
            notification.status = 'processing'
            notification.save()
        
        user = notification.user
        results = {}
        
        if user.email and getattr(user.profile, 'wants_email_notifications', True):
            context = {
                'notification': notification,
                'user': user,
                'action_url': notification.metadata.get('deep_link', settings.SITE_URL)
            }
            
            results['email'] = send_email_task.delay(
                subject=f"{settings.SITE_NAME}: {notification.type}",
                message=notification.message,
                recipient_list=[user.email],
                context=context
            ).get() 

        if hasattr(user, 'profile') and user.profile.phone_number and getattr(user.profile, 'wants_sms_notifications', False):
            results['sms'] = send_sms_task.delay(
                to_number=str(user.profile.phone_number),
                message=f"{notification.type}: {notification.message[:120]}..."
            ).get()
            
        if hasattr(user, 'profile') and user.profile.notification_push_token and getattr(user.profile, 'wants_push_notifications', True):
            results['push'] = send_push_notification_task.delay(
                user_id=str(user.id),
                title=notification.type,
                message=notification.message,
                data=notification.metadata,
                image_url=notification.metadata.get('image_url')
            ).get()

        with transaction.atomic():
            notification.refresh_from_db()
            notification.status = 'sent' if any(results.values()) else 'failed'
            notification.channels = [k for k, v in results.items() if v]
            notification.processed_at = timezone.now()
            notification.save()
        
        return True
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return False
    except Exception as e:
        logger.error(f"Failed to process notification {notification_id}: {str(e)}", exc_info=True)
        self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 3600))
        return False

@shared_task
def send_bulk_notifications(user_ids, notification_type, message, data=None):
    """
    Send the same notification to multiple users
    """
    from apps.authentication.models import User
    
    success_count = 0
    failure_count = 0
    
    for user_id in user_ids:
        try:
            user = User.objects.get(id=user_id)
            success = NotificationService.send_notification(
                user=user,
                notification_type=notification_type,
                message=message,
                data=data,
                immediate=False
            )
            
            if success:
                success_count += 1
            else:
                failure_count += 1
                
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found for bulk notification")
            failure_count += 1
        except Exception as e:
            logger.error(f"Failed to send bulk notification to user {user_id}: {str(e)}")
            failure_count += 1
    
    logger.info(f"Bulk notification complete: {success_count} succeeded, {failure_count} failed")
    return {'success': success_count, 'failure': failure_count}

@shared_task
def clean_old_notifications():
    """
    Clean up old notifications to prevent database bloat
    """
    from apps.safar.models import Notification
    
    retention_days = getattr(settings, 'NOTIFICATION_RETENTION_DAYS', 90)
    cutoff_date = timezone.now() - timezone.timedelta(days=retention_days)
    
    try:
        count, _ = Notification.objects.filter(created_at__lt=cutoff_date).delete()
        logger.info(f"Deleted {count} old notifications")
        return count
    except Exception as e:
        logger.error(f"Failed to clean old notifications: {str(e)}")
        return 0

@shared_task
def notify_expiring_discounts():
    """
    Notify users about their discounts that are about to expire
    """
    from apps.safar.models import Discount
    
    try:
        now = timezone.now()
        expiry_threshold = now + timedelta(hours=48)
        
        expiring_discounts = Discount.objects.filter(
            is_active=True,
            valid_to__gt=now,
            valid_to__lte=expiry_threshold
        )
        
        for discount in expiring_discounts:
            if discount.target_users.exists():
                for user in discount.target_users.all():
                    cache_key = f"notified_expiring_discount:{user.id}:{discount.id}"
                    if cache.get(cache_key):
                        continue
                    
                    hours_remaining = int((discount.valid_to - now).total_seconds() / 3600)
                    
                    NotificationService.send_notification.delay(
                        user_id=user.id,
                        notification_type="Discount Expiring Soon",
                        message=f"Your discount code {discount.code} expires in {hours_remaining} hours! Use it before it's gone.",
                        data={
                            'discount_id': str(discount.id),
                            'code': discount.code,
                            'expires_in_hours': hours_remaining,
                            'deep_link': f"/discounts/{discount.code}"
                        }
                    )
                    
                    cache.set(cache_key, True, timeout=86400)
        
        return len(expiring_discounts)
        
    except Exception as e:
        logger.error(f"Failed to notify about expiring discounts: {str(e)}", exc_info=True)
        return 0
