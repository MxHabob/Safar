"""
Recommendation engine service.
Provides personalized listing recommendations using collaborative filtering,
content-based filtering, and hybrid approaches.
"""
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.listings.models import Listing, ListingStatus
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.reviews.models import Review
from app.modules.wishlist.models import Wishlist
from app.core.id import ID


class RecommendationService:
    """Service for generating personalized listing recommendations."""
    
    @staticmethod
    async def get_recommendations_for_user(
        db: AsyncSession,
        user_id: ID,
        limit: int = 10,
        exclude_listing_ids: Optional[List[ID]] = None
    ) -> List[Listing]:
        """
        Get personalized recommendations for a user.
        Uses hybrid approach: collaborative filtering + content-based + popularity.
        
        Args:
            user_id: User ID
            limit: Number of recommendations to return
            exclude_listing_ids: Listing IDs to exclude from results
        
        Returns:
            List of recommended listings
        """
        # Validate inputs
        if limit <= 0 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 100"
            )
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        recommendations = []
        exclude_listing_ids = exclude_listing_ids or []
        
        # 1. Collaborative filtering: Find listings similar users booked
        collaborative = await RecommendationService._collaborative_filtering(
            db, user_id, limit=limit // 3, exclude_ids=exclude_listing_ids
        )
        recommendations.extend(collaborative)
        exclude_listing_ids.extend([l.id for l in collaborative])
        
        # 2. Content-based: Based on user's booking history
        content_based = await RecommendationService._content_based_filtering(
            db, user_id, limit=limit // 3, exclude_ids=exclude_listing_ids
        )
        recommendations.extend(content_based)
        exclude_listing_ids.extend([l.id for l in content_based])
        
        # 3. Popular listings: High-rated and frequently booked
        popular = await RecommendationService._popular_listings(
            db, limit=limit - len(recommendations), exclude_ids=exclude_listing_ids
        )
        recommendations.extend(popular)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for listing in recommendations:
            if listing.id not in seen:
                seen.add(listing.id)
                unique_recommendations.append(listing)
        
        return unique_recommendations[:limit]
    
    @staticmethod
    async def _collaborative_filtering(
        db: AsyncSession,
        user_id: ID,
        limit: int = 5,
        exclude_ids: Optional[List[ID]] = None
    ) -> List[Listing]:
        """
        Collaborative filtering: Find listings that users with similar preferences booked.
        """
        exclude_ids = exclude_ids or []
        
        # Get user's booking history
        user_bookings_result = await db.execute(
            select(Booking.listing_id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        user_booked_listings = [row[0] for row in user_bookings_result.all()]
        
        if not user_booked_listings:
            return []
        
        # Find users who booked similar listings
        similar_users_result = await db.execute(
            select(Booking.guest_id, func.count(Booking.id).label('common_bookings'))
            .where(
                and_(
                    Booking.listing_id.in_(user_booked_listings),
                    Booking.guest_id != user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
            .group_by(Booking.guest_id)
            .having(func.count(Booking.id) > 0)
            .order_by(func.count(Booking.id).desc())
            .limit(10)
        )
        similar_users = [row[0] for row in similar_users_result.all()]
        
        if not similar_users:
            return []
        
        # Get listings booked by similar users that current user hasn't booked
        conditions = [
            Booking.guest_id.in_(similar_users),
            Booking.listing_id.notin_(user_booked_listings),
            Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
        ]
        if exclude_ids:
            conditions.append(Booking.listing_id.notin_(exclude_ids))
        
        recommendations_result = await db.execute(
            select(Booking.listing_id, func.count(Booking.id).label('booking_count'))
            .where(and_(*conditions))
            .group_by(Booking.listing_id)
            .order_by(func.count(Booking.id).desc())
            .limit(limit * 2)  # Get more to filter by quality
        )
        candidate_listing_ids = [row[0] for row in recommendations_result.all()]
        
        if not candidate_listing_ids:
            return []
        
        # Get listings with quality filters (active, good ratings)
        query = select(Listing).where(
            and_(
                Listing.id.in_(candidate_listing_ids),
                Listing.status == ListingStatus.ACTIVE.value,
                Listing.rating >= 4.0  # Only recommend highly-rated listings
            )
        ).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.amenities)
        ).order_by(
            Listing.rating.desc(),
            Listing.review_count.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def _content_based_filtering(
        db: AsyncSession,
        user_id: ID,
        limit: int = 5,
        exclude_ids: Optional[List[ID]] = None
    ) -> List[Listing]:
        """
        Content-based filtering: Based on user's past booking preferences.
        """
        exclude_ids = exclude_ids or []
        
        # Get user's booking history with listing details
        user_bookings_result = await db.execute(
            select(Booking.listing_id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        user_booked_listing_ids = [row[0] for row in user_bookings_result.all()]
        
        if not user_booked_listing_ids:
            return []
        
        # Get user's preferred listing characteristics
        preferences_result = await db.execute(
            select(
                func.avg(Listing.base_price).label('avg_price'),
                func.mode().within_group(Listing.city).label('preferred_city'),
                func.mode().within_group(Listing.country).label('preferred_country'),
                func.mode().within_group(Listing.listing_type).label('preferred_type')
            )
            .where(Listing.id.in_(user_booked_listing_ids))
        )
        prefs = preferences_result.first()
        
        if not prefs:
            return []
        
        # Find similar listings
        conditions = [
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.id.notin_(user_booked_listing_ids),
            Listing.rating >= 4.0
        ]
        
        if exclude_ids:
            conditions.append(Listing.id.notin_(exclude_ids))
        
        # Match preferred location
        if prefs.preferred_city:
            conditions.append(Listing.city == prefs.preferred_city)
        elif prefs.preferred_country:
            conditions.append(Listing.country == prefs.preferred_country)
        
        # Match preferred type
        if prefs.preferred_type:
            conditions.append(Listing.listing_type == prefs.preferred_type)
        
        # Price range: ±30% of average
        if prefs.avg_price:
            price_min = prefs.avg_price * Decimal("0.7")
            price_max = prefs.avg_price * Decimal("1.3")
            conditions.append(Listing.base_price.between(price_min, price_max))
        
        query = select(Listing).where(and_(*conditions)).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.amenities)
        ).order_by(
            Listing.rating.desc(),
            Listing.review_count.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def _popular_listings(
        db: AsyncSession,
        limit: int = 5,
        exclude_ids: Optional[List[ID]] = None
    ) -> List[Listing]:
        """
        Get popular listings based on ratings and booking frequency.
        """
        exclude_ids = exclude_ids or []
        
        conditions = [
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.rating >= 4.0,
            Listing.review_count >= 5  # Minimum reviews for quality
        ]
        
        if exclude_ids:
            conditions.append(Listing.id.notin_(exclude_ids))
        
        # Calculate popularity score: rating * log(review_count) * booking_count
        # Get booking counts
        booking_counts = select(
            Booking.listing_id,
            func.count(Booking.id).label('booking_count')
        ).where(
            Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
        ).group_by(Booking.listing_id).subquery()
        
        query = select(Listing).outerjoin(
            booking_counts, Listing.id == booking_counts.c.listing_id
        ).where(and_(*conditions)).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.amenities)
        ).order_by(
            (Listing.rating * func.coalesce(func.log(booking_counts.c.booking_count + 1), 0)).desc(),
            Listing.review_count.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_similar_listings(
        db: AsyncSession,
        listing_id: ID,
        limit: int = 5
    ) -> List[Listing]:
        """
        Get listings similar to a given listing.
        Based on location, type, price range, and amenities.
        """
        # Validate inputs
        if limit <= 0 or limit > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 50"
            )
        
        if not listing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing ID is required"
            )
        
        # Get reference listing
        listing_result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = listing_result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Find similar listings
        conditions = [
            Listing.id != listing_id,
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.rating >= 4.0
        ]
        
        # Same city or country
        if listing.city:
            conditions.append(
                or_(
                    Listing.city == listing.city,
                    Listing.country == listing.country
                )
            )
        
        # Same listing type
        if listing.listing_type:
            conditions.append(Listing.listing_type == listing.listing_type)
        
        # Similar price range (±40%)
        price_min = listing.base_price * Decimal("0.6")
        price_max = listing.base_price * Decimal("1.4")
        conditions.append(Listing.base_price.between(price_min, price_max))
        
        query = select(Listing).where(and_(*conditions)).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.amenities)
        ).order_by(
            Listing.rating.desc(),
            Listing.review_count.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_trending_listings(
        db: AsyncSession,
        limit: int = 10,
        days: int = 30
    ) -> List[Listing]:
        """
        Get trending listings based on recent bookings and views.
        """
        # Validate inputs
        if limit <= 0 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 100"
            )
        
        if days <= 0 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        from datetime import datetime, timedelta, timezone
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get recently booked listings
        trending_result = await db.execute(
            select(
                Booking.listing_id,
                func.count(Booking.id).label('recent_bookings')
            )
            .where(
                and_(
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value]),
                    Booking.created_at >= cutoff_date
                )
            )
            .group_by(Booking.listing_id)
            .order_by(func.count(Booking.id).desc())
            .limit(limit * 2)
        )
        trending_listing_ids = [row[0] for row in trending_result.all()]
        
        if not trending_listing_ids:
            return []
        
        # Get listings with details
        query = select(Listing).where(
            and_(
                Listing.id.in_(trending_listing_ids),
                Listing.status == ListingStatus.ACTIVE.value
            )
        ).options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.amenities)
        ).order_by(Listing.rating.desc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

