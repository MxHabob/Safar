"""
نماذج القوائم - Listing Models
Enhanced with PostGIS and advanced features from Prisma Schema
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, JSON, Index, ForeignKey, Numeric, Date, ARRAY, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from geoalchemy2 import Geography
import enum

from app.shared.base import BaseModel


class ListingType(str, enum.Enum):
    """Listing types"""
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    ROOM = "room"
    STUDIO = "studio"
    CONDO = "condo"
    TOWNHOUSE = "townhouse"
    CABIN = "cabin"
    CASTLE = "castle"
    TREEHOUSE = "treehouse"
    BOAT = "boat"
    CAMPER = "camper"
    EXPERIENCE = "experience"


class ListingStatus(str, enum.Enum):
    """حالة القائمة - Listing status"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_REVIEW = "pending_review"


class BookingType(str, enum.Enum):
    """نوع الحجز - Booking type"""
    INSTANT = "instant"  # حجز فوري
    REQUEST = "request"  # حجز بطلب موافقة


class Listing(BaseModel):
    """
    جدول القوائم الرئيسي
    Main listings table
    """
    __tablename__ = "listings"
    
    # Basic Info
    title = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, nullable=False, index=True)
    summary = Column(String(500), nullable=True)  # Short summary
    description = Column(Text, nullable=True)
    listing_type = Column(String(50), nullable=False, index=True)  # Listing type
    status = Column(String(50), default="draft", nullable=False, index=True)  # Changed to String
    
    # Host - Support both direct user and host profile
    host_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # Keep for backward compatibility
    host_profile_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    agency_id = Column(String(40), ForeignKey("agencies.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Location - Basic address fields
    address_line1 = Column(String(500), nullable=False)
    address_line2 = Column(String(500), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False, index=True)
    postal_code = Column(String(20), nullable=True)
    
    # Legacy location fields (for backward compatibility)
    address = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    # Accommodation Details
    capacity = Column(Integer, default=1, nullable=False)  # Total capacity
    bedrooms = Column(Integer, default=0, nullable=False)
    beds = Column(Integer, default=0, nullable=False)
    bathrooms = Column(Numeric(3, 1), default=0, nullable=False)  # Changed to Float
    max_guests = Column(Integer, default=1, nullable=False)
    square_meters = Column(Integer, nullable=True)
    
    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    cleaning_fee = Column(Numeric(10, 2), default=0, nullable=False)
    service_fee = Column(Numeric(10, 2), default=0, nullable=False)
    security_deposit = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Booking Settings
    booking_type = Column(SQLEnum(BookingType), default=BookingType.REQUEST, nullable=False)
    min_stay_nights = Column(Integer, default=1, nullable=False)
    max_stay_nights = Column(Integer, nullable=True)
    check_in_time = Column(String(10), default="15:00", nullable=False)
    check_out_time = Column(String(10), default="11:00", nullable=False)
    
    # Ratings & Reviews
    rating = Column(Numeric(3, 2), default=0, nullable=False, index=True)
    review_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    listing_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships - Existing
    host = relationship("User", foreign_keys=[host_id], lazy="selectin")
    host_profile = relationship("HostProfile", foreign_keys=[host_profile_id], lazy="selectin")
    agency = relationship("Agency", lazy="selectin")
    photos = relationship("ListingPhoto", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    amenities = relationship("ListingAmenity", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    rules = relationship("ListingRule", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    availability = relationship("ListingAvailability", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    pricing_rules = relationship("PricingRule", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    bookings = relationship("Booking", back_populates="listing", lazy="selectin")
    reviews = relationship("Review", back_populates="listing", lazy="selectin")
    wishlists = relationship("Wishlist", back_populates="listing", lazy="selectin")
    
    # Relationships - New from Prisma
    location = relationship("ListingLocation", back_populates="listing", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    calendar = relationship("Calendar", back_populates="listing", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    seasonal_overrides = relationship("SeasonalOverride", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    price_calendars = relationship("PriceCalendar", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    blocked_dates = relationship("BlockedDate", back_populates="listing", cascade="all, delete-orphan", lazy="selectin")
    pricing_model = relationship("PricingModel", back_populates="listing", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    draft = relationship("ListingDraft", back_populates="listing", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    search_snapshot = relationship("SearchSnapshot", back_populates="listing", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    
    # Indexes
    __table_args__ = (
        Index("idx_listing_location", "latitude", "longitude"),
        Index("idx_listing_host_status", "host_id", "status"),
        Index("idx_listing_host_profile_status", "host_profile_id", "status"),
        Index("idx_listing_type_status", "listing_type", "status"),
        Index("idx_listing_city_country", "city", "country", "status"),
        Index("idx_listing_rating", "rating", "review_count"),
    )


class ListingLocation(BaseModel):
    """
    جدول مواقع القوائم مع PostGIS
    Listing locations with PostGIS support
    """
    __tablename__ = "listing_locations"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    neighborhood = Column(String(200), nullable=True)
    coordinates = Column(Geography('POINT', srid=4326), nullable=False)  # PostGIS Geography Point
    
    # Relationships
    listing = relationship("Listing", back_populates="location", uselist=False, lazy="selectin")
    
    __table_args__ = (
        Index("idx_listing_location_coords", "coordinates", postgresql_using="gist"),
    )


class ListingPhoto(BaseModel):
    """
    جدول صور القوائم (Legacy - kept for backward compatibility)
    Listing photos table
    """
    __tablename__ = "listing_photos"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(1000), nullable=False)
    thumbnail_url = Column(String(1000), nullable=True)
    caption = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    position = Column(Integer, default=0, nullable=False)  # Alias for display_order
    is_primary = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    listing = relationship("Listing", back_populates="photos", lazy="selectin")
    
    __table_args__ = (
        Index("idx_photo_listing_order", "listing_id", "display_order"),
    )


class ListingImage(BaseModel):
    """
    جدول صور القوائم (New from Prisma)
    Listing images table
    """
    __tablename__ = "listing_images"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(1000), nullable=False)
    caption = Column(String(500), nullable=True)
    position = Column(Integer, default=0, nullable=False)
    
    # Relationships
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="images", lazy="selectin")
    
    __table_args__ = (
        Index("idx_image_listing_position", "listing_id", "position"),
    )


class Amenity(BaseModel):
    """
    جدول المرافق العامة
    Amenities master table
    """
    __tablename__ = "amenities"
    
    key = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=True)
    name_en = Column(String(100), nullable=True)
    label = Column(String(100), nullable=True)  # Alias for name
    icon = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True, index=True)  # basic, safety, entertainment, etc.
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    listings = relationship("ListingAmenity", back_populates="amenity", lazy="selectin")


class ListingAmenity(BaseModel):
    """
    جدول علاقة القوائم بالمرافق
    Listing-Amenity relationship table
    """
    __tablename__ = "listing_amenities"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    amenity_id = Column(String(40), ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="amenities", lazy="selectin")
    amenity = relationship("Amenity", back_populates="listings", lazy="selectin")
    
    __table_args__ = (
        Index("idx_listing_amenity_unique", "listing_id", "amenity_id", unique=True),
    )


class ListingRule(BaseModel):
    """
    جدول قواعد القائمة
    Listing rules table
    """
    __tablename__ = "listing_rules"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(50), nullable=False)  # smoking, pets, parties, etc.
    rule_type = Column(String(50), nullable=True)  # Alias for key
    value = Column(String(500), nullable=False)  # allowed, not_allowed, conditional
    rule_value = Column(String(500), nullable=True)  # Alias for value
    description = Column(Text, nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="rules", lazy="selectin")


class ListingAvailability(BaseModel):
    """
    جدول توفر القائمة (Calendar) - Legacy simple version
    Listing availability calendar - Simple version
    """
    __tablename__ = "listing_availability"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    is_available = Column(Boolean, default=True, nullable=False)
    price_override = Column(Numeric(10, 2), nullable=True)  # Override base price for this date
    min_stay_override = Column(Integer, nullable=True)  # Override min stay for this date
    notes = Column(String(500), nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="availability", lazy="selectin")
    
    __table_args__ = (
        Index("idx_availability_listing_date", "listing_id", "date", unique=True),
        Index("idx_availability_date_available", "date", "is_available"),
    )


class Calendar(BaseModel):
    """
    جدول التقويم المتقدم (من Prisma Schema)
    Advanced calendar table from Prisma Schema
    """
    __tablename__ = "calendars"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    external_ical_urls = Column(ARRAY(String), default=[], nullable=False)
    availability_windows = Column(JSONB, default=dict, nullable=True)  # Store availability rules
    
    # Relationships
    listing = relationship("Listing", back_populates="calendar", uselist=False, lazy="selectin")
    blocks = relationship("AvailabilityWindow", back_populates="calendar", cascade="all, delete-orphan", lazy="selectin")


class AvailabilityWindow(BaseModel):
    """
    جدول نوافذ التوفر (من Prisma Schema)
    Availability windows table from Prisma Schema
    """
    __tablename__ = "availability_windows"
    
    calendar_id = Column(String(40), ForeignKey("calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=False, index=True)
    reason = Column(String(500), nullable=True)
    source = Column(String(50), default="manual", nullable=False)  # manual, external, system
    
    # Relationships
    calendar = relationship("Calendar", back_populates="blocks", lazy="selectin")
    
    __table_args__ = (
        Index("idx_availability_window_dates", "starts_at", "ends_at"),
    )


class BlockedDate(BaseModel):
    """
    جدول التواريخ المحظورة
    Blocked dates table
    """
    __tablename__ = "blocked_dates"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    reason = Column(String(500), nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="blocked_dates", lazy="selectin")
    
    __table_args__ = (
        Index("idx_blocked_date_listing_date", "listing_id", "date", unique=True),
    )


class SeasonalOverride(BaseModel):
    """
    جدول التجاوزات الموسمية
    Seasonal overrides table
    """
    __tablename__ = "seasonal_overrides"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=False, index=True)
    min_nights = Column(Integer, nullable=True)
    max_nights = Column(Integer, nullable=True)
    price_factor = Column(Numeric(5, 2), nullable=True)  # Multiplier for base price
    
    # Relationships
    listing = relationship("Listing", back_populates="seasonal_overrides", lazy="selectin")
    
    __table_args__ = (
        Index("idx_seasonal_override_dates", "starts_at", "ends_at"),
    )


class PricingRule(BaseModel):
    """
    جدول قواعد التسعير الديناميكي
    Dynamic pricing rules table
    """
    __tablename__ = "pricing_rules"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type = Column(String(50), nullable=False)  # weekend, seasonal, last_minute, length_of_stay, etc.
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    day_of_week = Column(Integer, nullable=True)  # 0=Monday, 6=Sunday
    price_modifier = Column(Numeric(5, 2), nullable=False)  # Percentage or fixed amount
    modifier_type = Column(String(20), default="percentage", nullable=False)  # percentage, fixed
    min_nights = Column(Integer, nullable=True)
    max_nights = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    listing = relationship("Listing", back_populates="pricing_rules", lazy="selectin")
    
    __table_args__ = (
        Index("idx_pricing_listing_dates", "listing_id", "start_date", "end_date"),
        Index("idx_pricing_listing_active", "listing_id", "is_active"),
    )


class PricingModel(BaseModel):
    """
    جدول نماذج التسعير (من Prisma Schema)
    Pricing models table from Prisma Schema
    """
    __tablename__ = "pricing_models"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    strategy = Column(String(50), default="dynamic", nullable=False)  # dynamic, static, ml
    provider = Column(String(50), default="safar-ml", nullable=False)
    pricing_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="pricing_model", uselist=False, lazy="selectin")
    rules = relationship("PricingModelRule", back_populates="pricing_model", cascade="all, delete-orphan", lazy="selectin")


class PricingModelRule(BaseModel):
    """
    جدول قواعد نماذج التسعير (من Prisma Schema)
    Pricing model rules table from Prisma Schema
    """
    __tablename__ = "pricing_model_rules"
    
    pricing_model_id = Column(String(40), ForeignKey("pricing_models.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    payload = Column(JSONB, default=dict, nullable=False)
    
    # Relationships
    pricing_model = relationship("PricingModel", back_populates="rules", lazy="selectin")


class PriceCalendar(BaseModel):
    """
    جدول تقويم الأسعار (من Prisma Schema)
    Price calendar table from Prisma Schema
    """
    __tablename__ = "price_calendars"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    nightly_rate = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    min_stay = Column(Integer, default=1, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    listing = relationship("Listing", back_populates="price_calendars", lazy="selectin")
    
    __table_args__ = (
        Index("idx_price_calendar_listing_date", "listing_id", "date", unique=True),
    )


class ListingDraft(BaseModel):
    """
    جدول مسودات القوائم (من Prisma Schema)
    Listing drafts table from Prisma Schema
    """
    __tablename__ = "listing_drafts"
    
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=True, index=True)
    host_profile_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    payload = Column(JSONB, default=dict, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    
    # Relationships
    listing = relationship("Listing", back_populates="draft", uselist=False, lazy="selectin")
    host_profile = relationship("HostProfile", lazy="selectin")

