"""
مسارات التقييمات - Review Routes
Enhanced with new features
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_host
from app.modules.users.models import User
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import (
    ReviewCreate, ReviewResponse, ReviewListResponse,
    ReviewHelpfulRequest, ReviewResponseCreate, ReviewResponseResponse
)
from app.modules.reviews.services import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    إنشاء تقييم جديد
    Create new review
    """
    review = await ReviewService.create_review(db, review_data, current_user.id)
    
    await db.refresh(review, ["listing", "guest", "host", "response"])
    return review


@router.get("/listings/{listing_id}", response_model=ReviewListResponse)
async def get_listing_reviews(
    listing_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    الحصول على تقييمات قائمة
    Get listing reviews
    """
    query = select(Review).where(
        Review.listing_id == listing_id,
        Review.is_public == True,
        Review.visibility == "public",
        Review.moderation_status == "approved"
    )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.options(
        selectinload(Review.guest),
        selectinload(Review.listing),
        selectinload(Review.response)
    ).offset(skip).limit(limit).order_by(Review.created_at.desc())
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    return {
        "items": reviews,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    الحصول على تفاصيل تقييم
    Get review details
    """
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(
            selectinload(Review.guest),
            selectinload(Review.host),
            selectinload(Review.listing),
            selectinload(Review.response)
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return review


@router.post("/{review_id}/response", response_model=ReviewResponseResponse, status_code=status.HTTP_201_CREATED)
async def create_review_response(
    review_id: int,
    response_data: ReviewResponseCreate,
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    إنشاء رد المضيف على التقييم
    Create host response to review
    """
    # Get host profile
    from app.modules.users.models import HostProfile
    host_profile_result = await db.execute(
        select(HostProfile).where(HostProfile.user_id == current_user.id)
    )
    host_profile = host_profile_result.scalar_one_or_none()
    
    if not host_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host profile not found"
        )
    
    response = await ReviewService.create_host_response(
        db, review_id, host_profile.id, response_data.comment
    )
    
    return response


@router.post("/{review_id}/helpful", response_model=dict)
async def mark_review_helpful(
    review_id: int,
    helpful_data: ReviewHelpfulRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    تقييم المراجعة كمفيدة
    Mark review as helpful
    """
    await ReviewService.mark_helpful(db, review_id, current_user.id, helpful_data.is_helpful)
    
    return {"message": "Review marked as helpful"}
