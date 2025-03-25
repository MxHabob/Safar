import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.safar.models import Booking, Message, Notification
from apps.safar.serializers import BookingSerializer, MessageSerializer, NotificationSerializer
from apps.core_apps.tasks import process_notification

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

def send_channel_message(group_name, message):
    try:
        async_to_sync(channel_layer.group_send)(group_name, message)
        logger.debug(f"Sent message to group {group_name}: {message}")
    except Exception as e:
        logger.error(f"Error sending message to group {group_name}: {str(e)}")

@receiver(post_save, sender=Booking)
def booking_signals(sender, instance, created, **kwargs):
    if created:
        message_text = f"Your booking #{instance.id} has been created and is pending confirmation."
        try:
            Notification.objects.create(
                user=instance.user,
                type="Booking Created",
                message=message_text
            )
            logger.info(f"Created notification for booking {instance.id}")
        except Exception as e:
            logger.error(f"Failed to create notification for booking {instance.id}: {str(e)}")
    else:
        group = f"bookings_{instance.user.id}"
        data = {
            "type": "booking.update",
            "booking": BookingSerializer(instance).data
        }
        send_channel_message(group, data)

@receiver(post_save, sender=Message)
def message_signals(sender, instance, created, **kwargs):
    if created:
        group = f"messages_{instance.receiver.id}"
        data = {
            "type": "message.new",
            "message": MessageSerializer(instance).data
        }
        send_channel_message(group, data)

@receiver(post_save, sender=Notification)
def notification_signals(sender, instance, created, **kwargs):
    if created:
        serialized_data = NotificationSerializer(instance).data
        groups = [f"notifications_{instance.user.id}", f"safar_{instance.user.id}"]
        for group in groups:
            data = {
                "type": "notification.new",
                "notification": serialized_data
            }
            send_channel_message(group, data)
        
        try:
            process_notification.delay(instance.id)
            logger.info(f"Queued notification {instance.id} for processing")
        except Exception as e:
            logger.error(f"Failed to queue notification {instance.id} for processing: {str(e)}")
