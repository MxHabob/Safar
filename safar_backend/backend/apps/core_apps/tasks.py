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
    Enhanced email task with:
    - Better retry logic
    - Context support
    - Improved logging
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
    Enhanced SMS task with:
    - Number validation
    - Better retry logic
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
def send_push_notification_task(self, user_id, title, message, data=None):
    """
    Enhanced push notification task with:
    - User validation
    - Better error handling
    """
    try:
        user = User.objects.get(id=user_id)
        success = NotificationService.send_push_notification(
            user=user,
            title=title,
            message=message,
            data=data
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

@shared_task
def process_notification(notification_id):
    """
    Enhanced notification processing with:
    - Better state management
    - Comprehensive logging
    - Error recovery
    """
    from apps.safar.models import Notification
    
    try:
        notification = Notification.objects.get(id=notification_id)
        user = notification.user
        
        if notification.is_read:
            logger.info(f"Notification {notification_id} already processed")
            return True
            
        notification.processing_started = timezone.now()
        notification.save()
        
        context = {
            'notification': notification,
            'user': user,
            'action_url': notification.metadata.get('deep_link', settings.SITE_URL)
        }
        
        results = {}
        
        if user.email:
            results['email'] = send_email_task.delay(
                subject=f"Notification: {notification.type}",
                message=notification.message,
                recipient_list=[user.email],
                context=context
            )
            
        if hasattr(user, 'profile') and user.profile.phone_number:
            results['sms'] = send_sms_task.delay(
                to_number=str(user.profile.phone_number),
                message=f"{notification.type}: {notification.message[:120]}..."
            )
            
        if hasattr(user, 'profile') and user.profile.notification_push_token:
            results['push'] = send_push_notification_task.delay(
                user_id=user.id,
                title=notification.type,
                message=notification.message,
                data=notification.metadata
            )
        
        notification.is_read = True
        notification.processed_at = timezone.now()
        notification.channels = [k for k, v in results.items() if v]
        notification.save()
        
        return True
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return False
    except Exception as e:
        logger.error(f"Failed to process notification {notification_id}: {str(e)}", exc_info=True)
        return False

@shared_task(bind=True, max_retries=3)
def generate_trending_boxes(self):
    """
    Enhanced box generation with:
    - Better progress tracking
    - Improved error handling
    - Resource management
    """
    from apps.core_apps.generation_algorithm import BoxGenerator
    from apps.core_apps.helper_algorithm import (
        calculate_trending_destinations,
        get_user_preference_clusters
    )
    
    try:
        logger.info("Starting trending box generation")
        destinations = cache.get('trending_destinations')
        
        if not destinations:
            logger.info("Calculating fresh trending destinations")
            destinations = calculate_trending_destinations()
            cache.set('trending_destinations', destinations, timeout=3600)
        
        user_clusters = get_user_preference_clusters()
        if not user_clusters:
            logger.warning("No user clusters found - using default")
            user_clusters = {'general': User.objects.filter(is_active=True)[:100]}
        
        
        for i, ((city, country), score) in enumerate(destinations[:10], 1):
            try:
                with transaction.atomic():
                    self._process_destination(
                        city, country, score, user_clusters
                    )
                    
            except Exception as e:
                logger.error(f"Error processing {city}: {str(e)}", exc_info=True)
                continue
                
        return True
        
    except Exception as e:
        logger.error(f"Critical error in box generation: {str(e)}", exc_info=True)

        self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 3600))
        return False

def _process_destination(self, city, country, score, user_clusters, log_entry):
    """Process a single destination for box generation"""
    from apps.safar.models import Place
    
    logger.info(f"Processing {city}, {country} with score {score}")
    
    places = Place.objects.filter(
        city=city,
        country=country,
        is_available=True
    ).select_related('city', 'country').prefetch_related('media')[:5]

    if not places:
        logger.debug(f"No available places for {city}, {country}")
        return

    location = places[0].location
    place_categories = {p.category.name.lower() for p in places}
    
    for cluster_name, users in user_clusters.items():
        if self._should_skip_cluster(cluster_name, place_categories):
            continue
            
        for user in users[:50]:
            try:
                box = self._generate_user_box(user, location, city, cluster_name)
                if box:
                    self._send_box_notification(user, box, cluster_name, city)
                    log_entry.boxes_created += 1
                    log_entry.save()
            except Exception as e:
                logger.error(f"Failed for user {user.id}: {str(e)}")
                continue

def _generate_user_box(self, user, location, city, cluster_name):
    """Generate a box for a specific user with timeout"""
    from apps.core_apps.generation_algorithm import BoxGenerator
    import signal
    
    class TimeoutException(Exception):
        pass
        
    def timeout_handler(signum, frame):
        raise TimeoutException("Box generation timed out")
    
    try:
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(30) 
        
        generator = BoxGenerator(
            user=user,
            location=location,
            query=f"{cluster_name.title()} experience in {city}"
        )
        box = generator.generate_personalized_box()
        
        signal.alarm(0)
        return box
        
    except TimeoutException:
        logger.warning(f"Box generation timeout for user {user.id}")
        return None
    finally:
        signal.alarm(0)

def _send_box_notification(self, user, box, cluster_name, city):
    """Send enhanced box notification with tracking"""
    from apps.safar.models import Notification
    
    notification = Notification.objects.create(
        user=user,
        box=box,
        type="Personalized Box",
        message=f"We've created a {cluster_name}-themed box for {city}!",
        metadata={
            "box_id": str(box.id),
            "cluster": cluster_name,
            "destination": city,
            "deep_link": f"/boxes/{box.id}",
            "image_url": box.media.first().url if box.media.exists() else None
        }
    )
    
    process_notification.delay(notification.id)

def _should_skip_cluster(self, cluster_name, place_categories):
    """Enhanced cluster skipping logic"""
    cluster_name = cluster_name.lower()
    
    skip_rules = {
        'beach': {'ski', 'snow', 'winter', 'cold'},
        'ski': {'beach', 'summer', 'tropical', 'warm'},
        'luxury': {'hostel', 'budget', 'cheap'},
        'adventure': {'spa', 'resort', 'relax'},
        'family': {'adult', 'party', 'nightclub'}
    }
    
    forbidden_categories = skip_rules.get(cluster_name, set())
    return not place_categories.isdisjoint(forbidden_categories)