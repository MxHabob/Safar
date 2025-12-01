"""
نماذج الحجوزات والمدفوعات - Booking and Payment Models
Enhanced with Timeline Events, Payment Methods, and Payout System
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, JSON, Index, ForeignKey, Numeric, Date, CheckConstraint, UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.shared.base import BaseModel


class BookingStatus(str, enum.Enum):
    """حالات الحجز - Booking statuses"""
    PENDING = "pending"  # في انتظار الموافقة
    CONFIRMED = "confirmed"  # مؤكد
    CANCELLED = "cancelled"  # ملغي
    CHECKED_IN = "checked_in"  # تم تسجيل الدخول
    CHECKED_OUT = "checked_out"  # تم تسجيل الخروج
    COMPLETED = "completed"  # مكتمل
    REJECTED = "rejected"  # مرفوض
    REFUNDED = "refunded"  # مسترد


class PaymentStatus(str, enum.Enum):
    """حالات الدفع - Payment statuses"""
    INITIATED = "initiated"  # تم البدء
    AUTHORIZED = "authorized"  # مصرح
    CAPTURED = "captured"  # تم الاستيلاء
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PayoutStatus(str, enum.Enum):
    """حالات الدفع للمضيف - Payout statuses"""
    SCHEDULED = "scheduled"  # مجدول
    IN_FLIGHT = "in_flight"  # قيد المعالجة
    SETTLED = "settled"  # مستقر
    FAILED = "failed"  # فشل
    CANCELLED = "cancelled"  # ملغي


class PaymentMethodType(str, enum.Enum):
    """طرق الدفع - Payment method types"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    BANK_TRANSFER = "bank_transfer"
    CRYPTO = "crypto"


