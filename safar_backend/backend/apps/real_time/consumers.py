from typing import Dict, List, Literal, TypedDict, Optional
from dataclasses import dataclass
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from apps.safar.models import Booking, Message, Notification
from apps.safar.serializers import (
    BookingSerializer,
    MessageSerializer,
    NotificationSerializer
)
from django.core.cache import cache
from uuid import UUID

class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)  # Using str() instead of hex for standard UUID format
        if hasattr(obj, '__dict__'):
            return vars(obj)
        return super().default(obj)
    
class WebSocketMessage(TypedDict):
    type: str
    payload: Dict

class InitialDataMessage(WebSocketMessage):
    type: Literal["initial_data"]
    payload: Dict[str, List[Dict]]

class EventMessage(WebSocketMessage):
    type: Literal["booking_update", "new_message", "new_notification"]
    payload: Dict

class ErrorMessage(WebSocketMessage):
    type: Literal["error"]
    payload: Dict[str, str]

@dataclass
class ConsumerGroups:
    BOOKING: str = 'bookings_'
    MESSAGE: str = 'messages_'
    NOTIFICATION: str = 'notifications_'

class SafariConsumer(AsyncJsonWebsocketConsumer):
    """Enhanced WebSocket consumer with type safety and better error handling"""
    
    groups_prefix = ConsumerGroups()
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.groups: List[str] = []
        self.cache_timeout = 300 

    async def connect(self):
        """Handle WebSocket connection with JWT authentication"""
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.groups = [
            f"{prefix}{self.user.id}"
            for prefix in self.groups_prefix.__dict__.values()
            if not prefix.startswith('_')
        ]
        
        for group in self.groups:
            await self.channel_layer.group_add(group, self.channel_name)
        
        await self.accept()
        
        # Send initial data with caching
        initial_data = await self._get_cached_initial_data()
        await self._send_initial_data(initial_data)

    async def disconnect(self, close_code: int):
        """Clean up on WebSocket disconnect"""
        if self.user and not self.user.is_anonymous:
            for group in self.groups:
                await self.channel_layer.group_discard(group, self.channel_name)

    async def _get_cached_initial_data(self) -> Dict:
        """Get initial data with Redis caching"""
        cache_key = f"ws_initial_data_{self.user.id}"
        cached_data = await cache.aget(cache_key)
        
        if not cached_data:
            cached_data = await self._fetch_initial_data()
            await cache.aset(cache_key, cached_data, timeout=self.cache_timeout)
        
        return cached_data

    async def _fetch_initial_data(self) -> Dict:
        """Fetch all initial data in optimized DB queries"""
        bookings, messages, notifications = await database_sync_to_async(
            self._get_initial_data_sync
        )()
        return {
            "bookings": bookings,
            "messages": messages,
            "notifications": notifications
        }

    def _get_initial_data_sync(self) -> tuple:
        """Synchronous method to fetch all initial data"""
        bookings = BookingSerializer(
            Booking.objects.filter(user=self.user).select_related('place', 'experience', 'flight', 'box'),
            many=True
        ).data
        
        messages = MessageSerializer(
            Message.objects.filter(
                Q(sender=self.user) | Q(receiver=self.user)
            ).select_related('sender', 'receiver')
            .order_by('-created_at')[:20],
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

    async def receive_json(self, content: Dict, **kwargs):
        """Handle incoming WebSocket messages"""
        try:
            action = content.get("action")
            payload = content.get("payload", {})
            
            if action == "mark_message_read":
                await self._handle_mark_message_read(payload.get("message_id"))
            elif action == "mark_notification_read":
                await self._handle_mark_notification_read(payload.get("notification_id"))
            else:
                await self._send_error("Invalid action specified")
                
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON format")
        except Exception as e:
            await self._send_error(str(e))

    async def _handle_mark_message_read(self, message_id: int):
        """Mark a message as read"""
        if not message_id:
            await self._send_error("Message ID is required")
            return
            
        await database_sync_to_async(self._mark_message_read_sync)(message_id)
        await self._invalidate_cache()

    def _mark_message_read_sync(self, message_id: int):
        """Sync version of mark message read"""
        Message.objects.filter(
            id=message_id, 
            receiver=self.user
        ).update(is_read=True)

    async def _handle_mark_notification_read(self, notification_id: int):
        """Mark a notification as read"""
        if not notification_id:
            await self._send_error("Notification ID is required")
            return
            
        await database_sync_to_async(self._mark_notification_read_sync)(notification_id)
        await self._invalidate_cache()

    def _mark_notification_read_sync(self, notification_id: int):
        """Sync version of mark notification read"""
        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True)

    async def _invalidate_cache(self):
        """Invalidate cached initial data"""
        cache_key = f"ws_initial_data_{self.user.id}"
        await cache.adelete(cache_key)

    async def _send_initial_data(self, data: Dict):
        """Send initial data to client with enhanced error handling"""
        try:
            # First validate the data can be serialized
            test_data = {
                "type": "initial_data",
                "payload": data
            }
            json.dumps(test_data, cls=UUIDEncoder)
            
            # If successful, send the actual data
            await self.send_json(test_data, cls=UUIDEncoder)
        except TypeError as e:
            # Handle specific serialization errors
            error_msg = f"Data serialization error: {str(e)}"
            print(error_msg)
            await self._send_error(error_msg)
        except Exception as e:
            # Handle other unexpected errors
            error_msg = f"Unexpected error sending initial data: {str(e)}"
            print(error_msg)
            await self._send_error(error_msg)

    async def _send_error(self, message: str):
        """Send error message to client"""
        await self.send_json({
            "type": "error",
            "payload": {"message": message}
        })

    # Event handlers for different message types
    async def booking_update(self, event: Dict):
        """Handle booking update events"""
        await self._send_event("booking_update", event)

    async def new_message(self, event: Dict):
        """Handle new message events"""
        await self._send_event("new_message", event)

    async def new_notification(self, event: Dict):
        """Handle new notification events"""
        await self._send_event("new_notification", event)

    async def _send_event(self, event_type: str, payload: Dict):
        """Generic event sender"""
        await self.send_json({
            "type": event_type,
            "payload": payload
        })