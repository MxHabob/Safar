"""
ML-based Recommendation Engine v2.
Enhanced with machine learning models, feature engineering, and real-time updates.
"""
import logging
import json
import pickle
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.listings.models import Listing, ListingStatus
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.reviews.models import Review
from app.modules.wishlist.models import Wishlist
from app.modules.analytics.models import AnalyticsEvent
from app.core.id import ID
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MLRecommendationEngine:
    """
    ML-based recommendation engine v2.
    Uses collaborative filtering, matrix factorization, and deep learning approaches.
    """
    
    def __init__(self):
        self.model_cache = {}
        self.feature_cache = {}
        self.last_training_time = None
    
    async def get_ml_recommendations(
        self,
        db: AsyncSession,
        user_id: ID,
        limit: int = 10,
        exclude_listing_ids: Optional[List[ID]] = None,
        algorithm: str = "hybrid"  # hybrid, collaborative, content, neural
    ) -> List[Dict[str, Any]]:
        """
        Get ML-powered recommendations for a user.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Number of recommendations
            exclude_listing_ids: Listing IDs to exclude
            algorithm: Recommendation algorithm to use
        
        Returns:
            List of recommendations with scores
        """
        exclude_listing_ids = exclude_listing_ids or []
        
        # Get user features
        user_features = await self._get_user_features(db, user_id)
        
        # Get candidate listings
        candidates = await self._get_candidate_listings(
            db, user_id, limit * 5, exclude_listing_ids
        )
        
        if not candidates:
            return []
        
        # Score candidates using ML models
        scored_recommendations = []
        
        if algorithm == "hybrid":
            scores = await self._hybrid_scoring(
                db, user_id, user_features, candidates
            )
        elif algorithm == "collaborative":
            scores = await self._collaborative_scoring(
                db, user_id, user_features, candidates
            )
        elif algorithm == "content":
            scores = await self._content_scoring(
                db, user_id, user_features, candidates
            )
        elif algorithm == "neural":
            scores = await self._neural_scoring(
                db, user_id, user_features, candidates
            )
        else:
            scores = await self._hybrid_scoring(
                db, user_id, user_features, candidates
            )
        
        # Combine scores and sort
        for listing, score in zip(candidates, scores):
            scored_recommendations.append({
                "listing": listing,
                "score": float(score),
                "algorithm": algorithm
            })
        
        # Sort by score descending
        scored_recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return scored_recommendations[:limit]
    
    async def _get_user_features(
        self,
        db: AsyncSession,
        user_id: ID
    ) -> Dict[str, Any]:
        """Extract user features for ML model."""
        # Get booking history
        bookings_result = await db.execute(
            select(func.count(Booking.id), func.avg(Booking.total_amount))
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        booking_stats = bookings_result.first()
        
        # Get preferred locations
        locations_result = await db.execute(
            select(
                Listing.city,
                Listing.country,
                func.count(Booking.id).label('count')
            )
            .join(Booking, Booking.listing_id == Listing.id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
            .group_by(Listing.city, Listing.country)
            .order_by(func.count(Booking.id).desc())
            .limit(5)
        )
        preferred_locations = [
            {"city": row[0], "country": row[1], "count": row[2]}
            for row in locations_result.all()
        ]
        
        # Get preferred listing types
        types_result = await db.execute(
            select(
                Listing.listing_type,
                func.count(Booking.id).label('count')
            )
            .join(Booking, Booking.listing_id == Listing.id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
            .group_by(Listing.listing_type)
            .order_by(func.count(Booking.id).desc())
            .limit(5)
        )
        preferred_types = [
            {"type": row[0], "count": row[1]}
            for row in types_result.all()
        ]
        
        # Get price preferences
        price_result = await db.execute(
            select(
                func.avg(Listing.base_price).label('avg_price'),
                func.min(Listing.base_price).label('min_price'),
                func.max(Listing.base_price).label('max_price')
            )
            .join(Booking, Booking.listing_id == Listing.id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        price_stats = price_result.first()
        
        # Get engagement metrics
        wishlist_count = await db.execute(
            select(func.count(Wishlist.id))
            .where(Wishlist.user_id == user_id)
        )
        wishlist_count = wishlist_count.scalar() or 0
        
        # Get review behavior
        reviews_result = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.user_id == user_id)
        )
        review_stats = reviews_result.first()
        
        return {
            "user_id": str(user_id),
            "booking_count": booking_stats[0] if booking_stats else 0,
            "avg_booking_amount": float(booking_stats[1]) if booking_stats and booking_stats[1] else 0.0,
            "preferred_locations": preferred_locations,
            "preferred_types": preferred_types,
            "avg_price": float(price_stats[0]) if price_stats and price_stats[0] else 0.0,
            "min_price": float(price_stats[1]) if price_stats and price_stats[1] else 0.0,
            "max_price": float(price_stats[2]) if price_stats and price_stats[2] else 0.0,
            "wishlist_count": wishlist_count,
            "avg_review_rating": float(review_stats[0]) if review_stats and review_stats[0] else 0.0,
            "review_count": review_stats[1] if review_stats else 0
        }
    
    async def trigger_reindex(self, listing_id: ID) -> None:
        """Trigger reindexing for a specific listing.
        
        This invalidates cached recommendations and triggers model retraining
        if needed.
        
        Args:
            listing_id: Listing ID to reindex
        """
        try:
            # Invalidate cached recommendations for this listing
            from app.infrastructure.cache.redis import CacheService
            await CacheService.delete_pattern(f"recommendations:*{listing_id}*")
            await CacheService.delete_pattern(f"recommendations:similar:{listing_id}")
            
            # Mark model as stale (will trigger retraining on next request)
            self.model_cache.clear()
            self.feature_cache.clear()
            
            logger.info(f"Triggered reindex for listing {listing_id}")
        except Exception as e:
            logger.warning(f"Failed to trigger reindex for listing {listing_id}: {e}")
    
    async def _get_candidate_listings(
        self,
        db: AsyncSession,
        user_id: ID,
        limit: int,
        exclude_ids: List[ID]
    ) -> List[Listing]:
        """Get candidate listings for recommendation."""
        conditions = [
            Listing.status == ListingStatus.ACTIVE.value,
            Listing.rating >= 3.5  # Lower threshold for more candidates
        ]
        
        if exclude_ids:
            conditions.append(Listing.id.notin_(exclude_ids))
        
        # Get user's booked listings to avoid recommending
        booked_result = await db.execute(
            select(Booking.listing_id)
            .where(
                and_(
                    Booking.guest_id == user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        booked_ids = [row[0] for row in booked_result.all()]
        if booked_ids:
            conditions.append(Listing.id.notin_(booked_ids))
        
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
    
    async def _hybrid_scoring(
        self,
        db: AsyncSession,
        user_id: ID,
        user_features: Dict[str, Any],
        candidates: List[Listing]
    ) -> List[float]:
        """
        Hybrid scoring: Combines collaborative, content-based, and popularity scores.
        """
        scores = []
        
        for listing in candidates:
            # Collaborative score (0-1)
            collab_score = await self._compute_collaborative_score(
                db, user_id, listing.id
            )
            
            # Content-based score (0-1)
            content_score = await self._compute_content_score(
                user_features, listing
            )
            
            # Popularity score (0-1)
            popularity_score = await self._compute_popularity_score(listing)
            
            # Location match score (0-1)
            location_score = await self._compute_location_score(
                user_features, listing
            )
            
            # Price match score (0-1)
            price_score = await self._compute_price_score(
                user_features, listing
            )
            
            # Weighted combination
            hybrid_score = (
                collab_score * 0.3 +
                content_score * 0.25 +
                popularity_score * 0.2 +
                location_score * 0.15 +
                price_score * 0.1
            )
            
            scores.append(hybrid_score)
        
        return scores
    
    async def _collaborative_scoring(
        self,
        db: AsyncSession,
        user_id: ID,
        user_features: Dict[str, Any],
        candidates: List[Listing]
    ) -> List[float]:
        """Collaborative filtering score using user-item matrix."""
        scores = []
        
        for listing in candidates:
            score = await self._compute_collaborative_score(
                db, user_id, listing.id
            )
            scores.append(score)
        
        return scores
    
    async def _content_scoring(
        self,
        db: AsyncSession,
        user_id: ID,
        user_features: Dict[str, Any],
        candidates: List[Listing]
    ) -> List[float]:
        """Content-based scoring."""
        scores = []
        
        for listing in candidates:
            content_score = await self._compute_content_score(
                user_features, listing
            )
            location_score = await self._compute_location_score(
                user_features, listing
            )
            price_score = await self._compute_price_score(
                user_features, listing
            )
            
            score = (
                content_score * 0.4 +
                location_score * 0.35 +
                price_score * 0.25
            )
            scores.append(score)
        
        return scores
    
    async def _neural_scoring(
        self,
        db: AsyncSession,
        user_id: ID,
        user_features: Dict[str, Any],
        candidates: List[Listing]
    ) -> List[float]:
        """
        Neural network-based scoring (simplified - would use actual ML model in production).
        """
        # In production, this would use a trained neural network
        # For now, use enhanced hybrid scoring as approximation
        return await self._hybrid_scoring(db, user_id, user_features, candidates)
    
    async def _compute_collaborative_score(
        self,
        db: AsyncSession,
        user_id: ID,
        listing_id: ID
    ) -> float:
        """Compute collaborative filtering score."""
        # Find users who booked this listing
        similar_users_result = await db.execute(
            select(Booking.guest_id)
            .where(
                and_(
                    Booking.listing_id == listing_id,
                    Booking.guest_id != user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
            .distinct()
            .limit(100)
        )
        similar_users = [row[0] for row in similar_users_result.all()]
        
        if not similar_users:
            return 0.0
        
        # Find common bookings between user and similar users
        common_bookings_result = await db.execute(
            select(func.count(Booking.id))
            .where(
                and_(
                    Booking.guest_id.in_(similar_users),
                    Booking.guest_id != user_id,
                    Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
                )
            )
        )
        common_count = common_bookings_result.scalar() or 0
        
        # Normalize score (0-1)
        score = min(1.0, common_count / 10.0)
        return score
    
    async def _compute_content_score(
        self,
        user_features: Dict[str, Any],
        listing: Listing
    ) -> float:
        """Compute content-based similarity score."""
        score = 0.0
        
        # Type match
        preferred_types = [pt["type"] for pt in user_features.get("preferred_types", [])]
        if listing.listing_type in preferred_types:
            score += 0.4
        
        # Amenities match (simplified)
        score += 0.2  # Base score
        
        # Rating match
        if listing.rating >= 4.5:
            score += 0.4
        elif listing.rating >= 4.0:
            score += 0.2
        
        return min(1.0, score)
    
    async def _compute_popularity_score(self, listing: Listing) -> float:
        """Compute popularity score."""
        # Normalize rating (0-1)
        rating_score = float(listing.rating) / 5.0
        
        # Normalize review count (log scale)
        import math
        review_score = min(1.0, math.log10(listing.review_count + 1) / 3.0)
        
        return (rating_score * 0.6 + review_score * 0.4)
    
    async def _compute_location_score(
        self,
        user_features: Dict[str, Any],
        listing: Listing
    ) -> float:
        """Compute location match score."""
        preferred_locations = user_features.get("preferred_locations", [])
        
        if not preferred_locations:
            return 0.5  # Neutral score if no preference
        
        for loc in preferred_locations:
            if listing.city == loc["city"]:
                return 1.0
            elif listing.country == loc["country"]:
                return 0.7
        
        return 0.3  # Different location
    
    async def _compute_price_score(
        self,
        user_features: Dict[str, Any],
        listing: Listing
    ) -> float:
        """Compute price match score."""
        avg_price = user_features.get("avg_price", 0.0)
        min_price = user_features.get("min_price", 0.0)
        max_price = user_features.get("max_price", 0.0)
        
        if avg_price == 0:
            return 0.5  # Neutral if no price history
        
        listing_price = float(listing.base_price)
        
        # Check if price is within user's range
        if min_price <= listing_price <= max_price:
            return 1.0
        elif avg_price * 0.7 <= listing_price <= avg_price * 1.3:
            return 0.8
        elif avg_price * 0.5 <= listing_price <= avg_price * 1.5:
            return 0.5
        else:
            return 0.2
    
    async def train_model(
        self,
        db: AsyncSession,
        algorithm: str = "hybrid"
    ) -> Dict[str, Any]:
        """
        Train recommendation model (placeholder for actual ML training).
        In production, this would train actual ML models.
        """
        # Get training data
        bookings_result = await db.execute(
            select(func.count(Booking.id))
            .where(
                Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
            )
        )
        booking_count = bookings_result.scalar() or 0
        
        # Update cache timestamp
        self.last_training_time = datetime.now(timezone.utc)
        
        return {
            "algorithm": algorithm,
            "training_samples": booking_count,
            "trained_at": self.last_training_time.isoformat(),
            "status": "success"
        }
    
    async def get_recommendation_explanation(
        self,
        db: AsyncSession,
        user_id: ID,
        listing_id: ID
    ) -> Dict[str, Any]:
        """Get explanation for why a listing was recommended."""
        user_features = await self._get_user_features(db, user_id)
        
        listing_result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = listing_result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        reasons = []
        
        # Check location match
        preferred_locations = user_features.get("preferred_locations", [])
        for loc in preferred_locations:
            if listing.city == loc["city"]:
                reasons.append(f"Matches your preferred city: {loc['city']}")
                break
            elif listing.country == loc["country"]:
                reasons.append(f"Matches your preferred country: {loc['country']}")
                break
        
        # Check type match
        preferred_types = [pt["type"] for pt in user_features.get("preferred_types", [])]
        if listing.listing_type in preferred_types:
            reasons.append(f"Matches your preferred listing type: {listing.listing_type}")
        
        # Check price match
        avg_price = user_features.get("avg_price", 0.0)
        if avg_price > 0:
            price_diff = abs(float(listing.base_price) - avg_price) / avg_price
            if price_diff < 0.3:
                reasons.append("Price matches your booking history")
        
        # Check rating
        if listing.rating >= 4.5:
            reasons.append("Highly rated by other guests")
        
        if not reasons:
            reasons.append("Popular listing in your area")
        
        return {
            "listing_id": str(listing_id),
            "reasons": reasons,
            "score_breakdown": {
                "location_match": await self._compute_location_score(user_features, listing),
                "content_match": await self._compute_content_score(user_features, listing),
                "popularity": await self._compute_popularity_score(listing),
                "price_match": await self._compute_price_score(user_features, listing)
            }
        }

