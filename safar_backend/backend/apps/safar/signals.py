import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.safar.models import Booking, Message, Notification, Payment, Review,Discount
from apps.safar.serializers import BookingSerializer, MessageSerializer, NotificationSerializer
from apps.core_apps.tasks import process_notification, send_email_task
from apps.authentication.middleware import User
from apps.core_apps.services import NotificationService

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

def send_channel_message(group_name, message_type, data):
    """
    Send a message to a channel group with proper error handling
    """
    try:
        message = {
            "type": message_type,
            "data": data
        }
        async_to_sync(channel_layer.group_send)(group_name, message)
        logger.debug(f"Sent {message_type} to group {group_name}")
        return True
    except Exception as e:
        logger.error(f"Error sending {message_type} to group {group_name}: {str(e)}")
        return False

@receiver(post_save, sender=Booking)
def booking_signals(sender, instance, created, **kwargs):
    """
    Handle booking creation and updates:
    - Create notifications for new bookings
    - Send real-time updates for booking changes
    - Send email confirmations for important status changes
    """
    try:
        # For new bookings
        if created:
            # Create notification
            message = f"Your booking #{instance.id} has been created and is pending confirmation."
            notification = Notification.objects.create(
                user=instance.user,
                type="Booking Created",
                message=message,
                metadata={
                    'booking_id': str(instance.id),
                    'deep_link': f"/bookings/{instance.id}",
                    'status': instance.status,
                    'entity_type': _get_booking_entity_type(instance)
                }
            )
            
            # Process notification asynchronously
            process_notification.delay(notification.id)
            
            logger.info(f"Created notification for new booking {instance.id}")
            
        # For booking updates
        else:
            # Get original booking to check for changes
            try:
                original = Booking.objects.get(id=instance.id)
                status_changed = original.status != instance.status
            except Booking.DoesNotExist:
                status_changed = False
            
            # If status changed, create a notification
            if status_changed:
                message = f"Your booking #{instance.id} status has changed to {instance.status}."
                
                # Create notification with high priority for status changes
                notification = Notification.objects.create(
                    user=instance.user,
                    type=f"Booking {instance.status}",
                    message=message,
                    metadata={
                        'booking_id': str(instance.id),
                        'deep_link': f"/bookings/{instance.id}",
                        'status': instance.status,
                        'entity_type': _get_booking_entity_type(instance),
                        'priority': 'high'
                    }
                )
                
                # Process notification immediately for important status changes
                if instance.status in ['Confirmed', 'Cancelled']:
                    process_notification.delay(notification.id)
                    
                    # Also send an immediate email for important status changes
                    if instance.status == 'Confirmed':
                        send_email_task.delay(
                            subject="Booking Confirmed",
                            message=f"Your booking #{instance.id} has been confirmed.",
                            recipient_list=[instance.user.email],
                            context={
                                'booking': BookingSerializer(instance).data,
                                'user': instance.user,
                                'action_url': f"/bookings/{instance.id}"
                            }
                        )
            
            # Send real-time update via WebSocket
            group = f"bookings_{instance.user.id}"
            send_channel_message(
                group_name=group,
                message_type="booking.update",
                data=BookingSerializer(instance).data
            )
            
    except Exception as e:
        logger.error(f"Error in booking signal for booking {instance.id}: {str(e)}", exc_info=True)

def _get_booking_entity_type(booking):
    """Helper to determine the entity type of a booking"""
    if booking.place:
        return 'place'
    elif booking.experience:
        return 'experience'
    elif booking.flight:
        return 'flight'
    elif booking.box:
        return 'box'
    return 'unknown'

