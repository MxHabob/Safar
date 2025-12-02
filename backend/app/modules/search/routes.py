"""
Search API routes.
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.search.schemas import (
    SearchRequest, SearchResponse, SearchSuggestionsResponse
)
from app.modules.search.services import SearchService
from app.modules.listings.models import ListingType

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/listings", response_model=SearchResponse)
async def search_listings(
    query: str = Query(None),
    city: str = Query(None),
    country: str = Query(None),
    listing_type: ListingType = Query(None),
    min_price: float = Query(None, ge=0),
    max_price: float = Query(None, ge=0),
    min_guests: int = Query(None, ge=1),
    min_bedrooms: int = Query(None, ge=0),
    min_bathrooms: int = Query(None, ge=0),
    latitude: float = Query(None, ge=-90, le=90),
    longitude: float = Query(None, ge=-180, le=180),
    radius_km: float = Query(None, ge=0, le=1000),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    sort_by: str = Query("relevance", description="Sort by: relevance, price_asc, price_desc, rating, newest, popularity"),
    enable_personalization: bool = Query(True, description="Enable personalization boost"),
    enable_popularity_boost: bool = Query(True, description="Enable popularity boost"),
    enable_location_boost: bool = Query(True, description="Enable location boost"),
    ab_test_variant: str = Query(None, description="A/B test variant (variant_a, variant_b, variant_c)"),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)  # Use read replica for search queries
) -> Any:
    """
    Search listings with enhanced relevance ranking.
    
    Features:
    - Full-text search with PostgreSQL
    - Personalization boost (based on user's booking history)
    - Popularity boost (based on bookings and reviews)
    - Location boost (boost listings closer to search location)
    - A/B testing support for ranking algorithms
    """
    # Determine A/B test variant (simple hash-based assignment)
    if not ab_test_variant and current_user:
        import hashlib
        user_hash = int(hashlib.md5(str(current_user.id).encode()).hexdigest(), 16)
        variant_num = user_hash % 3
        ab_test_variant = ["variant_a", "variant_b", "variant_c"][variant_num]
    
    listings, total = await SearchService.search_listings(
        db=db,
        query=query,
        city=city,
        country=country,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_guests=min_guests,
        min_bedrooms=min_bedrooms,
        min_bathrooms=min_bathrooms,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        user_id=str(current_user.id) if current_user else None,
        enable_personalization=enable_personalization,
        enable_popularity_boost=enable_popularity_boost,
        enable_location_boost=enable_location_boost,
        ab_test_variant=ab_test_variant
    )
    
    return {
        "items": listings,
        "total": total,
        "skip": skip,
        "limit": limit,
        "query": query,
        "ab_test_variant": ab_test_variant
    }


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_read_db)  # Use read replica for search suggestions
) -> Any:
    """Get search suggestions for the given query string."""
    suggestions = await SearchService.get_search_suggestions(db, query, limit)
    
    return {"suggestions": suggestions}

