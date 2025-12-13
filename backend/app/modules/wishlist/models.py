"""
Wishlist models.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime,
    Index, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import secrets

from app.shared.base import BaseModel


def generate_share_token():
    """Generate a secure share token."""
    return secrets.token_urlsafe(32)


class Wishlist(BaseModel):
    """
    Wishlists table.
    """
    __tablename__ = "wishlists"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="wishlists", lazy="selectin")
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="wishlists", lazy="selectin")
    shares = relationship("WishlistShare", back_populates="wishlist", cascade="all, delete-orphan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_wishlist_user_listing", "user_id", "listing_id", unique=True),
    )


class WishlistShare(BaseModel):
    """
    Wishlist sharing table.
    Allows users to share their wishlists with others.
    """
    __tablename__ = "wishlist_shares"
    
    wishlist_id = Column(String(40), ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_by_user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_with_user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    shared_with_email = Column(String(255), nullable=True, index=True)
    share_token = Column(String(128), unique=True, nullable=False, index=True, default=generate_share_token)
    permission = Column(String(20), default="view", nullable=False)  # view, edit
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Relationships
    wishlist = relationship("Wishlist", back_populates="shares", lazy="selectin")
    shared_by_user = relationship("User", foreign_keys=[shared_by_user_id], lazy="selectin")
    shared_with_user = relationship("User", foreign_keys=[shared_with_user_id], lazy="selectin")
    
    __table_args__ = (
        Index("idx_wishlist_share_token", "share_token", unique=True),
        Index("idx_wishlist_share_active", "is_active", "expires_at"),
    )

