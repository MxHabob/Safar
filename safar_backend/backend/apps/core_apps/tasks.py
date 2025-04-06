from celery import shared_task
from django.contrib.auth import get_user_model
from apps.core_apps.services import NotificationService
from apps.safar.models import Notification,Place
from django.core.cache import cache
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
        if user.profile.notification_push_token:
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
    

@shared_task(bind=True, max_retries=3)
def generate_trending_boxes(self):
    """
    Generate personalized travel boxes based on trending destinations and user preferences.
    Uses a combination of booking data, wishlists, reviews, and manual curation.
    """
    from apps.core_apps.generation_algorithm import BoxGenerator
    from apps.core_apps.helper_algorithm import (
        calculate_trending_destinations,
        get_user_preference_clusters
    )
    from django.db import transaction

    try:
        # 1. Get trending destinations with caching
        logger.info("Calculating trending destinations...")
        destinations = cache.get('trending_destinations')
        
        if not destinations:
            destinations = calculate_trending_destinations()
            cache.set('trending_destinations', destinations, timeout=3600)

        user_clusters = get_user_preference_clusters()
        
        if not user_clusters:
            logger.warning("No user clusters found")
            return

        for (city, country), score in destinations[:10]:
            try:
                with transaction.atomic():
                    places = Place.objects.filter(
                        city=city,
                        country=country,
                        is_available=True
                    ).select_related('city', 'country').order_by('-rating')[:5]

                    if not places:
                        logger.debug(f"No available places for {city}, {country}")
                        continue

                    location = places[0].location
                    place_types = {p.category.name.lower() for p in places}

                    for cluster_name, users in user_clusters.items():
                        if self._should_skip_cluster(cluster_name, place_types):
                            continue

                        for user in users[:200]:
                            try:
                                generator = BoxGenerator(
                                    user=user,
                                    location=location,
                                    query=f"Trending {cluster_name} getaway in {city}"
                                )
                                
                                box = generator.generate_personalized_box()
                                
                                if box:
                                    self._create_box_notification(user, cluster_name, city, box.id)
                                    logger.info(f"Created box {box.id} for user {user.id}")
                            except Exception as e:
                                logger.error(f"Failed to generate box for user {user.id}: {str(e)}")
                                continue

            except Exception as e:
                logger.error(f"Error processing destination {city}: {str(e)}")
                continue

    except Exception as e:
        logger.error(f"Critical error in generate_trending_boxes: {str(e)}")
        self.retry(exc=e, countdown=60 * self.request.retries)

def _should_skip_cluster(self, cluster_name, place_types):
    """Determine if cluster should be skipped based on place types"""
    cluster_name = cluster_name.lower()
    
    skip_conditions = {
        'beach': {'ski', 'snow', 'winter'},
        'ski': {'beach', 'summer', 'tropical'},
        'luxury': {'hostel', 'budget'},
        'adventure': {'spa', 'resort'}
    }
    
    return any(
        forbidden in place_types
        for forbidden in skip_conditions.get(cluster_name, set())
    )

def _create_box_notification(self, user, cluster_name, city, box_id):
    """Create notification about new box"""
    notification = Notification.objects.create(
        user=user,
        type="Personalized Box",
        message=f"We've created a {cluster_name}-themed box for {city}!",
        metadata={
            "box_id": str(box_id),
            "cluster": cluster_name,
            "destination": city
        }
    )
    # Process notification through all channels
    process_notification.delay(notification.id)