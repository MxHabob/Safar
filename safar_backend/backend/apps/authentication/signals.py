# apps/authentication/signals.py
import logging
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile
from apps.core_apps.tasks import send_email_task, send_sms_task
from phonenumber_field.phonenumber import PhoneNumber

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create or update the user profile when a user is created or updated.
    """
    if created:
        UserProfile.objects.create(user=instance)
        logger.info(f"Created profile for new user {instance.email}")
    
    # Ensure the profile exists (in case it was deleted)
    if not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)
        logger.warning(f"Recreated missing profile for user {instance.email}")

    instance.profile.save()
    logger.debug(f"Updated profile for user {instance.email}")

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """
    Send welcome email to new users.
    """
    if created and instance.email:
        try:
            subject = _("Welcome to %(site_name)s") % {'site_name': settings.SITE_NAME}
            message = render_to_string('../core_apps/emails/welcome.html', {
                'user': instance,
                'site_name': settings.SITE_NAME,
                'support_email': settings.SUPPORT_EMAIL
            })
            
            send_email_task.delay(
                subject=subject,
                message=strip_tags(message),
                recipient_list=[instance.email],
                html_message=message
            )
            logger.info(f"Sent welcome email to {instance.email}")
        except Exception as e:
            logger.error(f"Failed to send welcome email to {instance.email}: {str(e)}")

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