"""
Multi-tenancy and white-label routes.
"""
from typing import Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.tenancy.service import TenancyService
from app.modules.tenancy.models import Tenant, TenantDomain, TenantConfig
from app.core.id import ID

router = APIRouter(prefix="/tenancy", tags=["Multi-Tenancy"])


@router.get("/tenant")
async def get_current_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get current tenant based on domain or header.
    """
    tenant_id = TenancyService.get_tenant_from_request(request)
    
    if not tenant_id:
        return {"has_tenant": False}
    
    # Try to get by domain
    host = request.headers.get("host", "")
    tenant = await TenancyService.get_tenant_by_domain(db, host)
    
    if not tenant:
        # Try by slug
        tenant = await TenancyService.get_tenant_by_slug(db, tenant_id)
    
    if not tenant:
        return {"has_tenant": False}
    
    return tenant


@router.post("/tenant")
async def create_tenant(
    name: str,
    slug: str,
    domain: Optional[str] = None,
    contact_email: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new tenant (admin only).
    """
    # TODO: Add admin check
    tenant = await TenancyService.create_tenant(
        db=db,
        name=name,
        slug=slug,
        domain=domain,
        contact_email=contact_email
    )
    return tenant


@router.put("/tenant/{tenant_id}/branding")
async def update_branding(
    tenant_id: ID,
    logo_url: Optional[str] = None,
    primary_color: Optional[str] = None,
    secondary_color: Optional[str] = None,
    custom_css: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update tenant branding.
    """
    # TODO: Add tenant admin check
    tenant = await TenancyService.update_tenant_branding(
        db=db,
        tenant_id=tenant_id,
        logo_url=logo_url,
        primary_color=primary_color,
        secondary_color=secondary_color,
        custom_css=custom_css
    )
    return tenant


@router.post("/tenant/{tenant_id}/domain")
async def add_custom_domain(
    tenant_id: ID,
    domain: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Add a custom domain for a tenant.
    """
    tenant_domain = await TenancyService.add_custom_domain(
        db=db,
        tenant_id=tenant_id,
        domain=domain
    )
    return tenant_domain


@router.post("/tenant/domain/verify")
async def verify_domain(
    domain: str,
    verification_token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verify a custom domain.
    """
    tenant_domain = await TenancyService.verify_domain(
        db=db,
        domain=domain,
        verification_token=verification_token
    )
    return tenant_domain


@router.get("/tenant/{tenant_id}/config")
async def get_config(
    tenant_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get tenant configuration.
    """
    config = await TenancyService.get_tenant_config(db, tenant_id)
    
    if not config:
        return {"has_config": False}
    
    return config


@router.put("/tenant/{tenant_id}/config")
async def update_config(
    tenant_id: ID,
    config_updates: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update tenant configuration.
    """
    config = await TenancyService.update_tenant_config(
        db=db,
        tenant_id=tenant_id,
        config_updates=config_updates
    )
    return config

