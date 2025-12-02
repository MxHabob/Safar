"""
Travel Guides and User Stories Routes.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.travel_guides.service import TravelGuideService
from app.modules.travel_guides.schemas import (
    TravelGuideCreate, TravelGuideResponse,
    UserStoryCreate, UserStoryResponse
)
from app.modules.travel_guides.models import TravelGuide, UserStory
from app.core.id import ID

router = APIRouter(prefix="/travel-guides", tags=["Travel Guides"])


@router.post("", response_model=TravelGuideResponse, status_code=status.HTTP_201_CREATED)
async def create_guide(
    guide_data: TravelGuideCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new travel guide."""
    guide = await TravelGuideService.create_guide(
        db=db,
        author_id=current_user.id,
        title=guide_data.title,
        content=guide_data.content,
        destination=guide_data.destination,
        country=guide_data.country,
        summary=guide_data.summary,
        city=guide_data.city,
        tags=guide_data.tags,
        categories=guide_data.categories,
        cover_image_url=guide_data.cover_image_url,
        image_urls=guide_data.image_urls,
        is_official=guide_data.is_official
    )
    return guide


@router.post("/{guide_id}/publish", response_model=TravelGuideResponse)
async def publish_guide(
    guide_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish a travel guide."""
    guide = await TravelGuideService.publish_guide(db, guide_id, current_user.id)
    return guide


@router.get("", response_model=List[TravelGuideResponse])
async def get_guides(
    destination: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    category: Optional[str] = Query(None),
    is_official: Optional[bool] = Query(None),
    status: str = Query("published"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("popular"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get travel guides with filters."""
    guides = await TravelGuideService.get_guides(
        db=db,
        destination=destination,
        country=country,
        city=city,
        tags=tags,
        category=category,
        is_official=is_official,
        status=status,
        skip=skip,
        limit=limit,
        sort_by=sort_by
    )
    return guides


@router.get("/{guide_id}", response_model=TravelGuideResponse)
async def get_guide(
    guide_id: ID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific travel guide."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(TravelGuide)
        .where(TravelGuide.id == guide_id)
        .options(selectinload(TravelGuide.author))
    )
    guide = result.scalar_one_or_none()
    
    if not guide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel guide not found"
        )
    
    # Increment view count
    await TravelGuideService.increment_view_count(db, guide_id=guide_id)
    
    return guide


@router.post("/{guide_id}/bookmark")
async def bookmark_guide(
    guide_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Bookmark a travel guide."""
    bookmark = await TravelGuideService.bookmark_guide(db, current_user.id, guide_id)
    return {"message": "Guide bookmarked", "bookmark_id": bookmark.id}


@router.post("/{guide_id}/like")
async def like_guide(
    guide_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Like a travel guide."""
    like = await TravelGuideService.like_guide(db, current_user.id, guide_id)
    return {"message": "Guide liked", "like_id": like.id}


# User Stories Routes

@router.post("/stories", response_model=UserStoryResponse, status_code=status.HTTP_201_CREATED)
async def create_story(
    story_data: UserStoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new user story."""
    story = await TravelGuideService.create_story(
        db=db,
        author_id=current_user.id,
        title=story_data.title,
        content=story_data.content,
        destination=story_data.destination,
        country=story_data.country,
        city=story_data.city,
        travel_date=story_data.travel_date,
        duration_days=story_data.duration_days,
        travel_style=story_data.travel_style,
        tags=story_data.tags,
        cover_image_url=story_data.cover_image_url,
        image_urls=story_data.image_urls,
        video_urls=story_data.video_urls,
        guide_id=story_data.guide_id
    )
    return story


@router.post("/stories/{story_id}/publish", response_model=UserStoryResponse)
async def publish_story(
    story_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish a user story."""
    story = await TravelGuideService.publish_story(db, story_id, current_user.id)
    return story


@router.get("/stories", response_model=List[UserStoryResponse])
async def get_stories(
    destination: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    guide_id: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    status: str = Query("published"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("recent"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get user stories with filters."""
    stories = await TravelGuideService.get_stories(
        db=db,
        destination=destination,
        country=country,
        author_id=author_id,
        guide_id=guide_id,
        is_featured=is_featured,
        status=status,
        skip=skip,
        limit=limit,
        sort_by=sort_by
    )
    return stories


@router.get("/stories/{story_id}", response_model=UserStoryResponse)
async def get_story(
    story_id: ID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific user story."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(UserStory)
        .where(UserStory.id == story_id)
        .options(
            selectinload(UserStory.author),
            selectinload(UserStory.guide)
        )
    )
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User story not found"
        )
    
    # Increment view count
    await TravelGuideService.increment_view_count(db, story_id=story_id)
    
    return story

