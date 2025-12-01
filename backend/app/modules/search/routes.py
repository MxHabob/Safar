"""
Search API routes.
"""
from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
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
    sort_by: str = Query("relevance", description="Sort by: relevance, price_asc, price_desc, rating, newest"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Search listings with text, filter, and location parameters."""
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
        sort_by=sort_by
    )
    
    return {
        "items": listings,
        "total": total,
        "skip": skip,
        "limit": limit,
        "query": query
    }


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get search suggestions for the given query string."""
    suggestions = await SearchService.get_search_suggestions(db, query, limit)
    
    return {"suggestions": suggestions}

