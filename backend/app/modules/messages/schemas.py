"""
Schemas للرسائل والمحادثات - Message and Conversation Schemas
Enhanced with Conversation model
"""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.core.id import ID


class MessageCreate(BaseModel):
    """Schema لإنشاء رسالة - Create message schema"""
    conversation_id: Optional[ID] = None
    receiver_id: Optional[ID] = None  # For direct messaging (legacy)
    listing_id: Optional[ID] = None
    booking_id: Optional[ID] = None
    subject: Optional[str] = None
    body: str = Field(..., min_length=1)
    content: Optional[str] = None  # Legacy alias
    attachments: Optional[List[str]] = None


class ConversationCreate(BaseModel):
    """Schema لإنشاء محادثة - Create conversation schema"""
    participant_id: ID
    listing_id: Optional[ID] = None
    booking_id: Optional[ID] = None


class MessageResponse(BaseModel):
    """Schema لاستجابة الرسالة - Message response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    conversation_id: Optional[ID] = None
    sender_id: Optional[ID] = None
    receiver_id: Optional[ID] = None  # Legacy
    source: str
    body: str
    content: Optional[str] = None  # Legacy alias
    is_read: bool
    read_at: Optional[datetime] = None
    attachments: Optional[List[str]] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    """Schema للمحادثة - Conversation response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    booking_id: Optional[ID] = None
    listing_id: Optional[ID] = None
    participants: List[ID] = []
    messages: List[MessageResponse] = []
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    """Schema لقائمة المحادثات - Conversation list response"""
    items: List[ConversationResponse]
    total: int
    skip: int
    limit: int


class MessageListResponse(BaseModel):
    """Schema لقائمة الرسائل - Message list response"""
    items: List[MessageResponse]
    total: int
    skip: int
    limit: int


class ConversationSummaryResponse(BaseModel):
    """Schema لملخص المحادثة - Conversation summary response"""
    id: ID
    other_user_id: ID
    other_user_name: str
    last_message: Optional[MessageResponse] = None
    unread_count: int
    listing_id: Optional[ID] = None
    booking_id: Optional[ID] = None
