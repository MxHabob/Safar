import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task
def check_user_birthdays():
    """
    Daily task to check for user birthdays and send notifications.
    """
    try:
        today = timezone.now().date()
        
        # Find users with birthdays today
        birthday_users = User.objects.filter(
            profile__date_of_birth__month=today.month,
            profile__date_of_birth__day=today.day,
            is_active=True
        )
        
        for user in birthday_users:
            from apps.authentication.signals import send_birthday_notification
            send_birthday_notification(user.id)
            
        logger.info(f"Processed {birthday_users.count()} birthday notifications")
        return birthday_users.count()
    except Exception as e:
        logger.error(f"Failed to process birthday notifications: {str(e)}")
        return 0

@shared_task
def check_inactive_users():
    """
    Weekly task to identify inactive users and send reminders.
    """
    try:
        now = timezone.now()
        
        # Find users inactive for 30, 60, and 90 days
        thresholds = [30, 60, 90]
        total_sent = 0
        
        for days in thresholds:
            threshold_date = now - timedelta(days=days)
            
            inactive_users = User.objects.filter(
                last_activity__lt=threshold_date,
                is_active=True
            ).exclude(
                # Exclude users who received a reminder in the last 30 days
                notifications__type="We Miss You",
                notifications__created_at__gt=now - timedelta(days=30)
            )
            
            for user in inactive_users:
                from apps.authentication.signals import send_inactivity_reminder
                send_inactivity_reminder(user.id, days)
                total_sent += 1
                
        logger.info(f"Processed {total_sent} inactivity reminders")
        return total_sent
    except Exception as e:
        logger.error(f"Failed to process inactivity reminders: {str(e)}")
        return 0

@shared_task
def check_account_anniversaries():
    """
    Daily task to check for account anniversaries and send notifications.
    """
    try:
        today = timezone.now().date()
        
        # Find users with account anniversaries today (1+ years)
        anniversary_users = User.objects.filter(
            created_at__month=today.month,
            created_at__day=today.day,
            created_at__year__lt=today.year,  # Only users with 1+ year accounts
            is_active=True
        )
        
        for user in anniversary_users:
            # Calculate years
            years = (today - user.created_at.date()).days // 365
            
            if years >= 1:  # Only celebrate 1+ year anniversaries
                from apps.authentication.signals import send_account_milestone_notification
                send_account_milestone_notification(user.id, "account_anniversary")
                
        logger.info(f"Processed {anniversary_users.count()} account anniversary notifications")
        return anniversary_users.count()
    except Exception as e:
        logger.error(f"Failed to process account anniversary notifications: {str(e)}")
        return 0

@shared_task
def send_personalized_recommendations():
    """
    Weekly task to send personalized travel recommendations based on user preferences
    using the advanced RecommendationEngine.
    """
    try:
        # Find active users with travel preferences set
        users_with_preferences = User.objects.filter(
            is_active=True,
            profile__travel_interests__isnull=False
        ).exclude(
            # Exclude users who received recommendations in the last 14 days
            notifications__type="Personalized Recommendations",
            notifications__created_at__gt=timezone.now() - timedelta(days=14)
        )[:100]  # Process in batches
        
        for user in users_with_preferences:
            from apps.authentication.signals import send_travel_preference_suggestions
            send_travel_preference_suggestions(user.id)
            
        logger.info(f"Processed {users_with_preferences.count()} personalized recommendations")
        return users_with_preferences.count()
    except Exception as e:
        logger.error(f"Failed to process personalized recommendations: {str(e)}")
        return 0

@shared_task
def check_points_milestones():
    """
    Daily task to check for users reaching point milestones.
    """
    try:
        # Define point milestones
        milestones = [1000, 5000, 10000, 25000, 50000]
        total_sent = 0
        
        for milestone in milestones:
            # Find users who just crossed this milestone
            milestone_users = User.objects.filter(
                points__gte=milestone,
                points__lt=milestone + 100,  # Small range to catch recent crossings
                is_active=True
            ).exclude(
                # Exclude users who already received this milestone notification
                notifications__type="Achievement",
                notifications__metadata__contains={"milestone_type": "points_milestone", "points": milestone}
            )
            
            for user in milestone_users:
                from apps.authentication.signals import send_account_milestone_notification
                send_account_milestone_notification(user.id, "points_milestone")
                total_sent += 1
                
        logger.info(f"Processed {total_sent} points milestone notifications")
        return total_sent
    except Exception as e:
        logger.error(f"Failed to process points milestone notifications: {str(e)}")
        return 0

@shared_task
def check_booking_milestones():
    """
    Weekly task to check for users reaching booking count milestones.
    """
    try:
        from apps.safar.models import Booking
        
        # Define booking milestones
        milestones = [5, 10, 25, 50, 100]
        total_sent = 0
        
        for milestone in milestones:
            # Find users with exactly this many confirmed bookings
            from django.db.models import Count
            
            users_with_milestone = User.objects.annotate(
                booking_count=Count('bookings', filter=Q(bookings__status="Confirmed"))
            ).filter(
                booking_count=milestone,
                is_active=True
            ).exclude(
                # Exclude users who already received this milestone notification
                notifications__type="Achievement",
                notifications__metadata__contains={"milestone_type": "bookings_milestone", "count": milestone}
            )
            
            for user in users_with_milestone:
                from apps.authentication.signals import send_account_milestone_notification
                send_account_milestone_notification(user.id, "bookings_milestone")
                total_sent += 1
                
        logger.info(f"Processed {total_sent} booking milestone notifications")
        return total_sent
    except Exception as e:
        logger.error(f"Failed to process booking milestone notifications: {str(e)}")
        return 0
