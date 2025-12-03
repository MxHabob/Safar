"""
User models, enhanced with security features adapted from the original Prisma schema.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Enum as SQLEnum,
    Text, JSON, Index, ForeignKey, Numeric, ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
import enum

from app.shared.base import BaseModel, StringIDBaseModel

# Import conversation_participants for many-to-many relationship
from app.modules.messages.models import conversation_participants


class UserRole(str, enum.Enum):
    """User roles."""
    GUEST = "guest"
    HOST = "host"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    AGENCY = "agency"


class UserStatus(str, enum.Enum):
    """User status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class AccountProvider(str, enum.Enum):
    """Account providers."""
    PASSWORD = "password"
    GOOGLE = "google"
    APPLE = "apple"
    FACEBOOK = "facebook"
    GITHUB = "github"


class User(BaseModel):
    """
    Main users table.
    Stores core identity, authentication, and profile data.
    """
    __tablename__ = "users"
    
    # Basic Info
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    username = Column(String(100), unique=True, index=True, nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    
    # Two-Factor Authentication (2FA)
    totp_secret = Column(String(255), nullable=True)  # TOTP secret key
    totp_enabled = Column(Boolean, default=False, nullable=False, index=True)
    backup_codes = Column(ARRAY(String), default=[], nullable=False)  # Backup codes for 2FA recovery
    
    # Profile
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    full_name = Column(String(200), nullable=True)  # Computed or stored
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Location & Locale
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    language = Column(String(10), default="ar", nullable=False)
    locale = Column(String(10), default="en", nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    
    # Status & Role
    role = Column(SQLEnum(UserRole), default=UserRole.GUEST, nullable=False, index=True)
    roles = Column(ARRAY(String), default=[], nullable=False)  # Multiple roles support
    status = Column(SQLEnum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Multi-tenancy
    agency_id = Column(String(40), ForeignKey("agencies.id"), nullable=True, index=True)
    
    # Metadata
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(INET, nullable=True)
    user_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships - Existing
    listings = relationship("Listing", foreign_keys="Listing.host_id", back_populates="host", lazy="selectin")
    bookings_as_guest = relationship("Booking", foreign_keys="Booking.guest_id", back_populates="guest", lazy="selectin")
    reviews_as_guest = relationship("Review", foreign_keys="Review.guest_id", back_populates="guest", lazy="selectin")
    reviews_as_host = relationship("Review", foreign_keys="Review.host_id", back_populates="host", lazy="selectin")
    wishlists = relationship("Wishlist", back_populates="user", lazy="selectin")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", lazy="selectin")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver", lazy="selectin")
    agency = relationship("Agency", back_populates="users", lazy="selectin")
    
    # Relationships - New from Prisma
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    passkeys = relationship("UserPasskey", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    two_factor_challenges = relationship("TwoFactorChallenge", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    host_profile = relationship("HostProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    conversations = relationship("Conversation", secondary=conversation_participants, back_populates="participants", lazy="selectin")
    loyalty_ledgers = relationship("LoyaltyLedger", back_populates="user", lazy="selectin")
    promotion_redemptions = relationship("PromotionRedemption", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")
    payouts = relationship("Payout", back_populates="host", lazy="selectin")
    audit_logs = relationship("AuditLog", foreign_keys="AuditLog.actor_id", back_populates="actor", lazy="selectin")
    
    # Indexes
    __table_args__ = (
        Index("idx_user_email_active", "email", "is_active"),
        Index("idx_user_role_status", "role", "status"),
        Index("idx_user_agency", "agency_id", "is_active"),
    )
    
    @property
    def computed_full_name(self) -> str:
        """Computed full name derived from first and last name when available."""
        if self.full_name:
            return self.full_name
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username or self.email


class Agency(BaseModel):
    """
    Agencies table for multi-tenancy.
    Represents organizations or travel agencies.
    """
    __tablename__ = "agencies"
    
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    
    # Contact
    email = Column(String(255), nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)
    website = Column(String(500), nullable=True)
    
    # Address
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Settings
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    settings = Column(JSONB, default=dict, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="agency", lazy="selectin")
    listings = relationship("Listing", foreign_keys="Listing.agency_id", back_populates="agency", lazy="selectin")


class UserVerification(BaseModel):
    """
    User verification table (OTP, email verification, etc.).
    """
    __tablename__ = "user_verifications"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_type = Column(String(50), nullable=False)  # email, phone, password_reset
    code = Column(String(10), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    
    __table_args__ = (
        Index("idx_verification_user_type", "user_id", "verification_type", "is_used"),
    )


class Account(BaseModel):
    """OAuth accounts and authentication table."""
    __tablename__ = "accounts"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(SQLEnum(AccountProvider), nullable=False, index=True)
    provider_id = Column(String(255), nullable=False, index=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    scopes = Column(ARRAY(String), default=[], nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="accounts", lazy="selectin")
    
    __table_args__ = (
        Index("idx_account_provider_unique", "provider", "provider_id", unique=True),
        Index("idx_account_user_provider", "user_id", "provider"),
    )


class UserDevice(BaseModel):
    """
    User devices tracking table.
    """
    __tablename__ = "user_devices"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # ios, android, web, desktop
    fingerprint = Column(String(255), nullable=False, index=True)
    last_seen_at = Column(DateTime(timezone=True), server_default="now()", nullable=False)
    is_trusted = Column(Boolean, default=False, nullable=False)
    device_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="devices", lazy="selectin")
    
    __table_args__ = (
        Index("idx_device_user_fingerprint", "user_id", "fingerprint"),
    )


class UserPasskey(BaseModel):
    """
    WebAuthn passkeys table.
    """
    __tablename__ = "user_passkeys"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    credential_id = Column(String(255), unique=True, nullable=False, index=True)
    public_key = Column(Text, nullable=False)
    backed_up = Column(Boolean, default=False, nullable=False)
    transports = Column(ARRAY(String), default=[], nullable=False)
    sign_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="passkeys", lazy="selectin")
    
    __table_args__ = (
        Index("idx_passkey_user_credential", "user_id", "credential_id"),
    )


class TwoFactorChallenge(BaseModel):
    """
    Two-factor authentication challenges table.
    """
    __tablename__ = "two_factor_challenges"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    secret = Column(String(255), nullable=False)
    method = Column(String(50), nullable=False)  # totp, sms, email
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="two_factor_challenges", lazy="selectin")
    
    __table_args__ = (
        Index("idx_2fa_user_expires", "user_id", "expires_at", "consumed_at"),
    )


class HostProfile(BaseModel):
    """
    Host profiles table.
    """
    __tablename__ = "host_profiles"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    legal_name = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, approved, rejected
    badges = Column(ARRAY(String), default=[], nullable=False)
    bio = Column(Text, nullable=True)
    onboarding_step = Column(String(50), default="start", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="host_profile", uselist=False, lazy="selectin")
    tax_documents = relationship("TaxDocument", back_populates="host", cascade="all, delete-orphan", lazy="selectin")
    co_hosts = relationship("CoHost", back_populates="host", cascade="all, delete-orphan", lazy="selectin")
    listings = relationship("Listing", foreign_keys="Listing.host_profile_id", back_populates="host_profile", lazy="selectin")
    payouts = relationship("Payout", back_populates="host_profile", lazy="selectin")
    review_responses = relationship("ReviewResponse", back_populates="host", lazy="selectin")
    
    __table_args__ = (
        Index("idx_host_profile_status", "status", "user_id"),
    )


class CoHost(BaseModel):
    """
    Co-hosts table.
    """
    __tablename__ = "co_hosts"
    
    host_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # co_host, manager, cleaner
    status = Column(String(50), default="invited", nullable=False, index=True)  # invited, active, inactive
    
    # Relationships
    host = relationship("HostProfile", back_populates="co_hosts", lazy="selectin")
    
    __table_args__ = (
        Index("idx_cohost_host_status", "host_id", "status"),
    )


class TaxDocument(BaseModel):
    """
    Tax documents table for hosts.
    """
    __tablename__ = "tax_documents"
    
    host_id = Column(String(40), ForeignKey("host_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # ssn, ein, tax_id, etc.
    identifier = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, verified, rejected
    issued_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    host = relationship("HostProfile", back_populates="tax_documents", lazy="selectin")
    
    __table_args__ = (
        Index("idx_tax_doc_host_status", "host_id", "status"),
    )
