"""
Webhook Events Model - For tracking processed webhook events
CRITICAL: Prevents duplicate processing of webhook events
"""
from sqlalchemy import Column, String, DateTime, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.shared.base import BaseModel


class WebhookEvent(BaseModel):
    """Processed webhook events.

    CRITICAL: Tracks all processed webhook events to ensure idempotency and
    prevents duplicate processing when Stripe retries webhook events.
    """
    __tablename__ = "webhook_events"
    
    # Event identification
    event_id = Column(String(255), unique=True, nullable=False, index=True)  # Stripe event ID
    event_type = Column(String(100), nullable=False, index=True)  # payment_intent.succeeded, etc.
    source = Column(String(50), default="stripe", nullable=False, index=True)  # stripe, paypal, etc.
    
    # Event data
    payload = Column(JSONB, default=dict, nullable=True)  # Full event payload
    processed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Processing status
    status = Column(String(50), default="processed", nullable=False, index=True)  # processed, failed, retrying
    error_message = Column(Text, nullable=True)  # Error if processing failed
    
    __table_args__ = (
        # CRITICAL: Unique constraint ensures same event_id is only processed once
        UniqueConstraint("event_id", name="uq_webhook_event_id"),
        Index("idx_webhook_event_type_status", "event_type", "status", "processed_at"),
        Index("idx_webhook_source_event_id", "source", "event_id"),
    )
