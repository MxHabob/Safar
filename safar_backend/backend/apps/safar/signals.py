import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.safar.models import Booking, Message, Notification, Payment, Review, Discount
from apps.safar.serializers import (
    BookingSerializer, 
    MessageSerializer, 
    NotificationSerializer
)
from apps.core_apps.tasks import process_notification, send_email_task
from apps.authentication.models import User
from apps.core_apps.services import NotificationService
from django.db.models import Avg
from datetime import datetime
import json
from uuid import UUID

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

class UUIDEncoder(json.JSONEncoder):
    """JSON encoder that handles UUIDs and datetimes"""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def send_channel_message(group_name, message_type, data):
    """
    Safely send message to channel group with proper serialization
    """
    try:
        serialized_data = json.dumps(data, cls=UUIDEncoder)
        message = {
            "type": message_type,
            "data": json.loads(serialized_data)
        }
        async_to_sync(channel_layer.group_send)(group_name, message)
        logger.debug(f"Sent {message_type} to group {group_name}")
        return True
    except Exception as e:
        logger.error(f"Error sending {message_type} to {group_name}: {str(e)}", exc_info=True)
        return False

@receiver(post_save, sender=Booking)
def handle_booking_changes(sender, instance, created, **kwargs):
    """
    Handle booking lifecycle events with proper async/sync separation
    """
    try:
        if created:
            _handle_new_booking(instance)
        else:
            _handle_booking_update(instance)
    except Exception as e:
        logger.error(f"Booking signal error for {instance.id}: {str(e)}", exc_info=True)

def _handle_new_booking(booking):
    """Process new booking creation"""
    message = f"Your booking #{booking.id} has been created and is pending confirmation."
    notification = Notification.objects.create(
        user=booking.user,
        type="Booking Created",
        message=message,
        metadata={
            'booking_id': str(booking.id),
            'deep_link': f"/bookings/{booking.id}",
            'status': booking.status,
            'entity_type': _get_booking_entity_type(booking)
        }
    )
    process_notification.delay(notification.id)

    group = f"bookings_{booking.user.id}"
    booking_data = BookingSerializer(booking).data
    send_channel_message(group, "booking.update", booking_data)

def _handle_booking_update(booking):
    """Process booking updates"""
    try:
        original = Booking.objects.get(id=booking.id)
        status_changed = original.status != booking.status
        
        if status_changed:
            _handle_booking_status_change(booking, original.status)
        
        group = f"bookings_{booking.user.id}"
        booking_data = BookingSerializer(booking).data
        send_channel_message(group, "booking.update", booking_data)
    except Booking.DoesNotExist:
        pass

def _handle_booking_status_change(booking, old_status):
    """Handle booking status transitions"""
    message = f"Your booking #{booking.id} status changed from {old_status} to {booking.status}."
    
    notification = Notification.objects.create(
        user=booking.user,
        type=f"Booking {booking.status}",
        message=message,
        metadata={
            'booking_id': str(booking.id),
            'deep_link': f"/bookings/{booking.id}",
            'status': booking.status,
            'entity_type': _get_booking_entity_type(booking),
            'priority': 'high'
        }
    )
    
    process_notification.delay(notification.id)
    
    if booking.status == 'Confirmed':
        send_email_task.delay(
            subject="Booking Confirmed",
            message=f"Your booking #{booking.id} has been confirmed.",
            recipient_list=[booking.user.email],
            context={
                'booking': BookingSerializer(booking).data,
                'action_url': f"/bookings/{booking.id}"
            }
        )

