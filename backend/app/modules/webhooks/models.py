"""
نماذج Webhooks - Webhook Models
From Prisma Schema
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Index, ForeignKey, ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class WebhookSubscription(BaseModel):
    """
    جدول اشتراكات Webhooks
    Webhook subscriptions table
    """
    __tablename__ = "webhook_subscriptions"
    
    target_url = Column(String(500), nullable=False)
    secret = Column(String(255), nullable=False)
    events = Column(ARRAY(String), default=[], nullable=False)  # List of event types
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Relationships
    events_sent = relationship("WebhookEvent", back_populates="subscription", lazy="selectin")
    
    __table_args__ = (
        Index("idx_webhook_subscription_active", "is_active", "target_url"),
    )


class WebhookEvent(BaseModel):
    """
    جدول أحداث Webhooks
    Webhook events table
    """
    __tablename__ = "webhook_events"
    
    subscription_id = Column(String(40), ForeignKey("webhook_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    payload = Column(JSONB, default=dict, nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, delivered, failed
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    subscription = relationship("WebhookSubscription", back_populates="events_sent", lazy="selectin")
    
    __table_args__ = (
        Index("idx_webhook_event_subscription_status", "subscription_id", "status", "created_at"),
    )

