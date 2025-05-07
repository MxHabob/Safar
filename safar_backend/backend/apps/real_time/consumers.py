import json
import logging
import asyncio
from uuid import UUID
from typing import Dict, List, Any, Optional
from django.core.cache import cache
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db.models import Q
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class UUIDEncoder(json.JSONEncoder):
    """JSON encoder that handles UUIDs properly"""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)

class SafariConsumer(AsyncJsonWebsocketConsumer):
    """Enhanced WebSocket consumer with robust connection handling and proper cleanup"""
    
    BOOKING_GROUP = 'bookings_'
    MESSAGE_GROUP = 'messages_'
    NOTIFICATION_GROUP = 'notifications_'
    GENERAL_GROUP = 'safar_'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.groups = []
        self._connected = False
        self.cache_timeout = 300
        self._pending_tasks = set()  # Track all pending tasks for proper cleanup

    async def connect(self):
        """Handle WebSocket connection with improved reliability"""
        try:
            self.user = self.scope["user"]
            
            if self.user.is_anonymous:
                logger.warning("Rejected anonymous WebSocket connection")
                await self.close(code=4001)
                return

            await self.accept()
            self._connected = True
            
            self.groups = [
                f"{self.BOOKING_GROUP}{self.user.id}",
                f"{self.MESSAGE_GROUP}{self.user.id}",
                f"{self.NOTIFICATION_GROUP}{self.user.id}",
                f"{self.GENERAL_GROUP}{self.user.id}"
            ]
            
            # Add to groups with proper timeout handling
            group_tasks = []
            for group in self.groups:
                task = self._create_task(self._add_to_group_with_timeout(group))
                group_tasks.append(task)
            
            # Wait for all group additions but don't block indefinitely
            await asyncio.wait(group_tasks, timeout=3.0)
            
            logger.info(f"WebSocket connection established for user {self.user.id}")
            
            # Send initial data as a background task to avoid blocking
            self._create_task(self._send_initial_data())
            
        except Exception as e:
            logger.error(f"Error during WebSocket setup: {str(e)}", exc_info=True)
            self._connected = False
            await self.close(code=1011)

    def _create_task(self, coro):
        """Create and track a task for proper cleanup"""
        task = asyncio.create_task(coro)
        self._pending_tasks.add(task)
        task.add_done_callback(self._pending_tasks.discard)
        return task

    async def _add_to_group_with_timeout(self, group, timeout=2.0):
        """Add to channel group with timeout to prevent hanging"""
        try:
            await asyncio.wait_for(
                self.channel_layer.group_add(group, self.channel_name),
                timeout=timeout
            )
            logger.debug(f"Added to group {group}")
        except asyncio.TimeoutError:
            logger.warning(f"Timeout adding to group {group}")
        except Exception as e:
            logger.error(f"Error adding to group {group}: {str(e)}")

    async def _send_initial_data(self):
        """Handle sending initial data with connection checks and timeout"""
        if not self._connected:
            return
            
        try:
            initial_data = await asyncio.wait_for(
                self._get_cached_initial_data(), 
                timeout=5.0
            )
            
            if not self._connected:  # Double-check connection is still active
                return
                
            response = {
                "type": "initial_data",
                "payload": initial_data
            }
            
            await self.send_json(response)
            
        except asyncio.TimeoutError:
            logger.error("Timeout fetching initial data")
            if self._connected:
                await self._send_error("Timeout fetching initial data")
        except Exception as e:
            logger.error(f"Error sending initial data: {str(e)}", exc_info=True)
            if self._connected:
                await self._send_error(f"Failed to load initial data: {str(e)}")

    async def disconnect(self, close_code: int):
        """Clean up on WebSocket disconnect with proper error handling"""
        self._connected = False
        
        # Cancel all pending tasks
        pending_tasks = list(self._pending_tasks)
        for task in pending_tasks:
            if not task.done():
                task.cancel()
        
        # Wait briefly for tasks to cancel
        if pending_tasks:
            await asyncio.wait(pending_tasks, timeout=1.0)
        
        # Remove from groups with a short timeout
        try:
            group_tasks = []
            for group in self.groups:
                task = asyncio.create_task(
                    self._remove_from_group_with_timeout(group, timeout=1.0)
                )
                group_tasks.append(task)

            if group_tasks:
                await asyncio.wait(group_tasks, timeout=2.0)
            
            logger.info(f"WebSocket connection closed for user {self.user.id if self.user else 'unknown'} with code {close_code}")
                
        except Exception as e:
            logger.error(f"Error during disconnect: {str(e)}")

    async def _remove_from_group_with_timeout(self, group, timeout=1.0):
        """Remove from channel group with timeout to prevent hanging"""
        try:
            await asyncio.wait_for(
                self.channel_layer.group_discard(group, self.channel_name),
                timeout=timeout
            )
            logger.debug(f"Removed from group {group}")
        except asyncio.TimeoutError:
            logger.warning(f"Timeout removing from group {group}")
        except Exception as e:
            logger.error(f"Error removing from group {group}: {str(e)}")

    async def _get_cached_initial_data(self) -> Dict:
        """Get initial data with Redis caching for performance"""
        if not self.user:
            return {}
            
        cache_key = f"ws_initial_data_{self.user.id}"
        
        try:
            cached_data = await sync_to_async(cache.get)(cache_key)
            if cached_data:
                return json.loads(cached_data)
            
            data = await self._fetch_initial_data()
            
            # Only cache if we have meaningful data
            if data and not data.get('error'):
                serialized_data = json.dumps(data, cls=UUIDEncoder)
                await sync_to_async(cache.set)(
                    cache_key, 
                    serialized_data, 
                    timeout=self.cache_timeout
                )
            
            return data
            
        except Exception as e:
            logger.error(f"Cache error: {str(e)}")
            return await self._fetch_initial_data()

    async def _fetch_initial_data(self) -> Dict:
        """Fetch all initial data with optimized queries and timeout"""
        if not self._connected or not self.user:
            return {}
            
        try:
            # Use a shorter timeout for database operations
            bookings, messages, notifications = await asyncio.wait_for(
                database_sync_to_async(self._get_initial_data_sync)(),
                timeout=3.0
            )

            return {
                "bookings": bookings,
                "messages": messages,
                "notifications": notifications
            }
        except asyncio.TimeoutError:
            logger.error("Database operation timed out when fetching initial data")
            return {"error": "Timeout fetching data"}
        except Exception as e:
            logger.error(f"Error fetching initial data: {str(e)}", exc_info=True)
            return {"error": str(e)}

    def _get_initial_data_sync(self) -> tuple:
        """Synchronous method to fetch all initial data with optimized queries"""
        try:
            from apps.safar.models import Booking, Message, Notification
            from apps.safar.serializers import (
                BookingSerializer, MessageSerializer, NotificationSerializer
            )
            
            # Limit query size and use select_related to optimize
            bookings = BookingSerializer(
                Booking.objects.filter(user=self.user)
                .select_related('place', 'experience', 'flight', 'box')
                .order_by('-booking_date')[:5],  # Reduced from 10 to 5
                many=True
            ).data
            
            messages = MessageSerializer(
                Message.objects.filter(
                    Q(sender=self.user) | Q(receiver=self.user)
                )
                .select_related('sender', 'receiver')
                .order_by('-created_at')[:10],  # Reduced from 20 to 10
                many=True
            ).data
            
            notifications = NotificationSerializer(
                Notification.objects.filter(
                    user=self.user,
                    is_read=False
                )
                .order_by('-created_at')[:20],  # Reduced from 50 to 20
                many=True
            ).data
            
            return bookings, messages, notifications
        except Exception as e:
            logger.error(f"Error in _get_initial_data_sync: {str(e)}", exc_info=True)
            return [], [], []

    async def receive_json(self, content: Dict, **kwargs):
        """Handle incoming WebSocket messages with proper error handling"""
        if not self._connected:
            return
            
        try:
            action = content.get("action")
            payload = content.get("payload", {})
            
            if not action:
                await self._send_error("Missing 'action' field")
                return
                
            handlers = {
                "mark_message_read": self._handle_mark_message_read,
                "mark_notification_read": self._handle_mark_notification_read,
                "mark_all_notifications_read": self._handle_mark_all_notifications_read,
                "get_more_messages": self._handle_get_more_messages,
                "ping": self._handle_ping
            }
            
            handler = handlers.get(action)
            if handler:
                # Create a background task instead of waiting
                self._create_task(handler(payload))
            else:
                await self._send_error(f"Unknown action: {action}")
                
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}", exc_info=True)
            await self._send_error(f"Server error: {str(e)}")

    async def _handle_ping(self, payload: Dict):
        """Handle ping messages to keep connection alive"""
        if not self._connected:
            return
            
        response = {
            "type": "pong",
            "payload": {
                "timestamp": await sync_to_async(self._get_timestamp)()
            }
        }
        await self.send_json(response)

    def _get_timestamp(self):
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()

    async def _execute_with_timeout(self, coro, timeout=2.0, error_msg="Operation timed out"):
        """Execute a coroutine with timeout and error handling"""
        try:
            return await asyncio.wait_for(coro, timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(error_msg)
            if self._connected:
                await self._send_error(error_msg)
            return None
        except Exception as e:
            logger.error(f"Error in operation: {str(e)}")
            if self._connected:
                await self._send_error(f"Operation failed: {str(e)}")
            return None

    async def _handle_mark_message_read(self, payload: Dict):
        """Mark message as read"""
        if not self._connected:
            return
            
        message_id = payload.get("message_id")
        if not message_id:
            await self._send_error("Message ID required")
            return
            
        success = await self._execute_with_timeout(
            database_sync_to_async(self._mark_message_read_sync)(message_id),
            timeout=2.0,
            error_msg="Timeout marking message read"
        )
        
        if success and self._connected:
            await self._invalidate_cache()
            await self.send_json({
                "type": "message_marked_read",
                "payload": {"message_id": message_id}
            })

    def _mark_message_read_sync(self, message_id) -> bool:
        try:
            from apps.safar.models import Message
            return Message.objects.filter(
                id=message_id, 
                receiver=self.user,
                is_read=False
            ).update(is_read=True) > 0
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            return False

    async def _invalidate_cache(self):
        """Invalidate cached data"""
        if not self.user:
            return
            
        try:
            cache_key = f"ws_initial_data_{self.user.id}"
            await sync_to_async(cache.delete)(cache_key)
        except Exception as e:
            logger.error(f"Cache invalidation error: {str(e)}")

    async def _send_error(self, message: str):
        """Send error message to client"""
        if not self._connected:
            return
            
        try:
            await self.send_json({
                "type": "error",
                "payload": {"message": message}
            })
        except Exception as e:
            logger.error(f"Error sending error message: {str(e)}")
            self._connected = False

    async def _handle_mark_notification_read(self, payload: Dict):
        """Mark a notification as read with timeout"""
        if not self._connected:
            return
            
        notification_id = payload.get("notification_id")
        if not notification_id:
            await self._send_error("Notification ID is required")
            return
            
        success = await self._execute_with_timeout(
            database_sync_to_async(self._mark_notification_read_sync)(notification_id),
            timeout=2.0,
            error_msg="Timeout marking notification read"
        )
        
        if success and self._connected:
            await self._invalidate_cache()
            response = {
                "type": "notification_marked_read",
                "payload": {"notification_id": notification_id}
            }
            await self.send_json(response)

    def _mark_notification_read_sync(self, notification_id) -> bool:
        """Sync version of mark notification read with error handling"""
        try:
            from apps.safar.models import Notification
            
            return Notification.objects.filter(
                id=notification_id,
                user=self.user,
                is_read=False
            ).update(is_read=True) > 0
        except Exception as e:
            logger.error(f"Database error marking notification read: {str(e)}")
            return False

    async def _handle_mark_all_notifications_read(self, payload: Dict):
        """Mark all notifications as read with timeout"""
        if not self._connected:
            return
            
        count = await self._execute_with_timeout(
            database_sync_to_async(self._mark_all_notifications_read_sync)(),
            timeout=2.0,
            error_msg="Timeout marking all notifications read"
        )
        
        if count is not None and self._connected:
            await self._invalidate_cache()
            response = {
                "type": "all_notifications_marked_read",
                "payload": {"count": count}
            }
            await self.send_json(response)

    def _mark_all_notifications_read_sync(self) -> int:
        """Mark all user's notifications as read with error handling"""
        try:
            from apps.safar.models import Notification
            
            return Notification.objects.filter(
                user=self.user,
                is_read=False
            ).update(is_read=True)
        except Exception as e:
            logger.error(f"Database error marking all notifications read: {str(e)}")
            return 0

    async def _handle_get_more_messages(self, payload: Dict):
        """Handle request for more messages with pagination and timeout"""
        if not self._connected:
            return
            
        try:
            offset = int(payload.get("offset", 0))
            limit = min(int(payload.get("limit", 20)), 30)  # Reduced max from 50 to 30
            
            messages = await self._execute_with_timeout(
                database_sync_to_async(self._get_more_messages_sync)(offset, limit),
                timeout=3.0,
                error_msg="Timeout fetching more messages"
            )
            
            if messages is not None and self._connected:
                response = {
                    "type": "more_messages",
                    "payload": {
                        "messages": messages,
                        "offset": offset,
                        "limit": limit
                    }
                }
                await self.send_json(response)
            
        except ValueError:
            await self._send_error("Invalid pagination parameters")
        except Exception as e:
            logger.error(f"Error fetching more messages: {str(e)}")
            if self._connected:
                await self._send_error(f"Failed to fetch more messages: {str(e)}")

    def _get_more_messages_sync(self, offset: int, limit: int) -> List:
        """Get paginated messages with error handling"""
        try:
            from apps.safar.models import Message
            from apps.safar.serializers import MessageSerializer
            from django.db.models import Q
            
            messages = Message.objects.filter(
                Q(sender=self.user) | Q(receiver=self.user)
            ).select_related(
                'sender', 'receiver'
            ).order_by(
                '-created_at'
            )[offset:offset+limit]
            
            return MessageSerializer(messages, many=True).data
        except Exception as e:
            logger.error(f"Error in _get_more_messages_sync: {str(e)}", exc_info=True)
            return []

    async def send_json(self, content, close=False):
        """Override send_json to include UUID serialization and connection check"""
        if not self._connected:
            return
            
        try:
            serialized_content = json.dumps(content, cls=UUIDEncoder)
            parsed_content = json.loads(serialized_content)
            
            await super().send_json(parsed_content, close)
        except Exception as e:
            logger.error(f"Error sending JSON data: {str(e)}")
            self._connected = False

    # Channel layer event handlers
    async def booking_update(self, event: Dict):
        """Handle booking update events with connection check"""
        if not self._connected:
            return
            
        try:
            await self.send_json({
                "type": "booking_update",
                "payload": event.get("data", {})
            })
        except Exception as e:
            logger.error(f"Error sending booking update: {str(e)}")

    async def message_new(self, event: Dict):
        """Handle new message events with connection check"""
        if not self._connected:
            return
            
        try:
            await self.send_json({
                "type": "new_message",
                "payload": event.get("data", {})
            })
        except Exception as e:
            logger.error(f"Error sending new message: {str(e)}")

    async def notification_new(self, event: Dict):
        """Handle new notification events with connection check"""
        if not self._connected:
            return
            
        try:
            await self.send_json({
                "type": "new_notification",
                "payload": event.get("data", {})
            })
        except Exception as e:
            logger.error(f"Error sending new notification: {str(e)}")