@receiver(post_save, sender=Message)
def message_signals(sender, instance, created, **kwargs):
    """
    Handle new messages:
    - Send real-time updates via WebSocket
    - Create notifications for new messages
    - Send email alerts for unread messages
    """
    if created:
        try:
            # Send real-time update via WebSocket
            group = f"messages_{instance.receiver.id}"
            send_channel_message(
                group_name=group,
                message_type="message.new",
                data=MessageSerializer(instance).data
            )
            
            # Create notification for new message
            notification = Notification.objects.create(
                user=instance.receiver,
                type="New Message",
                message=f"New message from {instance.sender.get_full_name()}",
                metadata={
                    'message_id': str(instance.id),
                    'sender_id': str(instance.sender.id),
                    'sender_name': instance.sender.get_full_name(),
                    'deep_link': f"/messages/{instance.sender.id}",
                    'preview': instance.message_text[:100] + ('...' if len(instance.message_text) > 100 else '')
                }
            )
            
            # Process notification based on user preferences
            # For messages, we typically want immediate notifications
            if hasattr(instance.receiver, 'profile') and instance.receiver.profile.wants_push_notifications:
                process_notification.delay(notification.id)
            
            logger.info(f"Created notification for new message {instance.id}")
            
        except Exception as e:
            logger.error(f"Error in message signal for message {instance.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Notification)
def notification_signals(sender, instance, created, **kwargs):
    """
    Handle new notifications:
    - Send real-time updates via WebSocket
    - Process high-priority notifications immediately
    """
    if created:
        try:
            # Serialize notification
            serialized_data = NotificationSerializer(instance).data
            
            # Send real-time update via WebSocket to user's notification channel
            groups = [f"notifications_{instance.user.id}", f"safar_{instance.user.id}"]
            for group in groups:
                send_channel_message(
                    group_name=group,
                    message_type="notification.new",
                    data=serialized_data
                )
            
            # Process high-priority notifications immediately
            if instance.metadata.get('priority') == 'high':
                process_notification.delay(instance.id)
            # For normal priority, process based on notification type
            elif instance.type in ['Booking Confirmed', 'Payment Received', 'New Message']:
                process_notification.delay(instance.id)
            
            logger.info(f"Created notification {instance.id} of type {instance.type}")
            
        except Exception as e:
            logger.error(f"Error in notification signal for notification {instance.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Payment)
def payment_signals(sender, instance, created, **kwargs):
    """
    Handle payment events:
    - Create notifications for new payments
    - Update booking payment status
    - Send payment receipts
    """
    if created or instance.payment_status == 'Completed':
        try:
            # Create notification for payment
            message = f"Payment of {instance.amount} {instance.currency} has been {instance.payment_status.lower()}."
            
            notification = Notification.objects.create(
                user=instance.user,
                type="Payment Update",
                message=message,
                metadata={
                    'payment_id': str(instance.id),
                    'booking_id': str(instance.booking.id) if instance.booking else None,
                    'amount': float(instance.amount),
                    'currency': instance.currency,
                    'status': instance.payment_status,
                    'deep_link': f"/payments/{instance.id}",
                    'priority': 'high' if instance.payment_status == 'Completed' else 'normal'
                }
            )
            
            # Process payment notifications immediately
            process_notification.delay(notification.id)
            
            # If payment completed, send receipt email
            if instance.payment_status == 'Completed':
                send_email_task.delay(
                    subject="Payment Receipt",
                    message=f"Your payment of {instance.amount} {instance.currency} has been processed successfully.",
                    recipient_list=[instance.user.email],
                    context={
                        'payment': {
                            'id': str(instance.id),
                            'amount': float(instance.amount),
                            'currency': instance.currency,
                            'payment_method': instance.payment_method,
                            'transaction_id': instance.transaction_id,
                            'date': instance.created_at.strftime('%Y-%m-%d %H:%M')
                        },
                        'booking': BookingSerializer(instance.booking).data if instance.booking else None,
                        'user': instance.user
                    }
                )
            
            logger.info(f"Created notification for payment {instance.id}")
            
        except Exception as e:
            logger.error(f"Error in payment signal for payment {instance.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Review)
def review_signals(sender, instance, created, **kwargs):
    """
    Handle new reviews:
    - Notify owners of places/experiences about new reviews
    - Update average ratings
    """
    if created:
        try:
            # Determine the owner to notify
            owner = None
            entity_type = None
            entity_name = None
            
            if instance.place:
                owner = instance.place.owner
                entity_type = 'place'
                entity_name = instance.place.name
            elif instance.experience:
                owner = instance.experience.owner
                entity_type = 'experience'
                entity_name = instance.experience.title
            
            # If we have an owner, create a notification
            if owner:
                message = f"New {instance.rating}-star review for your {entity_type} '{entity_name}'."
                
                notification = Notification.objects.create(
                    user=owner,
                    type="New Review",
                    message=message,
                    metadata={
                        'review_id': str(instance.id),
                        'entity_type': entity_type,
                        'entity_id': str(instance.place.id if instance.place else instance.experience.id),
                        'entity_name': entity_name,
                        'rating': instance.rating,
                        'deep_link': f"/{entity_type}s/{instance.place.id if instance.place else instance.experience.id}/reviews"
                    }
                )
                
                # Process notification
                process_notification.delay(notification.id)
                
                logger.info(f"Created notification for review {instance.id}")
                
            # Update average rating for the entity
            if instance.place:
                from django.db.models import Avg
                avg_rating = Review.objects.filter(place=instance.place).aggregate(Avg('rating'))['rating__avg']
                instance.place.rating = round(avg_rating, 1)
                instance.place.save()
            elif instance.experience:
                from django.db.models import Avg
                avg_rating = Review.objects.filter(experience=instance.experience).aggregate(Avg('rating'))['rating__avg']
                instance.experience.rating = round(avg_rating, 1)
                instance.experience.save()
                
        except Exception as e:
            logger.error(f"Error in review signal for review {instance.id}: {str(e)}", exc_info=True)


@receiver(post_save, sender=Discount)
def discount_signals(sender, instance, created, **kwargs):
    """
    Handle discount creation and updates:
    - Notify targeted users about new discounts
    - Send real-time updates for discount changes
    """
    try:
        # For new discounts
        if created:
            # If this is a targeted discount with specific users, notifications
            # are handled by the AdvertisingService that created it
            if not instance.metadata.get('is_targeted', False):
                # This is a general discount, notify admin users
                admin_users = User.objects.filter(is_staff=True)
                
                for user in admin_users:
                    NotificationService.send_notification.delay(
                        user_id=user.id,
                        notification_type="New Discount Created",
                        message=f"New discount code {instance.code} has been created.",
                        data={
                            'discount_id': str(instance.id),
                            'code': instance.code,
                            'amount': float(instance.amount),
                            'discount_type': instance.discount_type,
                            'valid_until': instance.valid_to.isoformat(),
                            'deep_link': f"/admin/discounts/{instance.id}"
                        }
                    )
        
        # For discount updates
        else:
            # Check if discount was activated or deactivated
            try:
                original = Discount.objects.get(id=instance.id)
                status_changed = original.is_active != instance.is_active
                
                if status_changed:
                    # Notify admin users about status change
                    admin_users = User.objects.filter(is_staff=True)
                    
                    status_text = "activated" if instance.is_active else "deactivated"
                    for user in admin_users:
                        NotificationService.send_notification.delay(
                            user_id=user.id,
                            notification_type="Discount Status Changed",
                            message=f"Discount code {instance.code} has been {status_text}.",
                            data={
                                'discount_id': str(instance.id),
                                'code': instance.code,
                                'status': status_text,
                                'deep_link': f"/admin/discounts/{instance.id}"
                            }
                        )
            except Discount.DoesNotExist:
                pass
                
    except Exception as e:
        logger.error(f"Error in discount signal for discount {instance.id}: {str(e)}", exc_info=True)

# Add a signal for when a discount is applied to a booking
@receiver(pre_save, sender=Booking)
def booking_discount_signals(sender, instance, **kwargs):
    """
    Handle discount application to bookings:
    - Track discount usage
    - Notify users about applied discounts
    """
    if instance.pk:
        try:
            original = Booking.objects.get(pk=instance.pk)
            
            # Check if a discount was applied
            discount_applied = (
                instance.discount and 
                (not original.discount or original.discount.id != instance.discount.id)
            )
            
            if discount_applied and instance.discount:
                # Increment discount usage
                instance.discount.increment_usage()
                
                # Calculate savings
                if instance.discount.discount_type == "Percentage":
                    savings_text = f"{instance.discount.amount}%"
                else:
                    savings_text = f"${instance.discount.amount}"
                
                # Notify user about applied discount
                NotificationService.send_notification.delay(
                    user_id=instance.user.id,
                    notification_type="Discount Applied",
                    message=f"Discount code {instance.discount.code} applied to your booking! You saved {savings_text}.",
                    data={
                        'booking_id': str(instance.id),
                        'discount_code': instance.discount.code,
                        'savings': savings_text,
                        'deep_link': f"/bookings/{instance.id}"
                    }
                )
                
        except Booking.DoesNotExist:
            pass
        except Exception as e:
            logger.error(f"Error in booking discount signal for booking {instance.id}: {str(e)}", exc_info=True)