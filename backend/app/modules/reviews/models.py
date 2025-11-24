"""
نماذج التقييمات والمراجعات - Review Models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, JSON, Index, ForeignKey, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class Review(BaseModel):
    """
    جدول التقييمات والمراجعات
    Reviews table
    """
    __tablename__ = "reviews"
    
    # Basic Info
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True, index=True)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    host_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Ratings (1-5)
    overall_rating = Column(Numeric(2, 1), nullable=False)
    cleanliness_rating = Column(Numeric(2, 1), nullable=True)
    communication_rating = Column(Numeric(2, 1), nullable=True)
    check_in_rating = Column(Numeric(2, 1), nullable=True)
    accuracy_rating = Column(Numeric(2, 1), nullable=True)
    location_rating = Column(Numeric(2, 1), nullable=True)
    value_rating = Column(Numeric(2, 1), nullable=True)
    
    # Review Content
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Moderation
    is_verified = Column(Boolean, default=False, nullable=False)  # AI verification
    is_public = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    moderation_status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    moderation_notes = Column(Text, nullable=True)
    
    # Host Response (Legacy - kept for backward compatibility)
    host_response = Column(Text, nullable=True)
    host_response_at = Column(DateTime(timezone=True), nullable=True)
    
    # Visibility (from Prisma)
    visibility = Column(String(50), default="public", nullable=False)  # public, hidden, flagged
    
    # Helpful votes
    helpful_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    metadata = Column(JSONB, default=dict, nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="reviews", lazy="selectin")
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="reviews", lazy="selectin")
    guest = relationship("User", foreign_keys=[guest_id], back_populates="reviews_as_guest", lazy="selectin")
    host = relationship("User", foreign_keys=[host_id], back_populates="reviews_as_host", lazy="selectin")
    
    # New relationship from Prisma
    response = relationship("ReviewResponse", back_populates="review", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("overall_rating >= 1 AND overall_rating <= 5", name="check_overall_rating"),
        Index("idx_review_listing_guest", "listing_id", "guest_id", unique=True),
        Index("idx_review_listing_rating", "listing_id", "overall_rating"),
        Index("idx_review_moderation", "moderation_status", "is_public"),
    )


class ReviewHelpful(BaseModel):
    """
    جدول تقييمات "مفيد" للمراجعات
    Review helpful votes table
    """
    __tablename__ = "review_helpful"
    
    review_id = Column(String(40), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_helpful = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index("idx_review_helpful_unique", "review_id", "user_id", unique=True),
    )


class ReviewResponse(BaseModel):
    """
    جدول ردود المضيفين على التقييمات (من Prisma Schema)
    Host responses to reviews table from Prisma Schema
    """
    __tablename__ = "review_responses"
    
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    host_profile_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    comment = Column(Text, nullable=False)
    
    # Relationships
    review = relationship("Review", back_populates="response", uselist=False, lazy="selectin")
    host = relationship("HostProfile", back_populates="review_responses", lazy="selectin")
    
    __table_args__ = (
        Index("idx_review_response_review", "review_id"),
    )

