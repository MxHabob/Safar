"""
Message and conversation routes, including Conversation model support.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.messages.models import Message, Conversation
from app.modules.messages.schemas import (
    MessageCreate, MessageResponse, MessageListResponse,
    ConversationResponse, ConversationListResponse, ConversationCreate, ConversationSummaryResponse
)
from app.modules.messages.services import MessageService

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new message."""
    message = await MessageService.create_message(db, message_data, current_user.id)
    
    # Send via WebSocket if receiver is online
    try:
        from app.infrastructure.websocket.manager import manager
        if message.receiver_id:
            await manager.send_personal_message({
                "type": "new_message",
                "message": {
                    "id": message.id,
                    "sender_id": message.sender_id,
                    "body": message.body,
                    "created_at": message.created_at.isoformat()
                }
            }, message.receiver_id)
    except:
        pass  # WebSocket not available
    
    return message


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all conversations for the current user with pagination."""
    conversations = await MessageService.get_user_conversations(db, current_user.id)
    
    total = len(conversations)
    paginated = conversations[skip:skip + limit]
    
    return {
        "items": paginated,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new conversation or return an existing one for the participants."""
    conversation = await MessageService.get_or_create_conversation(
        db,
        [current_user.id, conversation_data.participant_id],
        conversation_data.listing_id,
        conversation_data.booking_id
    )
    
    await db.refresh(conversation, ["participants", "messages"])
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a single conversation by ID for the current user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            selectinload(Conversation.participants),
            selectinload(Conversation.messages)
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user is participant
    participant_ids = [p.id for p in conversation.participants]
    if current_user.id not in participant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def get_conversation_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get paginated messages for a conversation."""
    messages, total = await MessageService.get_conversation(
        db, conversation_id, current_user.id, skip, limit
    )
    
    return {
        "items": messages,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/conversations/{conversation_id}/read", response_model=dict)
async def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark all messages in a conversation as read for the current user."""
    count = await MessageService.mark_conversation_read(db, conversation_id, current_user.id)
    return {"marked_read": count}


@router.post("/{message_id}/read", response_model=MessageResponse)
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a single message as read for the current user."""
    message = await MessageService.mark_as_read(db, message_id, current_user.id)
    return message


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: str = None):
    """WebSocket endpoint for real-time chat messaging.
    
    Requires authentication token in query parameter.
    Enforces 2FA verification for users with 2FA enabled.
    """
    try:
        from app.infrastructure.websocket.manager import manager
        from app.core.security import decode_token
        from app.modules.users.models import User
        from app.core.database import AsyncSessionLocal
        
        # Get token from query params
        if not token:
            token = websocket.query_params.get("token")
        
        if not token:
            await websocket.close(code=1008, reason="Authentication token required")
            return
        
        # Decode token and verify user
        try:
            payload = decode_token(token, token_type="access")
            token_user_id = payload.get("sub")
            mfa_verified = payload.get("mfa_verified", False)
            
            if str(token_user_id) != str(user_id):
                await websocket.close(code=1008, reason="User ID mismatch")
                return
            
            # Check 2FA if user has it enabled
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(User).where(User.id == user_id)
                )
                user = result.scalar_one_or_none()
                
                if not user:
                    await websocket.close(code=1008, reason="User not found")
                    return
                
                # Enforce 2FA verification for 2FA-enabled users
                if user.totp_enabled and not mfa_verified:
                    await websocket.close(code=1008, reason="2FA verification required")
                    return
        except Exception as e:
            await websocket.close(code=1008, reason="Invalid authentication token")
            return
        
        await manager.connect(websocket, user_id)
        try:
            while True:
                data = await websocket.receive_json()
                
                # Handle different message types
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif data.get("type") == "message":
                    # Forward message to receiver
                    receiver_id = data.get("receiver_id")
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "new_message",
                            "message": data.get("message")
                        }, receiver_id)
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
    except ImportError:
        await websocket.close(code=1003, reason="WebSocket manager not available")
