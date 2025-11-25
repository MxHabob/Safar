"""
نماذج العروض والخصومات - Promotion Models
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, Index, ForeignKey, Numeric, Date, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.shared.base import BaseModel


class DiscountType(str, enum.Enum):
    """أنواع الخصومات - Discount types"""
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_NIGHTS = "free_nights"


class PromotionType(str, enum.Enum):
    """أنواع العروض - Promotion types"""
    FLASH_SALE = "flash_sale"
    COUPON = "coupon"
    GROUP_DISCOUNT = "group_discount"
    LAST_MINUTE = "last_minute"
    SEASONAL = "seasonal"
    LOYALTY = "loyalty"


class Coupon(BaseModel):
    """
    جدول الكوبونات
    Coupons table
    """
    __tablename__ = "coupons"
    
    # Basic Info
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Discount
    discount_type = Column(SQLEnum(DiscountType), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)  # Percentage or amount
    max_discount_amount = Column(Numeric(10, 2), nullable=True)  # For percentage discounts
    min_purchase_amount = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Validity
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Usage Limits
    max_uses = Column(Integer, nullable=True)  # Total uses
    max_uses_per_user = Column(Integer, default=1, nullable=False)
    current_uses = Column(Integer, default=0, nullable=False)
    
    # Applicability
    applicable_to_properties = Column(JSONB, default=list, nullable=True)  # List of property IDs
    applicable_to_property_types = Column(JSONB, default=list, nullable=True)  # List of property types
    applicable_to_users = Column(JSONB, default=list, nullable=True)  # List of user IDs (for targeted coupons)
    
    # Metadata
    coupon_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    __table_args__ = (
        Index("idx_coupon_code_active", "code", "is_active"),
        Index("idx_coupon_dates", "start_date", "end_date", "is_active"),
    )


class Promotion(BaseModel):
    """
    جدول العروض الترويجية
    Promotions table
    """
    __tablename__ = "promotions"
    
    # Basic Info
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    promotion_type = Column(SQLEnum(PromotionType), nullable=False, index=True)
    
    # Discount
    discount_type = Column(SQLEnum(DiscountType), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    max_discount_amount = Column(Numeric(10, 2), nullable=True)
    
    # Validity
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(10), nullable=True)  # For flash sales
    end_time = Column(String(10), nullable=True)  # For flash sales
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Applicability
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=True, index=True)
    agency_id = Column(String(40), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Conditions
    min_nights = Column(Integer, nullable=True)
    max_nights = Column(Integer, nullable=True)
    min_guests = Column(Integer, nullable=True)
    advance_booking_days = Column(Integer, nullable=True)  # For last-minute deals
    
    # Metadata
    promotion_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    listing = relationship("Listing", foreign_keys=[listing_id], lazy="selectin")
    agency = relationship("Agency", lazy="selectin")
    redemptions = relationship("PromotionRedemption", back_populates="promotion", lazy="selectin")
    
    __table_args__ = (
        Index("idx_promotion_type_dates", "promotion_type", "start_date", "end_date", "is_active"),
        Index("idx_promotion_listing", "listing_id", "is_active"),
    )


class CounterOffer(BaseModel):
    """
    جدول العروض المضادة (Name Your Price)
    Counter offers table
    """
    __tablename__ = "counter_offers"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Offer Details
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    nights = Column(Integer, nullable=False)
    adults = Column(Integer, default=1, nullable=False)
    children = Column(Integer, default=0, nullable=False)
    
    # Pricing
    offered_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    message = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, accepted, rejected, expired
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # If accepted, create booking
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    listing = relationship("Listing", foreign_keys=[listing_id], lazy="selectin")
    guest = relationship("User", lazy="selectin")
    booking = relationship("Booking", lazy="selectin")
    
    __table_args__ = (
        Index("idx_counter_offer_listing_guest", "listing_id", "guest_id", "status"),
        Index("idx_counter_offer_expires", "expires_at", "status"),
    )


class PromotionRedemption(BaseModel):
    """
    جدول استرداد العروض الترويجية (من Prisma Schema)
    Promotion redemptions table from Prisma Schema
    """
    __tablename__ = "promotion_redemptions"
    
    promotion_id = Column(String(40), ForeignKey("promotions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    promotion = relationship("Promotion", back_populates="redemptions", lazy="selectin")
    user = relationship("User", back_populates="promotion_redemptions", lazy="selectin")
    booking = relationship("Booking", back_populates="promotion_redemptions", lazy="selectin")
    
    __table_args__ = (
        Index("idx_promotion_redemption_unique", "promotion_id", "user_id", "booking_id", unique=True),
    )

