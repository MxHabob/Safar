"""
Recommendation API routes.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.dependencies import get_current_active_user, get_optional_user, require_admin
from app.modules.users.models import User
from app.modules.listings.schemas import ListingResponse
from app.modules.recommendations.service import RecommendationService
from app.modules.recommendations.ml_service import MLRecommendationEngine
from app.core.id import ID

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Initialize ML engine
ml_engine = MLRecommendationEngine()


@router.get("/for-me", response_model=List[ListingResponse])
async def get_my_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_read_db)  # Use read replica for recommendation queries
) -> Any:
    """
    Get personalized recommendations for the current user.
    Uses collaborative filtering, content-based filtering, and popularity.
    """
    recommendations = await RecommendationService.get_recommendations_for_user(
        db, user_id=current_user.id, limit=limit
    )
    # Convert SQLAlchemy models to Pydantic schemas
    return [ListingResponse.model_validate(listing) for listing in recommendations]


@router.get("/similar/{listing_id}", response_model=List[ListingResponse])
async def get_similar_listings(
    listing_id: ID,
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_read_db)  # Use read replica for read queries
) -> Any:
    """
    Get listings similar to the specified listing.
    Based on location, type, price, and amenities.
    """
    recommendations = await RecommendationService.get_similar_listings(
        db, listing_id=listing_id, limit=limit
    )
    # Convert SQLAlchemy models to Pydantic schemas
    return [ListingResponse.model_validate(listing) for listing in recommendations]


@router.get("/trending", response_model=List[ListingResponse])
async def get_trending_listings(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_read_db),  # Use read replica for trending queries
    current_user: User = Depends(get_optional_user)
) -> Any:
    """
    Get trending listings based on recent bookings.
    Public endpoint (authentication optional).
    """
    recommendations = await RecommendationService.get_trending_listings(
        db, limit=limit, days=days
    )
    # Convert SQLAlchemy models to Pydantic schemas
    return [ListingResponse.model_validate(listing) for listing in recommendations]


# ML-based Recommendation Engine v2 Endpoints

@router.get("/ml/for-me")
async def get_ml_recommendations(
    limit: int = Query(10, ge=1, le=50),
    algorithm: str = Query("hybrid", regex="^(hybrid|collaborative|content|neural)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get ML-powered personalized recommendations.
    
    Algorithms:
    - hybrid: Combines multiple approaches (default)
    - collaborative: User-based collaborative filtering
    - content: Content-based filtering
    - neural: Neural network-based (future)
    """
    recommendations = await ml_engine.get_ml_recommendations(
        db=db,
        user_id=current_user.id,
        limit=limit,
        algorithm=algorithm
    )
    return recommendations


@router.get("/ml/explain/{listing_id}")
async def explain_recommendation(
    listing_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get explanation for why a listing was recommended.
    Provides transparency in recommendation decisions.
    """
    explanation = await ml_engine.get_recommendation_explanation(
        db=db,
        user_id=current_user.id,
        listing_id=listing_id
    )
    return explanation


@router.post("/ml/train")
async def train_recommendation_model(
    algorithm: str = Query("hybrid", regex="^(hybrid|collaborative|content|neural)$"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Train recommendation model (admin only).
    In production, this would be a scheduled task.
    """
    result = await ml_engine.train_model(db=db, algorithm=algorithm)
    return result

