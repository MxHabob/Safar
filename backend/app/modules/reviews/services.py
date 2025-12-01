"""
Review services, enhanced with additional features.
"""
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.reviews.models import Review, ReviewHelpful, ReviewResponse
from app.modules.reviews.schemas import ReviewCreate
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.listings.models import Listing


class ReviewService:
    """Service layer for managing reviews and related aggregates."""
    
    @staticmethod
    async def create_review(
        db: AsyncSession,
        review_data: ReviewCreate,
        guest_id: int
    ) -> Review:
        """Create a new review for a listing and optional booking."""
        # Check if listing exists
        result = await db.execute(
            select(Listing).where(Listing.id == review_data.listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Check if user already reviewed this listing
        existing = await db.execute(
            select(Review).where(
                Review.listing_id == review_data.listing_id,
                Review.guest_id == guest_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this listing"
            )
        
        # If booking_id provided, verify it belongs to the guest
        if review_data.booking_id:
            result = await db.execute(
                select(Booking).where(
                    Booking.id == review_data.booking_id,
                    Booking.guest_id == guest_id,
                    Booking.listing_id == review_data.listing_id
                )
            )
            booking = result.scalar_one_or_none()
            if not booking:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Booking not found or does not belong to you"
                )
        
        # Get host_id from listing
        host_id = listing.host_id or (listing.host_profile.user_id if listing.host_profile else None)
        
        if not host_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing has no host"
            )
        
        # Create review
        review = Review(
            listing_id=review_data.listing_id,
            booking_id=review_data.booking_id,
            guest_id=guest_id,
            host_id=host_id,
            overall_rating=review_data.overall_rating,
            cleanliness_rating=review_data.cleanliness_rating,
            communication_rating=review_data.communication_rating,
            check_in_rating=review_data.check_in_rating,
            accuracy_rating=review_data.accuracy_rating,
            location_rating=review_data.location_rating,
            value_rating=review_data.value_rating,
            title=review_data.title,
            comment=review_data.comment,
            visibility="public",
            moderation_status="pending"
        )
        
        db.add(review)
        await db.commit()
        await db.refresh(review)
        
        # Update listing rating
        await ReviewService.update_listing_rating(db, review_data.listing_id)
        
        return review
    
    @staticmethod
    async def update_listing_rating(
        db: AsyncSession,
        listing_id: int
    ) -> None:
        """Recalculate and update the aggregate rating and review count for a listing."""
        # Calculate average rating
        result = await db.execute(
            select(func.avg(Review.overall_rating), func.count(Review.id))
            .where(
                Review.listing_id == listing_id,
                Review.is_public == True,
                Review.moderation_status == "approved"
            )
        )
        avg_rating, count = result.first()
        
        # Update listing
        listing_result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = listing_result.scalar_one_or_none()
        
        if listing:
            listing.rating = avg_rating or 0
            listing.review_count = count or 0
            await db.commit()
    
    @staticmethod
    async def create_host_response(
        db: AsyncSession,
        review_id: int,
        host_profile_id: int,
        comment: str
    ) -> ReviewResponse:
        """Create a host response for a given review."""
        # Check if review exists
        result = await db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if response already exists
        existing_result = await db.execute(
            select(ReviewResponse).where(ReviewResponse.review_id == review_id)
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Response already exists"
            )
        
        # Create response
        response = ReviewResponse(
            review_id=review_id,
            host_profile_id=host_profile_id,
            comment=comment
        )
        
        db.add(response)
        await db.commit()
        await db.refresh(response)
        
        return response
    
    @staticmethod
    async def mark_helpful(
        db: AsyncSession,
        review_id: int,
        user_id: int,
        is_helpful: bool = True
    ) -> ReviewHelpful:
        """Mark or update whether a review is helpful for a given user."""
        # Check if review exists
        result = await db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user already voted
        result = await db.execute(
            select(ReviewHelpful).where(
                ReviewHelpful.review_id == review_id,
                ReviewHelpful.user_id == user_id
            )
        )
        helpful = result.scalar_one_or_none()
        
        if helpful:
            helpful.is_helpful = is_helpful
        else:
            helpful = ReviewHelpful(
                review_id=review_id,
                user_id=user_id,
                is_helpful=is_helpful
            )
            db.add(helpful)
        
        # Update helpful count
        result = await db.execute(
            select(func.count()).where(
                ReviewHelpful.review_id == review_id,
                ReviewHelpful.is_helpful == True
            )
        )
        review.helpful_count = result.scalar()
        
        await db.commit()
        await db.refresh(helpful)
        
        return helpful
