# apps/notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.safar.models import Notification
from apps.core_apps.tasks import process_notification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notification)
def handle_new_notification(sender, instance, created, **kwargs):
    if created:
        try:
            process_notification.delay(instance.id)
            logger.info(f"Queued notification {instance.id} for processing")
        except Exception as e:
            logger.error(f"Failed to queue notification {instance.id}: {str(e)}")


@receiver(post_save, sender='safar.Booking')
def notify_booking_created(sender, instance, created, **kwargs):
    if created:
        message = f"Your booking #{instance.id} has been created and is pending confirmation."
        Notification.objects.create(
            user=instance.user,
            type="Booking Created",
            message=message
        )