"""
Dispute models (from Prisma schema).
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, DateTime, Index, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class Dispute(BaseModel):
    """
    Disputes table.
    """
    __tablename__ = "disputes"
    
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="open", nullable=False, index=True)  # open, resolved, closed
    resolution = Column(Text, nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="disputes", lazy="selectin")
    evidences = relationship("DisputeEvidence", back_populates="dispute", cascade="all, delete-orphan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_dispute_booking_status", "booking_id", "status"),
    )


class DisputeEvidence(BaseModel):
    """
    Dispute evidence table.
    """
    __tablename__ = "dispute_evidences"
    
    dispute_id = Column(String(40), ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # photo, document, message, etc.
    url = Column(String(1000), nullable=True)
    payload = Column(JSONB, default=dict, nullable=True)
    
    # Relationships
    dispute = relationship("Dispute", back_populates="evidences", lazy="selectin")
    
    __table_args__ = (
        Index("idx_dispute_evidence_type", "dispute_id", "type"),
    )

