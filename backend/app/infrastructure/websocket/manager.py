"""
WebSocket Manager للدردشة والإشعارات
WebSocket Manager for chat and notifications
"""
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """مدير اتصالات WebSocket - WebSocket connection manager"""
    
    def __init__(self):
        # user_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # room_id -> Set[WebSocket] (for chat rooms)
        self.room_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """الاتصال - Connect"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """قطع الاتصال - Disconnect"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """إرسال رسالة شخصية - Send personal message"""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast(self, message: dict):
        """بث عام - Broadcast message"""
        disconnected = []
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected.append((user_id, connection))
        
        # Remove disconnected connections
        for user_id, conn in disconnected:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(conn)
    
    async def join_room(self, websocket: WebSocket, room_id: str):
        """الانضمام إلى غرفة - Join room"""
        if room_id not in self.room_connections:
            self.room_connections[room_id] = set()
        self.room_connections[room_id].add(websocket)
    
    def leave_room(self, websocket: WebSocket, room_id: str):
        """مغادرة الغرفة - Leave room"""
        if room_id in self.room_connections:
            self.room_connections[room_id].discard(websocket)
    
    async def send_to_room(self, message: dict, room_id: str):
        """إرسال إلى غرفة - Send to room"""
        if room_id in self.room_connections:
            disconnected = set()
            for connection in self.room_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to room {room_id}: {e}")
                    disconnected.add(connection)
            
            for conn in disconnected:
                self.room_connections[room_id].discard(conn)


# Global connection manager
manager = ConnectionManager()

