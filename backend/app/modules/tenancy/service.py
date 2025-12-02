"""
Multi-tenancy and white-label service.
"""
import logging
import secrets
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status, Request

from app.modules.tenancy.models import Tenant, TenantDomain, TenantConfig
from app.core.id import ID

logger = logging.getLogger(__name__)


class TenancyService:
    """Service for managing multi-tenancy and white-label features."""
    
    @staticmethod
    async def get_tenant_by_domain(
        db: AsyncSession,
        domain: str
    ) -> Optional[Tenant]:
        """Get tenant by domain (for custom domain routing)."""
        # Try exact domain match first
        result = await db.execute(
            select(Tenant).where(
                and_(
                    Tenant.domain == domain,
                    Tenant.is_active == True
                )
            )
        )
        tenant = result.scalar_one_or_none()
        
        if tenant:
            return tenant
        
        # Try tenant domains table
        result = await db.execute(
            select(TenantDomain)
            .where(
                and_(
                    TenantDomain.domain == domain,
                    TenantDomain.is_active == True,
                    TenantDomain.is_verified == True
                )
            )
            .options(selectinload(TenantDomain.tenant))
        )
        tenant_domain = result.scalar_one_or_none()
        
        if tenant_domain:
            return tenant_domain.tenant
        
        return None
    
    @staticmethod
    async def get_tenant_by_slug(
        db: AsyncSession,
        slug: str
    ) -> Optional[Tenant]:
        """Get tenant by slug."""
        result = await db.execute(
            select(Tenant).where(
                and_(
                    Tenant.slug == slug,
                    Tenant.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_tenant(
        db: AsyncSession,
        name: str,
        slug: str,
        domain: Optional[str] = None,
        contact_email: Optional[str] = None
    ) -> Tenant:
        """Create a new tenant."""
        # Check if slug exists
        existing = await TenancyService.get_tenant_by_slug(db, slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant slug already exists"
            )
        
        # Check if domain exists
        if domain:
            existing_domain = await TenancyService.get_tenant_by_domain(db, domain)
            if existing_domain:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Domain already in use"
                )
        
        tenant = Tenant(
            name=name,
            slug=slug,
            domain=domain,
            contact_email=contact_email,
            features={},
            settings={},
            is_active=True,
            is_verified=False
        )
        
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        
        # Create default config
        config = TenantConfig(
            tenant_id=tenant.id,
            config_data={}
        )
        db.add(config)
        await db.commit()
        
        logger.info(f"Created tenant: {tenant.id} ({slug})")
        return tenant
    
    @staticmethod
    async def update_tenant_branding(
        db: AsyncSession,
        tenant_id: ID,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
        secondary_color: Optional[str] = None,
        custom_css: Optional[str] = None
    ) -> Tenant:
        """Update tenant branding."""
        result = await db.execute(
            select(Tenant).where(Tenant.id == tenant_id)
        )
        tenant = result.scalar_one_or_none()
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        if logo_url is not None:
            tenant.logo_url = logo_url
        if primary_color is not None:
            tenant.primary_color = primary_color
        if secondary_color is not None:
            tenant.secondary_color = secondary_color
        if custom_css is not None:
            tenant.custom_css = custom_css
        
        await db.commit()
        await db.refresh(tenant)
        
        return tenant
    
    @staticmethod
    async def add_custom_domain(
        db: AsyncSession,
        tenant_id: ID,
        domain: str
    ) -> TenantDomain:
        """Add a custom domain for a tenant."""
        # Check if domain already exists
        result = await db.execute(
            select(TenantDomain).where(TenantDomain.domain == domain)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already in use"
            )
        
        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        
        tenant_domain = TenantDomain(
            tenant_id=tenant_id,
            domain=domain,
            verification_token=verification_token,
            is_verified=False,
            is_active=False
        )
        
        db.add(tenant_domain)
        await db.commit()
        await db.refresh(tenant_domain)
        
        logger.info(f"Added custom domain {domain} for tenant {tenant_id}")
        
        return tenant_domain
    
    @staticmethod
    async def verify_domain(
        db: AsyncSession,
        domain: str,
        verification_token: str
    ) -> TenantDomain:
        """Verify a custom domain."""
        result = await db.execute(
            select(TenantDomain).where(
                and_(
                    TenantDomain.domain == domain,
                    TenantDomain.verification_token == verification_token
                )
            )
        )
        tenant_domain = result.scalar_one_or_none()
        
        if not tenant_domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain or verification token not found"
            )
        
        tenant_domain.is_verified = True
        tenant_domain.verified_at = datetime.now(timezone.utc)
        tenant_domain.is_active = True
        
        await db.commit()
        await db.refresh(tenant_domain)
        
        return tenant_domain
    
    @staticmethod
    async def get_tenant_config(
        db: AsyncSession,
        tenant_id: ID
    ) -> Optional[TenantConfig]:
        """Get tenant configuration."""
        result = await db.execute(
            select(TenantConfig).where(TenantConfig.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_tenant_config(
        db: AsyncSession,
        tenant_id: ID,
        config_updates: Dict[str, Any]
    ) -> TenantConfig:
        """Update tenant configuration."""
        config = await TenancyService.get_tenant_config(db, tenant_id)
        
        if not config:
            # Create config if it doesn't exist
            config = TenantConfig(
                tenant_id=tenant_id,
                config_data={}
            )
            db.add(config)
        
        # Update config data
        if "config_data" in config_updates:
            config.config_data.update(config_updates["config_data"])
        
        # Update feature flags
        feature_flags = [
            "enable_bookings", "enable_payments", "enable_reviews",
            "enable_messaging", "enable_analytics"
        ]
        for flag in feature_flags:
            if flag in config_updates:
                setattr(config, flag, config_updates[flag])
        
        await db.commit()
        await db.refresh(config)
        
        return config
    
    @staticmethod
    def get_tenant_from_request(request: Request) -> Optional[str]:
        """Extract tenant identifier from request (domain or header)."""
        # Check X-Tenant-ID header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        # Check host header for domain-based routing
        host = request.headers.get("host", "")
        if host:
            # Extract subdomain or domain
            parts = host.split(".")
            if len(parts) >= 2:
                # Could be subdomain.tenant.com or tenant.com
                return parts[0] if len(parts) > 2 else None
        
        return None

