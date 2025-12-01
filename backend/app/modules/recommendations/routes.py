"""
Recommendation API routes.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_optional_user
from app.modules.users.models import User
from app.modules.listings.models import Listing
from app.modules.recommendations.service import RecommendationService
from app.core.id import ID

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/for-me", response_model=List[Listing])
async def get_my_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get personalized recommendations for the current user.
    Uses collaborative filtering, content-based filtering, and popularity.
    """
    recommendations = await RecommendationService.get_recommendations_for_user(
        db, user_id=current_user.id, limit=limit
    )
    return recommendations


@router.get("/similar/{listing_id}", response_model=List[Listing])
async def get_similar_listings(
    listing_id: ID,
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get listings similar to the specified listing.
    Based on location, type, price, and amenities.
    """
    recommendations = await RecommendationService.get_similar_listings(
        db, listing_id=listing_id, limit=limit
    )
    return recommendations


@router.get("/trending", response_model=List[Listing])
async def get_trending_listings(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
) -> Any:
    """
    Get trending listings based on recent bookings.
    Public endpoint (authentication optional).
    """
    recommendations = await RecommendationService.get_trending_listings(
        db, limit=limit, days=days
    )
    return recommendations

