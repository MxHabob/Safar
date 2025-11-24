"""
Review Repository
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.modules.reviews.models import Review
from app.core.id import ID


class IReviewRepository:
    """Review repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[Review]:
        """Get review by ID"""
        pass
    
    async def get_by_listing(
        self,
        listing_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Review]:
        """Get reviews by listing"""
        pass
    
    async def get_by_guest(self, guest_id: ID) -> List[Review]:
        """Get reviews by guest"""
        pass
    
    async def create(self, review: Review) -> Review:
        """Create new review"""
        pass
    
    async def update(self, review: Review) -> Review:
        """Update review"""
        pass


class ReviewRepository(BaseRepository, IReviewRepository):
    """Review repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, Review, Review)
    
    async def get_by_listing(
        self,
        listing_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Review]:
        """Get reviews by listing"""
        query = select(Review).where(
            Review.listing_id == listing_id,
            Review.is_public == True,
            Review.moderation_status == "approved"
        ).options(
            selectinload(Review.guest),
            selectinload(Review.host)
        ).offset(skip).limit(limit).order_by(Review.created_at.desc())
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_by_guest(self, guest_id: ID) -> List[Review]:
        """Get reviews by guest"""
        query = select(Review).where(Review.guest_id == guest_id)
        result = await self.db.execute(query)
        return result.scalars().all()

