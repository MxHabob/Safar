"""
Analytics models (from the Prisma schema).
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, DateTime, Index, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class AnalyticsEvent(BaseModel):
    """Analytics events table."""
    __tablename__ = "analytics_events"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_name = Column(String(100), nullable=False, index=True)
    source = Column(String(50), nullable=False, index=True)  # web, mobile, api
    payload = Column(JSONB, default=dict, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default="now()", nullable=False, index=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    
    __table_args__ = (
        Index("idx_analytics_event_name_source", "event_name", "source", "recorded_at"),
        Index("idx_analytics_user_recorded", "user_id", "recorded_at"),
    )


class AuditLog(BaseModel):
    """Audit logs table."""
    __tablename__ = "audit_logs"
    
    actor_id = Column(String(40), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(255), nullable=True, index=True)
    audit_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_id], back_populates="audit_logs", lazy="selectin")
    
    __table_args__ = (
        Index("idx_audit_actor_action", "actor_id", "action", "created_at"),
        Index("idx_audit_resource", "resource", "resource_id", "created_at"),
    )


class SearchSnapshot(BaseModel):
    """Search snapshots table (from Prisma schema)."""
    __tablename__ = "search_snapshots"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    payload = Column(JSONB, default=dict, nullable=False)  # Search index data
    indexed_at = Column(DateTime(timezone=True), server_default="now()", nullable=False, index=True)
    
    # Relationships
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="search_snapshot", uselist=False, lazy="selectin")
    
    __table_args__ = (
        Index("idx_search_snapshot_indexed", "indexed_at"),
    )

