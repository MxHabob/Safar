import logging
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.authentication.models import User, UserProfile, UserInteraction, UserLoginLog
from apps.core_apps.tasks import send_email_task, send_sms_task
from apps.core_apps.services import NotificationService
from phonenumber_field.phonenumber import PhoneNumber
from .points import PointsManager
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create or update the user profile when a user is created or updated.
    """
    if created:
        UserProfile.objects.create(user=instance)
        logger.info(f"Created profile for new user {instance.email}")
        
        # Send welcome notification
        send_welcome_notification(instance)
    
    # Ensure the profile exists (in case it was deleted)
    if not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)
        logger.warning(f"Recreated missing profile for user {instance.email}")

    instance.profile.save()
    logger.debug(f"Updated profile for user {instance.email}")


@receiver(pre_save, sender=UserProfile)
def validate_phone_number(sender, instance, **kwargs):
    """
    Validate and format phone number before saving.
    """
    if instance.phone_number:
        try:
            phone_number = PhoneNumber.from_string(instance.phone_number)
            if not phone_number.is_valid():
                logger.warning(f"Invalid phone number for user {instance.user.id}: {instance.phone_number}")
            instance.phone_number = phone_number
        except Exception as e:
            logger.error(f"Phone number validation failed for user {instance.user.id}: {str(e)}")
            instance.phone_number = None

@receiver(pre_save, sender=UserProfile)
def update_location_data(sender, instance, **kwargs):
    """
    Update country/region/city if location changes significantly.
    """
    if instance.location and (not instance.country or not instance.region or not instance.city):
        try:
            # This is a placeholder - you'll need to implement actual geocoding
            # For example using GeoDjango or a service like Google Maps API
            logger.info(f"Would geocode location for user {instance.user.id}")
        except Exception as e:
            logger.error(f"Failed to geocode location for user {instance.user.id}: {str(e)}")

@receiver(post_save, sender=UserProfile)
def notify_profile_update(sender, instance, created, **kwargs):
    """
    Send notification when profile is updated with important changes.
    """
    if not created:
        try:
            if instance.phone_number and instance.user.email:
                message = _("Your profile has been updated successfully.")
                
                # Send email notification
                send_email_task.delay(
                    subject=_("Profile Updated"),
                    message=message,
                    recipient_list=[instance.user.email]
                )
                
                # Send SMS if phone number exists
                send_sms_task.delay(
                    to_number=str(instance.phone_number),
                    message=_("Profile updated. Contact support if this wasn't you.")
                )
                
                logger.info(f"Sent profile update notifications to user {instance.user.id}")
        except Exception as e:
            logger.error(f"Failed to send profile update notifications: {str(e)}")

@receiver(post_save, sender=UserProfile)
def award_points_for_profile_completion(sender, instance, created, **kwargs):
    """
    Award points when a user completes their profile.
    """
    try:
        if not created and instance.user:
            # Check if profile is now complete
            profile_complete = all([
                instance.avatar,
                instance.bio,
                instance.phone_number,
                instance.country,
                instance.date_of_birth
            ])
            
            if profile_complete:
                # Check if we've already awarded points for this
                from django.core.cache import cache
                cache_key = f"profile_complete_points:{instance.user.id}"
                
                if not cache.get(cache_key):
                    # Create an interaction record
                    interaction = UserInteraction.objects.create(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(instance.user),
                        object_id=instance.user.id,
                        interaction_type='profile_complete',
                        metadata={
                            'profile_id': str(instance.id)
                        }
                    )
                    
                    # Award points based on the interaction
                    PointsManager.award_points_for_interaction(interaction)
                    
                    # Set cache to prevent duplicate awards
                    cache.set(cache_key, True, 60*60*24*365)  # 1 year
                    
                    logger.info(f"Awarded profile completion points to user {instance.user.id}")
    except Exception as e:
        logger.error(f"Error awarding profile completion points: {str(e)}", exc_info=True)

@receiver(post_delete, sender=UserProfile)
def cleanup_profile_data(sender, instance, **kwargs):
    """
    Clean up profile data when profile is deleted.
    """
    try:
        # Delete avatar file if it exists
        if instance.avatar:
            instance.avatar.delete(save=False)
            logger.info(f"Deleted avatar for user {instance.user.id}")
    except Exception as e:
        logger.error(f"Failed to clean up profile data for user {instance.user.id}: {str(e)}")

@receiver(pre_save, sender=User)
def normalize_email(sender, instance, **kwargs):
    """
    Normalize email address before saving.
    """
    if instance.email:
        instance.email = instance.email.lower()

@receiver(pre_save, sender=User)
def handle_role_changes(sender, instance, **kwargs):
    """
    Handle special logic when user roles change.
    """
    if instance.pk:
        try:
            original = User.objects.get(pk=instance.pk)
            if original.role != instance.role:
                logger.info(f"User {instance.email} role changed from {original.role} to {instance.role}")
                # Add any role-specific logic here
                
                # Notify user about role change
                notify_role_change(instance, original.role, instance.role)
        except User.DoesNotExist:
            pass

@receiver(pre_save, sender=User)
def handle_membership_level_changes(sender, instance, **kwargs):
    """
    Handle notifications when membership level changes.
    """
    if instance.pk:
        try:
            original = User.objects.get(pk=instance.pk)
            if original.membership_level != instance.membership_level:
                logger.info(f"User {instance.email} membership changed from {original.membership_level} to {instance.membership_level}")
                
                # Notify user about membership level change
                notify_membership_change(instance, original.membership_level, instance.membership_level)
        except User.DoesNotExist:
            pass

@receiver(post_save, sender=User)
def handle_user_activation(sender, instance, created, **kwargs):
    """
    Handle actions when user is activated or deactivated.
    """
    if not created and instance.pk:
        try:
            original = User.objects.get(pk=instance.pk)
            if original.is_active != instance.is_active:
                if instance.is_active:
                    logger.info(f"User {instance.email} was activated")
                    # Send activation email
                    send_email_task.delay(
                        subject=_("Account Activated"),
                        message=_("Your account has been activated. You can now log in."),
                        recipient_list=[instance.email]
                    )
                else:
                    logger.info(f"User {instance.email} was deactivated")
                    # Send deactivation email
                    send_email_task.delay(
                        subject=_("Account Deactivated"),
                        message=_("Your account has been deactivated. Contact support for more information."),
                        recipient_list=[instance.email]
                    )
        except User.DoesNotExist:
            pass

@receiver(post_save, sender=UserLoginLog)
def handle_user_login(sender, instance, created, **kwargs):
    """
    Handle user login events for points and tracking.
    """
    if created:
        try:
            # Create an interaction record for the login
            from django.contrib.contenttypes.models import ContentType
            
            interaction = UserInteraction.objects.create(
                user=instance.user,
                content_type=ContentType.objects.get_for_model(instance.user),
                object_id=instance.user.id,
                interaction_type='login',
                metadata={
                    'login_id': str(instance.id),
                    'ip_address': instance.ip_address,
                    'device_type': instance.device_type
                }
            )
            
            # Award points for daily login
            PointsManager.award_points_for_interaction(interaction)
            
            logger.info(f"Recorded login interaction for user {instance.user.id}")
        except Exception as e:
            logger.error(f"Error handling user login: {str(e)}", exc_info=True)

@receiver(post_save, sender=UserInteraction)
def handle_user_interaction(sender, instance, created, **kwargs):
    """
    Process user interactions for points and analytics.
    """
    if created:
        try:
            # Award points based on the interaction
            PointsManager.award_points_for_interaction(instance)
            
            logger.debug(f"Processed interaction {instance.interaction_type} for user {instance.user.id}")
        except Exception as e:
            logger.error(f"Error processing user interaction: {str(e)}", exc_info=True)

# New notification functions

def send_welcome_notification(user):
    """
    Send a welcome notification to new users with onboarding information.
    """
    try:
        # Prepare welcome message
        message = _(f"Welcome to {settings.SITE_NAME}! We're excited to help you discover amazing travel experiences.")
        
        # Prepare data for deep linking
        data = {
            "deep_link": "/onboarding",
            "user_id": str(user.id),
            "action": "complete_profile"
        }
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="Welcome",
            message=message,
            data=data,
            immediate=True  # Send immediately for better first impression
        )
        
        logger.info(f"Sent welcome notification to new user {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome notification to user {user.email}: {str(e)}")
        return False

def notify_role_change(user, old_role, new_role):
    """
    Notify user about role change and explain new capabilities.
    """
    try:
        # Prepare role change message
        message = _(f"Your account role has been updated from {old_role} to {new_role}.")
        
        # Add role-specific information
        if new_role == User.Role.OWNER:
            message += _(" You can now list properties and manage bookings.")
            deep_link = "/owner/dashboard"
        elif new_role == User.Role.ORGANIZATION:
            message += _(" You can now manage your organization's properties and team members.")
            deep_link = "/organization/dashboard"
        else:
            deep_link = "/account/profile"
        
        # Prepare data for deep linking
        data = {
            "deep_link": deep_link,
            "old_role": old_role,
            "new_role": new_role
        }
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="Role Update",
            message=message,
            data=data,
            immediate=False
        )
        
        logger.info(f"Sent role change notification to user {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send role change notification to user {user.email}: {str(e)}")
        return False

def notify_membership_change(user, old_level, new_level):
    """
    Notify user about membership level change and explain new benefits.
    """
    try:
        # Prepare membership change message
        message = _(f"Congratulations! Your membership has been upgraded from {old_level} to {new_level}.")
        
        # Add level-specific benefits
        benefits = get_membership_benefits(new_level)
        if benefits:
            message += _(" You now have access to: ") + ", ".join(benefits)
        
        # Prepare data for deep linking
        data = {
            "deep_link": "/account/membership",
            "old_level": old_level,
            "new_level": new_level,
            "benefits": benefits
        }
        
        # Send through notification service with image
        image_url = f"{settings.MEDIA_URL}membership/{new_level.lower()}_badge.png"
        
        NotificationService.send_notification(
            user=user,
            notification_type="Membership Upgrade",
            message=message,
            data=data,
            image_url=image_url,
            immediate=True  # Send immediately for better experience
        )
        
        logger.info(f"Sent membership change notification to user {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send membership change notification to user {user.email}: {str(e)}")
        return False

def get_membership_benefits(level):
    """
    Get list of benefits for a specific membership level.
    """
    benefits = {
        User.MembershipLevel.BRONZE: [
            _("Basic booking features"),
            _("Email support")
        ],
        User.MembershipLevel.SILVER: [
            _("Priority customer support"),
            _("5% discount on bookings"),
            _("Free cancellation up to 24 hours")
        ],
        User.MembershipLevel.GOLD: [
            _("10% discount on all bookings"),
            _("Free cancellation up to 48 hours"),
            _("VIP customer support"),
            _("Early access to new experiences")
        ],
        User.MembershipLevel.PLATINUM: [
            _("15% discount on all bookings"),
            _("Free cancellation up to 72 hours"),
            _("Dedicated travel concierge"),
            _("Exclusive access to premium experiences"),
            _("Free airport transfers")
        ]
    }
    
    return benefits.get(level, [])

# Add these functions to apps/authentication/tasks.py

def send_birthday_notification(user_id):
    """
    Send birthday wishes to users on their birthday.
    """
    try:
        from apps.authentication.models import User
        user = User.objects.get(id=user_id)
        
        # Prepare birthday message
        message = _(f"Happy Birthday, {user.first_name}! 🎂 We hope you have a fantastic day.")
        
        # Add special birthday offer if applicable
        if user.membership_level in [User.MembershipLevel.GOLD, User.MembershipLevel.PLATINUM]:
            message += _(" Check your account for a special birthday discount on your next booking!")
            discount_code = f"BDAY{user.id}"[-8:]
        else:
            discount_code = None
        
        # Prepare data
        data = {
            "deep_link": "/account/offers",
            "discount_code": discount_code
        }
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="Birthday",
            message=message,
            data=data,
            immediate=True
        )
        
        logger.info(f"Sent birthday notification to user {user.email}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for birthday notification")
        return False
    except Exception as e:
        logger.error(f"Failed to send birthday notification to user {user_id}: {str(e)}")
        return False

def send_security_notification(user_id, event_type, ip_address=None, device=None, location=None):
    """
    Send security notifications for important account events.
    """
    try:
        from apps.authentication.models import User
        user = User.objects.get(id=user_id)
        
        # Prepare event-specific message
        if event_type == "login":
            message = _("New login detected on your account.")
        elif event_type == "password_change":
            message = _("Your password was recently changed.")
        elif event_type == "email_change":
            message = _("Your email address was recently updated.")
        elif event_type == "2fa_change":
            message = _("Your two-factor authentication settings were updated.")
        else:
            message = _("A security-related change was made to your account.")
        
        # Add device and location info if available
        details = []
        if device:
            details.append(f"Device: {device}")
        if location:
            details.append(f"Location: {location}")
        if ip_address:
            details.append(f"IP: {ip_address}")
        
        if details:
            message += _(" Details: ") + ", ".join(details)
        
        # Add security notice
        message += _(" If this wasn't you, please contact support immediately.")
        
        # Prepare data
        data = {
            "deep_link": "/account/security",
            "event_type": event_type,
            "timestamp": timezone.now().isoformat()
        }
        
        # Send through notification service - prioritize SMS for security
        if hasattr(user, 'profile') and user.profile.phone_number:
            # Send SMS directly for immediate security notification
            NotificationService.send_sms(
                to_number=str(user.profile.phone_number),
                message=message[:160]  # SMS length limit
            )
        
        # Also send email and push
        NotificationService.send_notification(
            user=user,
            notification_type="Security Alert",
            message=message,
            data=data,
            immediate=True
        )
        
        logger.info(f"Sent security notification to user {user.email} for {event_type}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for security notification")
        return False
    except Exception as e:
        logger.error(f"Failed to send security notification to user {user_id}: {str(e)}")
        return False

def send_inactivity_reminder(user_id, days_inactive):
    """
    Send reminder to users who haven't logged in for a while.
    """
    try:
        from apps.authentication.models import User
        user = User.objects.get(id=user_id)
        
        # Prepare message based on inactivity duration
        if days_inactive <= 30:
            message = _("We miss you! It's been a while since you last visited us.")
        elif days_inactive <= 60:
            message = _("We haven't seen you in 2 months! Check out what's new.")
        else:
            message = _("It's been over 3 months since your last visit. We have exciting new destinations waiting for you!")
        
        # Add personalized recommendations if available
        from apps.safar.models import Place
        recommended_places = Place.objects.filter(
            country__in=user.profile.preferred_countries.all()
        ).order_by('?')[:3]
        
        if recommended_places:
            place_names = [place.name for place in recommended_places]
            message += _(" Popular destinations you might like: ") + ", ".join(place_names)
        
        # Prepare data
        data = {
            "deep_link": "/discover",
            "days_inactive": days_inactive,
            "recommended_places": [str(place.id) for place in recommended_places] if recommended_places else []
        }
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="We Miss You",
            message=message,
            data=data,
            immediate=False
        )
        
        logger.info(f"Sent inactivity reminder to user {user.email} ({days_inactive} days inactive)")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for inactivity reminder")
        return False
    except Exception as e:
        logger.error(f"Failed to send inactivity reminder to user {user_id}: {str(e)}")
        return False

def send_travel_preference_suggestions(user_id):
    """
    Send personalized travel suggestions based on user preferences
    using the advanced RecommendationEngine.
    """
    try:
        from apps.authentication.models import User
        from apps.safar.models import Place, Experience
        from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine
        
        user = User.objects.get(id=user_id)
        
        # Skip if user has no preferences
        if not hasattr(user, 'profile') or not user.profile.travel_interests:
            logger.info(f"User {user.email} has no travel preferences set, skipping suggestions")
            return False
        
        # Initialize the recommendation engine
        recommendation_engine = RecommendationEngine(user)
        
        # Get personalized recommendations using the engine
        suggested_places = recommendation_engine.recommend_places(limit=3)
        suggested_experiences = recommendation_engine.recommend_experiences(limit=3)
        
        # Skip if no matches found
        if not suggested_places and not suggested_experiences:
            logger.info(f"No matching suggestions found for user {user.email}")
            return False
        
        # Prepare message
        message = _("Based on your travel preferences and activity, we've found these recommendations just for you:")
        
        if suggested_places:
            message += "\n\n🏨 Places you might love:"
            for place in suggested_places:
                message += f"\n• {place.name} in {place.city.name if place.city else place.country.name if place.country else 'Unknown'}"
                if place.rating:
                    message += f" ({place.rating}★)"
        
        if suggested_experiences:
            message += "\n\n🌟 Experiences to discover:"
            for exp in suggested_experiences:
                message += f"\n• {exp.title}"
                if exp.place:
                    message += f" in {exp.place.name}"
                if exp.rating:
                    message += f" ({exp.rating}★)"
        
        # Add personalization explanation
        interests = ", ".join(user.profile.travel_interests[:3])
        if interests:
            message += f"\n\nThese recommendations match your interests in {interests}."
        
        # Prepare data for deep linking
        data = {
            "deep_link": "/recommendations",
            "suggested_places": [str(place.id) for place in suggested_places],
            "suggested_experiences": [str(exp.id) for exp in suggested_experiences],
            "recommendation_source": "ml_engine"
        }
        
        # Get a featured image if available
        image_url = None
        if suggested_places and suggested_places[0].media.filter(type='photo').exists():
            image = suggested_places[0].media.filter(type='photo').first()
            image_url = image.url or (image.file.url if image.file else None)
        elif suggested_experiences and suggested_experiences[0].media.filter(type='photo').exists():
            image = suggested_experiences[0].media.filter(type='photo').first()
            image_url = image.url or (image.file.url if image.file else None)
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="Personalized Recommendations",
            message=message,
            data=data,
            image_url=image_url,
            immediate=False
        )
        
        # Log recommendation details for analytics
        logger.info(
            f"Sent ML-powered recommendations to user {user.email}: "
            f"{len(suggested_places)} places, {len(suggested_experiences)} experiences"
        )
        
        # Track this as a user interaction for future recommendations
        if suggested_places or suggested_experiences:
            try:
                from apps.authentication.models import UserInteraction
                from django.contrib.contenttypes.models import ContentType
                
                UserInteraction.objects.create(
                    user=user,
                    content_type=ContentType.objects.get_for_model(User),
                    object_id=user.id,
                    interaction_type="recommendation_show",
                    metadata={
                        "recommendation_type": "personalized",
                        "places_count": len(suggested_places),
                        "experiences_count": len(suggested_experiences),
                        "engine": "ml_recommendation_engine"
                    }
                )
            except Exception as e:
                logger.error(f"Failed to log recommendation interaction: {str(e)}")
        
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for travel preference suggestions")
        return False
    except Exception as e:
        logger.error(f"Failed to send travel preference suggestions to user {user_id}: {str(e)}", exc_info=True)
        return False

def send_account_milestone_notification(user_id, milestone_type):
    """
    Send notification for account milestones like anniversaries or achievements.
    """
    try:
        from apps.authentication.models import User
        user = User.objects.get(id=user_id)
        
        # Prepare milestone-specific message
        if milestone_type == "account_anniversary":
            # Calculate years
            years = (timezone.now().date() - user.created_at.date()).days // 365
            
            if years == 1:
                message = _("Happy 1 year anniversary with us! Thank you for being a valued member.")
            else:
                message = _(f"Happy {years} year anniversary with us! Thank you for your continued trust.")
                
            # Add reward if applicable
            if years >= 2:
                message += _(" We've added a special discount to your account as a thank you gift.")
        
        elif milestone_type == "points_milestone":
            # For point milestones (e.g., reaching 1000 points)
            message = _(f"Congratulations! You've reached {user.points} points.")
            
            # Add next tier info if applicable
            next_tier_points = 0
            if user.membership_level == User.MembershipLevel.BRONZE:
                next_tier_points = 1000
            elif user.membership_level == User.MembershipLevel.SILVER:
                next_tier_points = 5000
            elif user.membership_level == User.MembershipLevel.GOLD:
                next_tier_points = 10000
                
            if next_tier_points > 0:
                points_needed = next_tier_points - user.points
                message += _(f" You're just {points_needed} points away from the next membership level!")
        
        elif milestone_type == "bookings_milestone":
            # For booking count milestones
            from apps.safar.models import Booking
            booking_count = Booking.objects.filter(user=user, status="Confirmed").count()
            
            message = _(f"Wow! You've completed {booking_count} bookings with us.")
            if booking_count >= 10:
                message += _(" You're now eligible for our loyalty program benefits!")
        
        else:
            message = _("Congratulations on your achievement!")
        
        # Prepare data
        data = {
            "deep_link": "/account/achievements",
            "milestone_type": milestone_type
        }
        
        # Send through notification service
        NotificationService.send_notification(
            user=user,
            notification_type="Achievement",
            message=message,
            data=data,
            immediate=True
        )
        
        logger.info(f"Sent account milestone notification to user {user.email} for {milestone_type}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for account milestone notification")
        return False
    except Exception as e:
        logger.error(f"Failed to send account milestone notification to user {user_id}: {str(e)}")
        return False

# Add these signal handlers to your existing signals.py file

@receiver(post_save, sender='safar.Booking')
def award_points_for_booking(sender, instance, created, **kwargs):
    """
    Award points when a booking is created or confirmed.
    """
    try:
        if not created and instance.status == "Confirmed" and instance.user:
            # Award base points for completing a booking
            PointsManager.award_points(
                user=instance.user,
                action='booking_complete',
                metadata={
                    'booking_id': str(instance.id),
                    'booking_type': instance.get_booking_type()
                }
            )
            
            # Award points based on booking value
            if instance.total_price:
                PointsManager.award_points(
                    user=instance.user,
                    action='booking_value',
                    metadata={
                        'amount': str(instance.total_price),
                        'currency': instance.currency,
                        'booking_id': str(instance.id)
                    }
                )
                
            logger.info(f"Awarded booking points to user {instance.user.id} for booking {instance.id}")
    except Exception as e:
        logger.error(f"Error awarding booking points: {str(e)}", exc_info=True)

@receiver(post_save, sender='safar.Review')
def award_points_for_review(sender, instance, created, **kwargs):
    """
    Award points when a user submits a review.
    """
    try:
        if created and instance.user:
            # Base points for adding a review
            PointsManager.award_points(
                user=instance.user,
                action='review_add',
                metadata={
                    'review_id': str(instance.id),
                    'rating': instance.rating
                }
            )
            
            # Bonus points if review has photos
            if hasattr(instance, 'media') and instance.media.filter(type='photo').exists():
                PointsManager.award_points(
                    user=instance.user,
                    action='review_with_photo',
                    metadata={
                        'review_id': str(instance.id),
                        'photo_count': instance.media.filter(type='photo').count()
                    }
                )
                
            logger.info(f"Awarded review points to user {instance.user.id} for review {instance.id}")
    except Exception as e:
        logger.error(f"Error awarding review points: {str(e)}", exc_info=True)

@receiver(post_save, sender='safar.Wishlist')
def award_points_for_wishlist(sender, instance, created, **kwargs):
    """
    Award points when a user adds an item to their wishlist.
    """
    try:
        if created and instance.user:
            # Determine what type of item was added
            item_type = None
            item_id = None
            
            if instance.place:
                item_type = 'place'
                item_id = str(instance.place.id)
            elif instance.experience:
                item_type = 'experience'
                item_id = str(instance.experience.id)
            elif instance.flight:
                item_type = 'flight'
                item_id = str(instance.flight.id)
            elif instance.box:
                item_type = 'box'
                item_id = str(instance.box.id)
            
            if item_type and item_id:
                PointsManager.award_points(
                    user=instance.user,
                    action='add_wishlist',
                    metadata={
                        'item_type': item_type,
                        'item_id': item_id
                    }
                )
                
                logger.info(f"Awarded wishlist points to user {instance.user.id} for {item_type} {item_id}")
    except Exception as e:
        logger.error(f"Error awarding wishlist points: {str(e)}", exc_info=True)

@receiver(post_save, sender='authentication.UserInteraction')
def award_points_for_interaction(sender, instance, created, **kwargs):
    """
    Award points for various user interactions.
    """
    try:
        if created and instance.user:
            # Map interaction types to point actions
            interaction_to_action = {
                'view_place': 'view_place',
                'view_experience': 'view_experience',
                'share': 'share_item',
                'search': 'search_perform'
            }
            
            action = interaction_to_action.get(instance.interaction_type)
            
            if action:
                # Check for daily limits on certain actions
                if action in ['view_place', 'view_experience', 'search_perform']:
                    # Get count of this action today for this user
                    today = timezone.now().date()
                    count = UserInteraction.objects.filter(
                        user=instance.user,
                        interaction_type=instance.interaction_type,
                        created_at__date=today
                    ).count()
                    
                    # Apply daily limits
                    daily_limits = {
                        'view_place': 10,
                        'view_experience': 10,
                        'search_perform': 5
                    }
                    
                    if count > daily_limits.get(action, 0):
                        # Exceeded daily limit
                        return
                
                PointsManager.award_points(
                    user=instance.user,
                    action=action,
                    metadata={
                        'interaction_type': instance.interaction_type,
                        'content_type': str(instance.content_type),
                        'object_id': str(instance.object_id)
                    }
                )
                
                logger.info(f"Awarded interaction points to user {instance.user.id} for {instance.interaction_type}")
    except Exception as e:
        logger.error(f"Error awarding interaction points: {str(e)}", exc_info=True)

# Daily login points
@receiver(post_save, sender='authentication.UserLoginLog')
def award_points_for_login(sender, instance, created, **kwargs):
    """
    Award points for daily logins.
    """
    try:
        if created and instance.user:
            # Check if user already got login points today
            today = timezone.now().date()
            
            # Get or create a cache key for today's login
            from django.core.cache import cache
            cache_key = f"daily_login_points:{instance.user.id}:{today.isoformat()}"
            
            if not cache.get(cache_key):
                # Award points for daily login
                PointsManager.award_points(
                    user=instance.user,
                    action='daily_login',
                    metadata={
                        'login_date': today.isoformat(),
                        'login_id': str(instance.id)
                    }
                )
                
                # Set cache to prevent duplicate awards
                cache.set(cache_key, True, 60*60*24)  # 24 hours
                
                logger.info(f"Awarded daily login points to user {instance.user.id}")
    except Exception as e:
        logger.error(f"Error awarding login points: {str(e)}", exc_info=True)

@receiver(post_save, sender=UserProfile)
def award_points_for_profile_completion(sender, instance, created, **kwargs):
    """
    Award points when a user completes their profile.
    """
    try:
        if not created and instance.user:
            # Check if profile is now complete
            profile_complete = all([
                instance.avatar,
                instance.bio,
                instance.phone_number,
                instance.country,
                instance.date_of_birth
            ])
            
            if profile_complete:
                # Check if we've already awarded points for this
                from django.core.cache import cache
                cache_key = f"profile_complete_points:{instance.user.id}"
                
                if not cache.get(cache_key):
                    PointsManager.award_points(
                        user=instance.user,
                        action='profile_complete',
                        metadata={
                            'profile_id': str(instance.id)
                        }
                    )
                    
                    # Set cache to prevent duplicate awards
                    cache.set(cache_key, True, 60*60*24*365)  # 1 year
                    
                    logger.info(f"Awarded profile completion points to user {instance.user.id}")
    except Exception as e:
        logger.error(f"Error awarding profile completion points: {str(e)}", exc_info=True)
