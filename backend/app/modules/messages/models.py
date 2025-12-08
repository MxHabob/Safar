"""
Message and conversation models.
Enhanced with the conversation model from the Prisma schema.
"""
from sqlalchemy import (
    Column, String, Boolean, DateTime,
    Text, Index, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel
from app.core.database import Base

# Many-to-many relationship table for conversation participants
conversation_participants = Table(
    'conversation_participants',
    Base.metadata,
    Column('conversation_id', String(40), ForeignKey('conversations.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String(40), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Index('idx_conv_participants', 'conversation_id', 'user_id')
)


class Conversation(BaseModel):
    """Conversations table (from Prisma schema)."""
    __tablename__ = "conversations"
    
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="conversation", uselist=False, lazy="selectin")
    listing = relationship("Listing", foreign_keys=[listing_id], lazy="selectin")
    participants = relationship("User", secondary=conversation_participants, back_populates="conversations", lazy="selectin")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin")
    automations = relationship("MessageAutomation", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_conversation_booking", "booking_id"),
        Index("idx_conversation_listing", "listing_id"),
    )


class Message(BaseModel):
    """Messages table."""
    __tablename__ = "messages"
    
    # Conversation-based (new)
    conversation_id = Column(String(40), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Direct messaging (legacy - for backward compatibility)
    sender_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    receiver_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Related entities (optional)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Message Content
    source = Column(String(50), default="guest", nullable=False)  # guest, host, system
    subject = Column(String(500), nullable=True)  # Legacy field
    body = Column(Text, nullable=False)  # New field name from Prisma
    content = Column(Text, nullable=True)  # Legacy field - alias for body
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Attachments
    attachments = Column(JSONB, default=list, nullable=True)  # List of file URLs
    
    # Metadata
    message_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages", lazy="selectin")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages", lazy="selectin")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages", lazy="selectin")
    listing = relationship("Listing", foreign_keys=[listing_id], lazy="selectin")
    booking = relationship("Booking", foreign_keys=[booking_id], back_populates="messages", lazy="selectin")
    
    __table_args__ = (
        Index("idx_message_conversation", "conversation_id", "created_at"),
        Index("idx_message_sender_receiver", "sender_id", "receiver_id", "is_read"),
        Index("idx_message_booking", "booking_id", "created_at"),
    )


class MessageAutomation(BaseModel):
    """Message automations table (from Prisma schema)."""
    __tablename__ = "message_automations"
    
    conversation_id = Column(String(40), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # auto_reply, reminder, etc.
    config = Column(JSONB, default=dict, nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="automations", lazy="selectin")
    
    __table_args__ = (
        Index("idx_automation_conversation_type", "conversation_id", "type"),
    )
