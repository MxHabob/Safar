"""
Notification models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, Index, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.shared.base import BaseModel


class NotificationType(str, enum.Enum):
    """Notification types."""
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_PENDING = "booking_pending"
    MESSAGE_RECEIVED = "message_received"
    REVIEW_RECEIVED = "review_received"
    PAYMENT_RECEIVED = "payment_received"
    PROMOTION = "promotion"
    SYSTEM = "system"


class NotificationChannel(str, enum.Enum):
    """Notification delivery channels."""
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"


class Notification(BaseModel):
    """Notifications table."""
    __tablename__ = "notifications"
    
    # Recipient
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Notification Details
    notification_type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Channels
    sent_email = Column(Boolean, default=False, nullable=False)
    sent_push = Column(Boolean, default=False, nullable=False)
    sent_sms = Column(Boolean, default=False, nullable=False)
    
    # Related Entities
    related_entity_type = Column(String(50), nullable=True)  # booking, message, review, etc.
    related_entity_id = Column(String(40), nullable=True)
    
    # Action URL
    action_url = Column(String(500), nullable=True)
    
    # Metadata
    notification_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    
    __table_args__ = (
        Index("idx_notification_user_read", "user_id", "is_read", "created_at"),
        Index("idx_notification_type", "notification_type", "created_at"),
    )

