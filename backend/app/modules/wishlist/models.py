"""
نماذج قوائم الأمنيات - Wishlist Models
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime,
    Index, ForeignKey
)
from sqlalchemy.orm import relationship

from app.shared.base import BaseModel


class Wishlist(BaseModel):
    """
    جدول قوائم الأمنيات
    Wishlists table
    """
    __tablename__ = "wishlists"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="wishlists", lazy="selectin")
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="wishlists", lazy="selectin")
    
    __table_args__ = (
        Index("idx_wishlist_user_listing", "user_id", "listing_id", unique=True),
    )

