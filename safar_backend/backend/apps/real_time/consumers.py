import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from apps.safar.models import Booking, Message, Notification
from apps.safar.serializers import (
    BookingSerializer,
    MessageSerializer,
    NotificationSerializer
)
from django.core.cache import cache

class SafariConsumer(AsyncWebsocketConsumer):
    GROUPS_PREFIX = {
        'booking': 'bookings_',
        'message': 'messages_',
        'notification': 'notifications_'
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.groups = []

    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close(code=4001)  # Custom close code for unauthorized
            return

        # Create group names
        self.groups = [
            f"{prefix}{self.user.id}"
            for prefix in self.GROUPS_PREFIX.values()
        ]
        
        # Batch add to all groups
        for group in self.groups:
            await self.channel_layer.group_add(group, self.channel_name)
        
        await self.accept()
        
        # Use cache to avoid frequent DB hits for initial data
        cache_key = f"ws_initial_data_{self.user.id}"
        initial_data = await cache.aget(cache_key)
        
        if not initial_data:
            initial_data = await self.get_initial_data()
            await cache.aset(cache_key, initial_data, timeout=60)  # Cache for 1 minute
        
        await self.send(json.dumps({
            "type": "initial_data",
            **initial_data
        }))

    async def disconnect(self, close_code):
        if self.user and not self.user.is_anonymous:
            # Batch remove from all groups
            for group in self.groups:
                await self.channel_layer.group_discard(group, self.channel_name)

    async def get_initial_data(self):
        bookings, messages, notifications = await database_sync_to_async(
            self._get_initial_data_sync
        )()
        return {
            "bookings": bookings,
            "messages": messages,
            "notifications": notifications
        }

    def _get_initial_data_sync(self):
        """Synchronous method to fetch all initial data in one DB hit"""
        bookings = BookingSerializer(
            Booking.objects.filter(user=self.user),
            many=True
        ).data
        
        messages = MessageSerializer(
            Message.objects.filter(
                Q(sender=self.user) | Q(receiver=self.user)
            ).order_by('-created_at')[:20],
            many=True
        ).data
        
        notifications = NotificationSerializer(
            Notification.objects.filter(
                user=self.user,
                is_read=False
            ).order_by('-created_at'),
            many=True
        ).data
        
        return bookings, messages, notifications

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            
            if action == "mark_message_read":
                await self.mark_message_read(data.get("message_id"))
            elif action == "mark_notification_read":
                await self.mark_notification_read(data.get("notification_id"))
                
        except json.JSONDecodeError:
            await self.send(json.dumps({
                "error": "Invalid JSON format"
            }))
        except Exception as e:
            await self.send(json.dumps({
                "error": str(e)
            }))

    # Generic event handler for all types
    async def websocket_event(self, event):
        event_type = event.get("type")
        if event_type in ['booking_update', 'new_message', 'new_notification']:
            await self.send(json.dumps(event))

    @database_sync_to_async
    def mark_message_read(self, message_id):
        Message.objects.filter(
            id=message_id, 
            receiver=self.user
        ).update(is_read=True)
        cache.delete(f"ws_initial_data_{self.user.id}")

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True)
        cache.delete(f"ws_initial_data_{self.user.id}")