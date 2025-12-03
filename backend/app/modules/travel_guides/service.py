"""
Travel Guides and User Stories Service.
"""
import logging
import re
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, case, String
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import ARRAY
from fastapi import HTTPException, status

from app.modules.travel_guides.models import (
    TravelGuide, UserStory, TravelGuideBookmark, TravelGuideLike,
    UserStoryLike, UserStoryComment
)
from app.core.id import ID

logger = logging.getLogger(__name__)


class TravelGuideService:
    """Service for managing travel guides and user stories."""
    
    @staticmethod
    def generate_slug(title: str) -> str:
        """Generate URL-friendly slug from title."""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = re.sub(r'^-+|-+$', '', slug)
        return slug[:500]  # Limit length
    
    @staticmethod
    def estimate_reading_time(content: str) -> int:
        """Estimate reading time in minutes (average 200 words per minute)."""
        word_count = len(content.split())
        return max(1, round(word_count / 200))
    
    @staticmethod
    async def create_guide(
        db: AsyncSession,
        author_id: ID,
        title: str,
        content: str,
        destination: str,
        country: str,
        summary: Optional[str] = None,
        city: Optional[str] = None,
        tags: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        cover_image_url: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        is_official: bool = False
    ) -> TravelGuide:
        """Create a new travel guide."""
        # Generate slug
        slug = TravelGuideService.generate_slug(title)
        
        # Ensure unique slug
        counter = 1
        base_slug = slug
        while True:
            result = await db.execute(
                select(TravelGuide).where(TravelGuide.slug == slug)
            )
            if result.scalar_one_or_none() is None:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Estimate reading time
        reading_time = TravelGuideService.estimate_reading_time(content)
        
        guide = TravelGuide(
            title=title,
            slug=slug,
            summary=summary or content[:500] if content else None,
            content=content,
            author_id=author_id,
            is_official=is_official,
            destination=destination,
            city=city,
            country=country,
            cover_image_url=cover_image_url,
            image_urls=image_urls or [],
            tags=tags or [],
            categories=categories or [],
            reading_time_minutes=reading_time,
            status="draft"
        )
        
        db.add(guide)
        await db.commit()
        await db.refresh(guide)
        
        logger.info(f"Created travel guide: {guide.id} by {author_id}")
        return guide
    
    @staticmethod
    async def publish_guide(
        db: AsyncSession,
        guide_id: ID,
        author_id: ID
    ) -> TravelGuide:
        """Publish a travel guide."""
        result = await db.execute(
            select(TravelGuide).where(TravelGuide.id == guide_id)
        )
        guide = result.scalar_one_or_none()
        
        if not guide:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Travel guide not found"
            )
        
        if guide.author_id != author_id and not guide.is_official:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this guide"
            )
        
        guide.status = "published"
        guide.published_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(guide)
        
        return guide
    
    @staticmethod
    async def get_guides(
        db: AsyncSession,
        destination: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        author_id: Optional[ID] = None,
        is_official: Optional[bool] = None,
        status: str = "published",
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "popular"  # popular, recent, rating
    ) -> List[TravelGuide]:
        """Get travel guides with filters."""
        conditions = [TravelGuide.status == status]
        
        if destination:
            conditions.append(TravelGuide.destination.ilike(f"%{destination}%"))
        if country:
            conditions.append(TravelGuide.country.ilike(f"%{country}%"))
        if city:
            conditions.append(TravelGuide.city.ilike(f"%{city}%"))
        if tags:
            # For PostgreSQL ARRAY, check if any of the tags exist in the array
            # Using array overlap operator (&&) to check if arrays have any common elements
            if isinstance(tags, list):
                # Use array overlap operator && to check if arrays have any common elements
                tags_array = func.cast(tags, ARRAY(String))
                conditions.append(TravelGuide.tags.op('&&')(tags_array))
            else:
                # If tags is a single value, check if it exists in the array using @> operator
                single_tag_array = func.cast([tags], ARRAY(String))
                conditions.append(TravelGuide.tags.op('@>')(single_tag_array))
        if category:
            # For PostgreSQL ARRAY, use @> operator to check if category exists in array
            category_array = func.cast([category], ARRAY(String))
            conditions.append(TravelGuide.categories.op('@>')(category_array))
        if author_id:
            conditions.append(TravelGuide.author_id == author_id)
        if is_official is not None:
            conditions.append(TravelGuide.is_official == is_official)
        
        query = select(TravelGuide).where(and_(*conditions)).options(
            selectinload(TravelGuide.author)
        )
        
        # Sorting
        if sort_by == "recent":
            query = query.order_by(desc(TravelGuide.published_at))
        elif sort_by == "popular":
            query = query.order_by(
                desc(TravelGuide.view_count),
                desc(TravelGuide.like_count)
            )
        else:
            query = query.order_by(desc(TravelGuide.created_at))
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def create_story(
        db: AsyncSession,
        author_id: ID,
        title: str,
        content: str,
        destination: str,
        country: str,
        city: Optional[str] = None,
        travel_date: Optional[datetime] = None,
        duration_days: Optional[int] = None,
        travel_style: Optional[str] = None,
        tags: Optional[List[str]] = None,
        cover_image_url: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        video_urls: Optional[List[str]] = None,
        guide_id: Optional[ID] = None
    ) -> UserStory:
        """Create a new user story."""
        story = UserStory(
            author_id=author_id,
            title=title,
            content=content,
            summary=content[:500] if content else None,
            destination=destination,
            city=city,
            country=country,
            travel_date=travel_date,
            duration_days=duration_days,
            travel_style=travel_style,
            tags=tags or [],
            cover_image_url=cover_image_url,
            image_urls=image_urls or [],
            video_urls=video_urls or [],
            guide_id=guide_id,
            status="draft"
        )
        
        db.add(story)
        await db.commit()
        await db.refresh(story)
        
        logger.info(f"Created user story: {story.id} by {author_id}")
        return story
    
    @staticmethod
    async def publish_story(
        db: AsyncSession,
        story_id: ID,
        author_id: ID
    ) -> UserStory:
        """Publish a user story."""
        result = await db.execute(
            select(UserStory).where(UserStory.id == story_id)
        )
        story = result.scalar_one_or_none()
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User story not found"
            )
        
        if story.author_id != author_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this story"
            )
        
        story.status = "published"
        story.published_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(story)
        
        return story
    
    @staticmethod
    async def get_stories(
        db: AsyncSession,
        destination: Optional[str] = None,
        country: Optional[str] = None,
        author_id: Optional[ID] = None,
        guide_id: Optional[ID] = None,
        is_featured: Optional[bool] = None,
        status: str = "published",
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "recent"
    ) -> List[UserStory]:
        """Get user stories with filters."""
        conditions = [UserStory.status == status]
        
        if destination:
            conditions.append(UserStory.destination.ilike(f"%{destination}%"))
        if country:
            conditions.append(UserStory.country.ilike(f"%{country}%"))
        if author_id:
            conditions.append(UserStory.author_id == author_id)
        if guide_id:
            conditions.append(UserStory.guide_id == guide_id)
        if is_featured is not None:
            conditions.append(UserStory.is_featured == is_featured)
        
        query = select(UserStory).where(and_(*conditions)).options(
            selectinload(UserStory.author),
            selectinload(UserStory.guide)
        )
        
        # Sorting
        if sort_by == "popular":
            query = query.order_by(
                desc(UserStory.view_count),
                desc(UserStory.like_count)
            )
        else:
            query = query.order_by(desc(UserStory.published_at))
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def bookmark_guide(
        db: AsyncSession,
        user_id: ID,
        guide_id: ID
    ) -> TravelGuideBookmark:
        """Bookmark a travel guide."""
        # Check if already bookmarked
        result = await db.execute(
            select(TravelGuideBookmark).where(
                and_(
                    TravelGuideBookmark.user_id == user_id,
                    TravelGuideBookmark.guide_id == guide_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return existing
        
        bookmark = TravelGuideBookmark(
            user_id=user_id,
            guide_id=guide_id
        )
        
        db.add(bookmark)
        
        # Update bookmark count
        guide_result = await db.execute(
            select(TravelGuide).where(TravelGuide.id == guide_id)
        )
        guide = guide_result.scalar_one_or_none()
        if guide:
            guide.bookmark_count += 1
        
        await db.commit()
        await db.refresh(bookmark)
        
        return bookmark
    
    @staticmethod
    async def like_guide(
        db: AsyncSession,
        user_id: ID,
        guide_id: ID
    ) -> TravelGuideLike:
        """Like a travel guide."""
        # Check if already liked
        result = await db.execute(
            select(TravelGuideLike).where(
                and_(
                    TravelGuideLike.user_id == user_id,
                    TravelGuideLike.guide_id == guide_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return existing
        
        like = TravelGuideLike(
            user_id=user_id,
            guide_id=guide_id
        )
        
        db.add(like)
        
        # Update like count
        guide_result = await db.execute(
            select(TravelGuide).where(TravelGuide.id == guide_id)
        )
        guide = guide_result.scalar_one_or_none()
        if guide:
            guide.like_count += 1
        
        await db.commit()
        await db.refresh(like)
        
        return like
    
    @staticmethod
    async def increment_view_count(
        db: AsyncSession,
        guide_id: Optional[ID] = None,
        story_id: Optional[ID] = None,
        commit: bool = False
    ) -> None:
        """Increment view count for a guide or story.
        
        Args:
            db: Database session
            guide_id: Guide ID to increment view count for
            story_id: Story ID to increment view count for
            commit: Whether to commit the transaction (default: False, let caller handle commit)
        """
        if guide_id:
            result = await db.execute(
                select(TravelGuide).where(TravelGuide.id == guide_id)
            )
            guide = result.scalar_one_or_none()
            if guide:
                guide.view_count += 1
                if commit:
                    await db.commit()
        
        if story_id:
            result = await db.execute(
                select(UserStory).where(UserStory.id == story_id)
            )
            story = result.scalar_one_or_none()
            if story:
                story.view_count += 1
                if commit:
                    await db.commit()

