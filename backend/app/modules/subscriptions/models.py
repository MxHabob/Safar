"""
Subscription plans models for Hosts and Guests.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text,
    Index, ForeignKey, Numeric, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.shared.base import BaseModel


class SubscriptionPlanType(str, enum.Enum):
    """Subscription plan types."""
    HOST = "host"
    GUEST = "guest"


class SubscriptionTier(str, enum.Enum):
    """Subscription tiers."""
    FREE = "free"
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Subscription statuses."""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    TRIAL = "trial"


class SubscriptionPlan(BaseModel):
    """
    Subscription plans table.
    Defines available subscription plans for hosts and guests.
    """
    __tablename__ = "subscription_plans"
    
    # Basic Info
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    plan_type = Column(SQLEnum(SubscriptionPlanType), nullable=False, index=True)
    tier = Column(SQLEnum(SubscriptionTier), nullable=False, index=True)
    
    # Pricing
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_yearly = Column(Numeric(10, 2), nullable=True)  # Optional yearly pricing
    currency = Column(String(10), default="USD", nullable=False)
    
    # Features (stored as JSONB)
    features = Column(JSONB, default=dict, nullable=False)
    
    # Limits
    max_listings = Column(Integer, nullable=True)  # None = unlimited
    max_bookings_per_month = Column(Integer, nullable=True)  # None = unlimited
    max_guests = Column(Integer, nullable=True)  # None = unlimited
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Trial
    trial_days = Column(Integer, default=0, nullable=False)
    
    # Metadata
    description = Column(Text, nullable=True)
    plan_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_subscription_plan_type_tier", "plan_type", "tier", "is_active"),
    )


class Subscription(BaseModel):
    """
    User subscriptions table.
    Tracks active subscriptions for hosts and guests.
    """
    __tablename__ = "subscriptions"
    
    # User
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(40), ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Plan Type
    plan_type = Column(SQLEnum(SubscriptionPlanType), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False, index=True)
    
    # Billing
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, yearly
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Trial
    trial_start = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    is_trial = Column(Boolean, default=False, nullable=False)
    
    # Cancellation
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Payment
    stripe_subscription_id = Column(String(200), nullable=True, unique=True, index=True)
    stripe_customer_id = Column(String(200), nullable=True, index=True)
    
    # Usage tracking
    usage_metadata = Column(JSONB, default=dict, nullable=False)  # Track usage against limits
    
    # Relationships
    user = relationship("User", lazy="selectin")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions", lazy="selectin")
    invoices = relationship("SubscriptionInvoice", back_populates="subscription", lazy="selectin")
    
    __table_args__ = (
        Index("idx_subscription_user_status", "user_id", "status"),
        Index("idx_subscription_period_end", "current_period_end", "status"),
        Index("idx_subscription_stripe", "stripe_subscription_id"),
    )


class SubscriptionInvoice(BaseModel):
    """
    Subscription invoices table.
    Tracks billing history for subscriptions.
    """
    __tablename__ = "subscription_invoices"
    
    # Subscription
    subscription_id = Column(String(40), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Invoice Details
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    # Billing Period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, paid, failed, refunded
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Payment
    stripe_invoice_id = Column(String(200), nullable=True, unique=True, index=True)
    payment_method_id = Column(String(200), nullable=True)
    
    # Metadata
    invoice_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    subscription = relationship("Subscription", back_populates="invoices", lazy="selectin")
    user = relationship("User", lazy="selectin")
    
    __table_args__ = (
        Index("idx_subscription_invoice_user_status", "user_id", "status"),
        Index("idx_subscription_invoice_period", "period_start", "period_end"),
    )