def _get_booking_entity_type(booking):
    """Determine the bookable entity type"""
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
def handle_new_message(sender, instance, created, **kwargs):
    """Process new messages with async notifications"""
    if not created:
        return
    
    try:
        group = f"messages_{instance.receiver.id}"
        message_data = MessageSerializer(instance).data
        send_channel_message(group, "message.new", message_data)
        
        notification = Notification.objects.create(
            user=instance.receiver,
            type="New Message",
            message=f"New message from {instance.sender.get_full_name()}",
            metadata={
                'message_id': str(instance.id),
                'sender_id': str(instance.sender.id),
                'preview': instance.message_text[:100] + ('...' if len(instance.message_text) > 100 else ''),
                'deep_link': f"/messages/{instance.id}"
            }
        )
        
        if getattr(instance.receiver.profile, 'wants_push_notifications', False):
            process_notification.delay(notification.id)
            
    except Exception as e:
        logger.error(f"Message signal error for {instance.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Notification)
def handle_notification_creation(sender, instance, created, **kwargs):
    """Process new notifications"""
    if not created:
        return
    
    try:
        notification_data = NotificationSerializer(instance).data
        
        groups = [
            f"notifications_{instance.user.id}",
            f"safar_{instance.user.id}"
        ]
        
        for group in groups:
            send_channel_message(group, "notification.new", notification_data)
        
        if instance.metadata.get('priority') == 'high':
            process_notification.delay(instance.id)
            
    except Exception as e:
        logger.error(f"Notification signal error for {instance.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Payment)
def handle_payment_updates(sender, instance, created, **kwargs):
    """Process payment events"""
    try:
        if created or instance.payment_status == 'Completed':
            _process_payment_notification(instance)
            
            if instance.payment_status == 'Completed':
                _send_payment_receipt(instance)
                
    except Exception as e:
        logger.error(f"Payment signal error for {instance.id}: {str(e)}", exc_info=True)

def _process_payment_notification(payment):
    """Create payment notification"""
    message = f"Payment of {payment.amount} {payment.currency} {payment.payment_status.lower()}."
    
    notification = Notification.objects.create(
        user=payment.user,
        type="Payment Update",
        message=message,
        metadata={
            'payment_id': str(payment.id),
            'status': payment.payment_status,
            'amount': float(payment.amount),
            'deep_link': f"/payments/{payment.id}",
            'priority': 'high' if payment.payment_status == 'Completed' else 'normal'
        }
    )
    process_notification.delay(notification.id)

def _send_payment_receipt(payment):
    """Send payment receipt email"""
    send_email_task.delay(
        subject="Payment Receipt",
        message=f"Payment of {payment.amount} {payment.currency} processed.",
        recipient_list=[payment.user.email],
        context={
            'payment': {
                'id': str(payment.id),
                'amount': float(payment.amount),
                'date': payment.created_at.strftime('%Y-%m-%d')
            },
            'booking': BookingSerializer(payment.booking).data if payment.booking else None
        }
    )

@receiver(post_save, sender=Review)
def handle_new_review(sender, instance, created, **kwargs):
    """Process new reviews and update ratings"""
    if not created:
        return
    
    try:
        owner = None
        entity_type = None
        entity_id = None
        
        if instance.place:
            owner = instance.place.owner
            entity_type = 'place'
            entity_id = instance.place.id
            _update_entity_rating(instance.place, Review, 'place')
        elif instance.experience:
            owner = instance.experience.owner
            entity_type = 'experience'
            entity_id = instance.experience.id
            _update_entity_rating(instance.experience, Review, 'experience')
        
        if owner:
            _notify_about_review(instance, owner, entity_type, entity_id)
            
    except Exception as e:
        logger.error(f"Review signal error for {instance.id}: {str(e)}", exc_info=True)

def _update_entity_rating(entity, model, field_name):
    """Update average rating for an entity"""
    avg_rating = model.objects.filter(**{field_name: entity}).aggregate(Avg('rating'))['rating__avg']
    entity.rating = round(avg_rating, 1) if avg_rating else 0
    entity.save()

def _notify_about_review(review, owner, entity_type, entity_id):
    """Create review notification for owner"""
    message = f"New {review.rating}-star review for your {entity_type}."
    
    Notification.objects.create(
        user=owner,
        type="New Review",
        message=message,
        metadata={
            'review_id': str(review.id),
            'entity_type': entity_type,
            'entity_id': str(entity_id),
            'rating': review.rating,
            'deep_link': f"/{entity_type}s/{entity_id}/reviews"
        }
    )

@receiver(post_save, sender=Discount)
def handle_discount_changes(sender, instance, created, **kwargs):
    """Process discount lifecycle events"""
    try:
        if created:
            _handle_new_discount(instance)
        else:
            _handle_discount_update(instance)
    except Exception as e:
        logger.error(f"Discount signal error for {instance.id}: {str(e)}", exc_info=True)

def _handle_new_discount(discount):
    """Notify admins about new discounts"""
    if not discount.metadata.get('is_targeted', False):
        for admin in User.objects.filter(is_staff=True):
            NotificationService.send_notification.delay(
                user_id=admin.id,
                notification_type="New Discount",
                message=f"New discount code: {discount.code}",
                data={
                    'discount_id': str(discount.id),
                    'valid_until': discount.valid_to.isoformat()
                }
            )

def _handle_discount_update(discount):
    """Handle discount status changes"""
    try:
        original = Discount.objects.get(id=discount.id)
        if original.is_active != discount.is_active:
            status = "activated" if discount.is_active else "deactivated"
            for admin in User.objects.filter(is_staff=True):
                NotificationService.send_notification.delay(
                    user_id=admin.id,
                    notification_type="Discount Update",
                    message=f"Discount {discount.code} {status}",
                    data={
                        'discount_id': str(discount.id),
                        'status': status
                    }
                )
    except Discount.DoesNotExist:
        pass

@receiver(pre_save, sender=Booking)
def handle_discount_application(sender, instance, **kwargs):
    """Track discount usage on bookings"""
    if not instance.pk or not instance.discount:
        return
    
    try:
        original = Booking.objects.get(pk=instance.pk)
        if not original.discount or original.discount.id != instance.discount.id:
            _process_discount_application(instance)
    except Booking.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Booking discount signal error: {str(e)}", exc_info=True)

def _process_discount_application(booking):
    """Handle discount application logic"""
    booking.discount.increment_usage()
    
    savings = (f"{booking.discount.amount}%" 
              if booking.discount.discount_type == "Percentage" 
              else f"{booking.discount.amount} {booking.discount.currency}")
    
    NotificationService.send_notification.delay(
        user_id=booking.user.id,
        notification_type="Discount Applied",
        message=f"Discount {booking.discount.code} saved you {savings}",
        data={
            'booking_id': str(booking.id),
            'savings': savings
        }
    )
