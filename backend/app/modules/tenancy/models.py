"""
Multi-tenancy and white-label models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text,
    Index, ForeignKey, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class Tenant(BaseModel):
    """
    Tenants table (for white-label multi-tenancy).
    Each tenant represents a separate brand/organization.
    """
    __tablename__ = "tenants"
    
    # Basic Info
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(200), unique=True, nullable=True, index=True)  # Custom domain
    
    # Branding
    logo_url = Column(String(1000), nullable=True)
    favicon_url = Column(String(1000), nullable=True)
    primary_color = Column(String(20), default="#007bff", nullable=False)
    secondary_color = Column(String(20), nullable=True)
    background_color = Column(String(20), nullable=True)
    text_color = Column(String(20), nullable=True)
    
    # Customization
    custom_css = Column(Text, nullable=True)
    custom_js = Column(Text, nullable=True)
    custom_footer = Column(Text, nullable=True)
    custom_header = Column(Text, nullable=True)
    
    # Contact Info
    contact_email = Column(String(200), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    support_email = Column(String(200), nullable=True)
    
    # Features
    features = Column(JSONB, default=dict, nullable=False)  # Enabled features
    settings = Column(JSONB, default=dict, nullable=False)  # Tenant-specific settings
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Limits
    max_users = Column(Integer, nullable=True)  # None = unlimited
    max_listings = Column(Integer, nullable=True)  # None = unlimited
    
    # Metadata
    tenant_metadata = Column("metadata", JSONB, default=dict, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="tenant", lazy="selectin")
    listings = relationship("Listing", back_populates="tenant", lazy="selectin")
    
    __table_args__ = (
        Index("idx_tenant_slug_active", "slug", "is_active"),
        Index("idx_tenant_domain", "domain"),
    )


class TenantDomain(BaseModel):
    """
    Tenant custom domains table.
    Maps custom domains to tenants.
    """
    __tablename__ = "tenant_domains"
    
    tenant_id = Column(String(40), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    domain = Column(String(200), unique=True, nullable=False, index=True)
    
    # SSL
    ssl_certificate = Column(Text, nullable=True)
    ssl_key = Column(Text, nullable=True)
    ssl_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(100), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", lazy="selectin")
    
    __table_args__ = (
        Index("idx_tenant_domain_active", "domain", "is_active"),
    )


class TenantConfig(BaseModel):
    """
    Tenant configuration table.
    Stores tenant-specific configuration.
    """
    __tablename__ = "tenant_configs"
    
    tenant_id = Column(String(40), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # API Configuration
    api_rate_limit = Column(Integer, default=1000, nullable=False)  # Requests per hour
    api_key = Column(String(200), unique=True, nullable=True, index=True)
    
    # Feature Flags
    enable_bookings = Column(Boolean, default=True, nullable=False)
    enable_payments = Column(Boolean, default=True, nullable=False)
    enable_reviews = Column(Boolean, default=True, nullable=False)
    enable_messaging = Column(Boolean, default=True, nullable=False)
    enable_analytics = Column(Boolean, default=True, nullable=False)
    
    # Integration Settings
    stripe_account_id = Column(String(200), nullable=True)
    paypal_merchant_id = Column(String(200), nullable=True)
    
    # Custom Settings
    config_data = Column(JSONB, default=dict, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", uselist=False, lazy="selectin")
    
    __table_args__ = (
        Index("idx_tenant_config_api_key", "api_key"),
    )

