"""
Premium and Featured Listing Routes.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_host
from app.modules.users.models import User
from app.modules.listings.premium_service import PremiumListingService
from app.modules.listings.models import Listing
from app.modules.listings.schemas import ListingResponse
from sqlalchemy import select
from app.core.id import ID

router = APIRouter(prefix="/listings/premium", tags=["Premium Listings"])


@router.post("/{listing_id}/upgrade")
async def upgrade_listing_to_premium(
    listing_id: ID,
    tier: str = Query(..., description="Premium tier: basic, standard, premium"),
    duration_days: Optional[int] = Query(None, description="Custom duration in days"),
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Upgrade a listing to premium status.
    
    Requires host authentication and ownership of the listing.
    """
    # Verify ownership
    result = await db.execute(
        select(Listing).where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upgrade this listing"
        )
    
    result = await PremiumListingService.upgrade_to_premium(
        db, listing_id, tier, duration_days
    )
    return result


@router.post("/{listing_id}/feature")
async def feature_listing(
    listing_id: ID,
    duration_days: int = Query(7, ge=1, le=365, description="Duration in days"),
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Feature a listing (appears in featured section).
    
    Requires host authentication and ownership of the listing.
    """
    # Verify ownership
    result = await db.execute(
        select(Listing).where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to feature this listing"
        )
    
    result = await PremiumListingService.feature_listing(
        db, listing_id, duration_days
    )
    return result


@router.get("/featured", response_model=List[ListingResponse])
async def get_featured_listings(
    limit: int = Query(10, ge=1, le=50),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get featured listings (for homepage/featured section).
    
    Returns listings sorted by priority and rating.
    """
    listings = await PremiumListingService.get_featured_listings(
        db, limit, city, country
    )
    # Convert SQLAlchemy models to Pydantic schemas
    return [ListingResponse.model_validate(listing) for listing in listings]


@router.get("/premium", response_model=List[ListingResponse])
async def get_premium_listings(
    limit: int = Query(20, ge=1, le=100),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get premium listings (boosted in search results).
    
    Returns premium listings sorted by priority.
    """
    listings = await PremiumListingService.get_premium_listings(
        db, limit, city, country
    )
    # Convert SQLAlchemy models to Pydantic schemas
    return [ListingResponse.model_validate(listing) for listing in listings]


@router.get("/pricing")
async def get_pricing_options(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get available pricing options for premium and featured listings.
    
    Returns pricing tiers and options.
    """
    options = await PremiumListingService.get_pricing_options()
    return options