class Booking(BaseModel):
    """
    جدول الحجوزات الرئيسي
    Main bookings table
    """
    __tablename__ = "bookings"
    
    # Basic Info
    booking_number = Column(String(50), unique=True, nullable=False, index=True)
    listing_id = Column(String(40), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Dates
    check_in = Column(DateTime(timezone=True), nullable=False, index=True)  # Changed to DateTime
    check_out = Column(DateTime(timezone=True), nullable=False, index=True)  # Changed to DateTime
    check_in_date = Column(Date, nullable=True, index=True)  # Keep for backward compatibility
    check_out_date = Column(Date, nullable=True, index=True)  # Keep for backward compatibility
    nights = Column(Integer, nullable=False)
    
    # Guests
    adults = Column(Integer, default=1, nullable=False)
    children = Column(Integer, default=0, nullable=False)
    infants = Column(Integer, default=0, nullable=False)
    guests = Column(Integer, nullable=False)  # Total guests
    total_guests = Column(Integer, nullable=True)  # Alias for guests
    
    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)
    cleaning_fee = Column(Numeric(10, 2), default=0, nullable=False)
    service_fee = Column(Numeric(10, 2), default=0, nullable=False)
    security_deposit = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    coupon_code = Column(String(50), nullable=True, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)  # Changed from total_price
    total_price = Column(Numeric(10, 2), nullable=True)  # Keep for backward compatibility
    payout_amount = Column(Numeric(10, 2), nullable=True)  # Amount to pay host
    currency = Column(String(10), default="USD", nullable=False)
    fees = Column(JSONB, default=dict, nullable=True)  # Detailed fees breakdown
    
    # Status
    status = Column(String(50), default="pending", nullable=False, index=True)  # Changed to String for flexibility
    payment_status = Column(String(50), default="pending", nullable=False, index=True)  # Changed to String
    
    # Payment
    payment_method = Column(SQLEnum(PaymentMethodType), nullable=True)
    payment_intent_id = Column(String(255), nullable=True, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Special Requests
    special_requests = Column(Text, nullable=True)
    guest_message = Column(Text, nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    refund_amount = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Metadata
    booking_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships - Existing
    listing = relationship("Listing", foreign_keys=[listing_id], back_populates="bookings", lazy="selectin")
    guest = relationship("User", foreign_keys=[guest_id], back_populates="bookings_as_guest", lazy="selectin")
    payments = relationship("Payment", back_populates="booking", lazy="selectin")
    reviews = relationship("Review", back_populates="booking", lazy="selectin")
    
    # Relationships - New from Prisma
    timeline_events = relationship("BookingTimelineEvent", back_populates="booking", cascade="all, delete-orphan", lazy="selectin")
    messages = relationship("Message", back_populates="booking", lazy="selectin")
    disputes = relationship("Dispute", back_populates="booking", lazy="selectin")
    payout = relationship("Payout", back_populates="booking", uselist=False, lazy="selectin")
    promotion_redemptions = relationship("PromotionRedemption", back_populates="booking", lazy="selectin")
    conversation = relationship("Conversation", back_populates="booking", uselist=False, lazy="selectin")
    
    # Indexes and Constraints
    __table_args__ = (
        Index("idx_booking_guest_status", "guest_id", "status"),
        Index("idx_booking_listing_dates", "listing_id", "check_in", "check_out"),
        Index("idx_booking_dates", "check_in", "check_out", "status"),
        Index("idx_booking_payment_status", "payment_status", "status"),
        # CRITICAL: Exclusion constraint prevents overlapping bookings for same listing
        # This ensures database-level double-booking prevention
        # Only active bookings (CONFIRMED, PENDING, CHECKED_IN) are considered
        # Uses GIST index for efficient range queries
        # Note: This constraint will be created via migration with proper PostgreSQL syntax
        # The constraint uses tstzrange for date range exclusion
    )


class BookingTimelineEvent(BaseModel):
    """
    جدول أحداث الجدول الزمني للحجز (من Prisma Schema)
    Booking timeline events table from Prisma Schema
    """
    __tablename__ = "booking_timeline_events"
    
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # Booking status at this event
    payload = Column(JSONB, default=dict, nullable=True)  # Additional event data
    
    # Relationships
    booking = relationship("Booking", back_populates="timeline_events", lazy="selectin")
    
    __table_args__ = (
        Index("idx_timeline_booking_status", "booking_id", "status", "created_at"),
    )


class PaymentMethod(BaseModel):
    """
    جدول طرق الدفع المحفوظة (من Prisma Schema)
    Saved payment methods table from Prisma Schema
    """
    __tablename__ = "payment_methods"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # stripe, paypal, etc.
    last4 = Column(String(4), nullable=True)  # Last 4 digits of card
    exp_month = Column(Integer, nullable=True)
    exp_year = Column(Integer, nullable=True)
    token = Column(String(255), nullable=False)  # Encrypted token
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    payments = relationship("Payment", back_populates="method", lazy="selectin")
    
    __table_args__ = (
        Index("idx_payment_method_user_default", "user_id", "is_default"),
    )


class Payment(BaseModel):
    """
    جدول المدفوعات
    Payments table
    """
    __tablename__ = "payments"
    
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True, index=True)
    method_id = Column(String(40), ForeignKey("payment_methods.id", ondelete="SET NULL"), nullable=True, index=True)
    processor = Column(String(50), nullable=False)  # stripe, paypal, etc.
    processor_ref = Column(String(255), nullable=True, index=True)  # External reference
    status = Column(String(50), default="initiated", nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    payment_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Legacy fields for backward compatibility
    payment_method = Column(SQLEnum(PaymentMethodType), nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True, index=True)
    paypal_order_id = Column(String(255), nullable=True, index=True)
    transaction_id = Column(String(255), nullable=True, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    booking = relationship("Booking", foreign_keys=[booking_id], back_populates="payments", lazy="selectin")
    method = relationship("PaymentMethod", foreign_keys=[method_id], back_populates="payments", lazy="selectin")
    
    __table_args__ = (
        Index("idx_payment_booking_status", "booking_id", "status"),
        Index("idx_payment_processor_ref", "processor", "processor_ref"),
        # CRITICAL: Unique constraint to prevent duplicate payment processing
        # This ensures idempotency - same payment_intent_id can only be processed once
        # PostgreSQL allows multiple NULLs in unique columns, which is what we want
        UniqueConstraint("stripe_payment_intent_id", name="uq_payment_stripe_intent"),
    )


class PayoutBatch(BaseModel):
    """
    جدول دفعات الدفع للمضيفين (من Prisma Schema)
    Payout batches table from Prisma Schema
    """
    __tablename__ = "payout_batches"
    
    status = Column(String(50), default="scheduled", nullable=False, index=True)
    currency = Column(String(10), default="USD", nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    payouts = relationship("Payout", back_populates="batch", lazy="selectin")
    
    __table_args__ = (
        Index("idx_payout_batch_status_scheduled", "status", "scheduled_at"),
    )


class Payout(BaseModel):
    """
    جدول المدفوعات للمضيفين (من Prisma Schema)
    Payouts to hosts table from Prisma Schema
    """
    __tablename__ = "payouts"
    
    host_profile_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    host_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # For backward compatibility
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="scheduled", nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    destination = Column(JSONB, default=dict, nullable=True)  # Bank account, etc.
    batch_id = Column(String(40), ForeignKey("payout_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Relationships
    host_profile = relationship("HostProfile", foreign_keys=[host_profile_id], back_populates="payouts", lazy="selectin")
    host = relationship("User", foreign_keys=[host_id], back_populates="payouts", lazy="selectin")
    booking = relationship("Booking", foreign_keys=[booking_id], back_populates="payout", lazy="selectin")
    batch = relationship("PayoutBatch", foreign_keys=[batch_id], back_populates="payouts", lazy="selectin")
    
    __table_args__ = (
        Index("idx_payout_host_status", "host_profile_id", "status"),
        Index("idx_payout_batch", "batch_id", "status"),
    )
