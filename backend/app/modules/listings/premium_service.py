"""
Premium and Featured Listing Service.
Handles premium listings, featured listings, and host advertising.
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, case
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.listings.models import Listing, ListingStatus
from app.core.id import ID

logger = logging.getLogger(__name__)


class PremiumListingService:
    """Service for managing premium and featured listings."""
    
    # Premium pricing tiers (per month)
    PREMIUM_TIERS = {
        "basic": {
            "name": "Basic Premium",
            "price": Decimal("29.99"),
            "duration_days": 30,
            "priority": 1,
            "features": ["premium_badge", "boosted_search"]
        },
        "standard": {
            "name": "Standard Premium",
            "price": Decimal("49.99"),
            "duration_days": 30,
            "priority": 2,
            "features": ["premium_badge", "boosted_search", "analytics", "priority_support"]
        },
        "premium": {
            "name": "Premium Plus",
            "price": Decimal("99.99"),
            "duration_days": 30,
            "priority": 3,
            "features": ["premium_badge", "boosted_search", "analytics", "priority_support", "featured_placement"]
        }
    }
    
    # Featured pricing (per week)
    FEATURED_PRICING = {
        "weekly": {
            "name": "Featured Listing (Weekly)",
            "price": Decimal("19.99"),
            "duration_days": 7,
            "priority": 5
        },
        "monthly": {
            "name": "Featured Listing (Monthly)",
            "price": Decimal("69.99"),
            "duration_days": 30,
            "priority": 5
        }
    }
    
    @staticmethod
    async def upgrade_to_premium(
        db: AsyncSession,
        listing_id: ID,
        tier: str = "basic",
        duration_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Upgrade a listing to premium status.
        
        Args:
            db: Database session
            listing_id: Listing ID
            tier: Premium tier (basic, standard, premium)
            duration_days: Optional custom duration (defaults to tier duration)
        
        Returns:
            Dictionary with upgrade details
        """
        if tier not in PremiumListingService.PREMIUM_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid premium tier. Must be one of: {list(PremiumListingService.PREMIUM_TIERS.keys())}"
            )
        
        # Get listing
        result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        if listing.status != ListingStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active listings can be upgraded to premium"
            )
        
        tier_info = PremiumListingService.PREMIUM_TIERS[tier]
        duration = duration_days or tier_info["duration_days"]
        
        # Set premium status
        listing.is_premium = True
        listing.premium_priority = tier_info["priority"]
        listing.premium_expires_at = datetime.now(timezone.utc) + timedelta(days=duration)
        
        # If premium tier includes featured, also set featured
        if "featured_placement" in tier_info["features"]:
            listing.is_featured = True
            listing.featured_expires_at = listing.premium_expires_at
        
        await db.commit()
        await db.refresh(listing)
        
        logger.info(
            f"Listing {listing_id} upgraded to premium tier {tier}. "
            f"Expires at: {listing.premium_expires_at}"
        )
        
        return {
            "listing_id": str(listing_id),
            "tier": tier,
            "tier_name": tier_info["name"],
            "price": float(tier_info["price"]),
            "duration_days": duration,
            "expires_at": listing.premium_expires_at.isoformat(),
            "features": tier_info["features"],
            "is_featured": listing.is_featured
        }
    
    @staticmethod
    async def feature_listing(
        db: AsyncSession,
        listing_id: ID,
        duration_days: int = 7
    ) -> Dict[str, Any]:
        """
        Feature a listing (appears in featured section).
        
        Args:
            db: Database session
            listing_id: Listing ID
            duration_days: Duration in days (default 7)
        
        Returns:
            Dictionary with feature details
        """
        # Get listing
        result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        if listing.status != ListingStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active listings can be featured"
            )
        
        # Set featured status
        listing.is_featured = True
        listing.featured_expires_at = datetime.now(timezone.utc) + timedelta(days=duration_days)
        
        # Set high priority for featured listings
        if not listing.is_premium:
            listing.premium_priority = 5
        
        await db.commit()
        await db.refresh(listing)
        
        logger.info(
            f"Listing {listing_id} featured. Expires at: {listing.featured_expires_at}"
        )
        
        return {
            "listing_id": str(listing_id),
            "duration_days": duration_days,
            "expires_at": listing.featured_expires_at.isoformat()
        }
    
    @staticmethod
    async def get_featured_listings(
        db: AsyncSession,
        limit: int = 10,
        city: Optional[str] = None,
        country: Optional[str] = None
    ) -> List[Listing]:
        """
        Get featured listings (for homepage/featured section).
        
        Returns listings sorted by priority and rating.
        """
        now = datetime.now(timezone.utc)
        
        conditions = [
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.is_featured == True,
            or_(
                Listing.featured_expires_at.is_(None),
                Listing.featured_expires_at > now
            )
        ]
        
        if city:
            conditions.append(Listing.city.ilike(f"%{city}%"))
        if country:
            conditions.append(Listing.country.ilike(f"%{country}%"))
        
        query = select(Listing).where(and_(*conditions)).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.location)
        ).order_by(
            Listing.premium_priority.desc(),
            Listing.rating.desc(),
            Listing.review_count.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_premium_listings(
        db: AsyncSession,
        limit: int = 20,
        city: Optional[str] = None,
        country: Optional[str] = None
    ) -> List[Listing]:
        """
        Get premium listings (boosted in search results).
        
        Returns premium listings sorted by priority.
        """
        now = datetime.now(timezone.utc)
        
        conditions = [
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.is_premium == True,
            or_(
                Listing.premium_expires_at.is_(None),
                Listing.premium_expires_at > now
            )
        ]
        
        if city:
            conditions.append(Listing.city.ilike(f"%{city}%"))
        if country:
            conditions.append(Listing.country.ilike(f"%{country}%"))
        
        query = select(Listing).where(and_(*conditions)).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.location)
        ).order_by(
            Listing.premium_priority.desc(),
            Listing.rating.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def expire_premium_listings(db: AsyncSession) -> int:
        """
        Expire premium and featured listings that have passed their expiry date.
        Called by scheduled task (Celery).
        
        Returns:
            Number of listings expired
        """
        now = datetime.now(timezone.utc)
        
        result = await db.execute(
            select(Listing).where(
                and_(
                    or_(
                        Listing.is_premium == True,
                        Listing.is_featured == True
                    ),
                    or_(
                        and_(
                            Listing.premium_expires_at.isnot(None),
                            Listing.premium_expires_at < now
                        ),
                        and_(
                            Listing.featured_expires_at.isnot(None),
                            Listing.featured_expires_at < now
                        )
                    )
                )
            )
        )
        listings = result.scalars().all()
        
        expired_count = 0
        for listing in listings:
            expired = False
            
            if listing.premium_expires_at and listing.premium_expires_at < now:
                listing.is_premium = False
                listing.premium_priority = 0
                expired = True
            
            if listing.featured_expires_at and listing.featured_expires_at < now:
                listing.is_featured = False
                expired = True
            
            if expired:
                expired_count += 1
        
        if expired_count > 0:
            await db.commit()
            logger.info(f"Expired {expired_count} premium/featured listings")
        
        return expired_count
    
    @staticmethod
    async def get_pricing_options() -> Dict[str, Any]:
        """
        Get available pricing options for premium and featured listings.
        
        Returns:
            Dictionary with pricing tiers and options
        """
        return {
            "premium_tiers": PremiumListingService.PREMIUM_TIERS,
            "featured_pricing": PremiumListingService.FEATURED_PRICING
        }

