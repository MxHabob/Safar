"""
Search services for listings.
Enhanced with PostgreSQL full-text search and PostGIS geographic search.
"""
from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_, and_, text, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import TSVECTOR

from app.modules.listings.models import Listing, ListingStatus, ListingType
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.wishlist.models import Wishlist
from app.core.config import get_settings

settings = get_settings()


class SearchService:
    """Search service for listings."""
    
    @staticmethod
    async def search_listings(
        db: AsyncSession,
        query: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_guests: Optional[int] = None,
        min_bedrooms: Optional[int] = None,
        min_bathrooms: Optional[int] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: Optional[str] = "relevance",  # relevance, price_asc, price_desc, rating, newest
        user_id: Optional[str] = None,  # For personalization
        enable_personalization: bool = True,  # Enable personalization boost
        enable_popularity_boost: bool = True,  # Enable popularity boost
        enable_location_boost: bool = True,  # Enable location boost
        ab_test_variant: Optional[str] = None  # A/B testing variant
    ) -> Tuple[List[Listing], int]:
        """
        Search listings with enhanced full-text search and PostGIS geographic search.
        
        Uses PostgreSQL full-text search for better relevance ranking and PostGIS
        for accurate geographic distance calculations.
        """
        # Base query
        search_query = select(Listing).where(Listing.status == ListingStatus.ACTIVE.value)
        
        # Enhanced text search with PostgreSQL full-text search
        if query:
            # Create search vector from query using concatenation
            search_vector = func.to_tsvector('english', 
                func.concat_ws(' ',
                    func.coalesce(Listing.title, ''),
                    func.coalesce(Listing.description, ''),
                    func.coalesce(Listing.city, ''),
                    func.coalesce(Listing.country, '')
                )
            )
            query_vector = func.plainto_tsquery('english', query)
            
            # Calculate relevance score
            relevance_score = func.ts_rank(search_vector, query_vector)
            
            # Add full-text search condition using @@ operator
            search_query = search_query.where(
                search_vector.op('@@')(query_vector)
            ).add_columns(relevance_score.label('relevance'))
        else:
            # No text query, add constant relevance
            search_query = search_query.add_columns(func.literal(0.0).label('relevance'))
        
        # Calculate popularity score (bookings + reviews)
        if enable_popularity_boost:
            # Get booking counts for popularity
            booking_counts = select(
                Booking.listing_id,
                func.count(Booking.id).label('booking_count')
            ).where(
                Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
            ).group_by(Booking.listing_id).subquery()
            
            # Popularity score: rating * log(review_count + 1) * log(booking_count + 1)
            popularity_score = (
                func.coalesce(Listing.rating, 0) * 
                func.coalesce(func.log(Listing.review_count + 1), 0) * 
                func.coalesce(func.log(booking_counts.c.booking_count + 1), 0)
            )
            search_query = search_query.outerjoin(
                booking_counts, Listing.id == booking_counts.c.listing_id
            ).add_columns(popularity_score.label('popularity'))
        else:
            search_query = search_query.add_columns(func.literal(0.0).label('popularity'))
        
        # Calculate personalization score (if user_id provided)
        if enable_personalization and user_id:
            # Get user's previous bookings to boost similar listings
            user_bookings = select(Booking.listing_id).where(
                Booking.guest_id == user_id,
                Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value])
            ).subquery()
            
            # Get user's wishlist
            user_wishlist = select(Wishlist.listing_id).where(
                Wishlist.user_id == user_id
            ).subquery()
            
            # Personalization boost: listings in user's preferred types/cities
            personalization_score = case(
                (Listing.id.in_(select(user_wishlist.c.listing_id)), 2.0),  # High boost for wishlist
                (Listing.id.in_(select(user_bookings.c.listing_id)), 1.5),  # Medium boost for previously booked
                (Listing.listing_type.in_(
                    select(Listing.listing_type).where(Listing.id.in_(select(user_bookings.c.listing_id)))
                ), 1.2),  # Boost for preferred listing types
                (Listing.city.in_(
                    select(Listing.city).where(Listing.id.in_(select(user_bookings.c.listing_id)))
                ), 1.1),  # Boost for preferred cities
                else_=1.0
            )
            search_query = search_query.add_columns(personalization_score.label('personalization'))
        else:
            search_query = search_query.add_columns(func.literal(1.0).label('personalization'))
        
        # Calculate location boost (if location provided)
        if enable_location_boost and latitude and longitude:
            # Boost listings closer to search location
            # Normalize distance to 0-1 scale (closer = higher boost)
            max_distance = radius_km if radius_km else 50.0  # Default 50km
            location_boost = case(
                (text('distance') <= max_distance * 0.1, 1.5),  # Very close: 50% boost
                (text('distance') <= max_distance * 0.3, 1.3),  # Close: 30% boost
                (text('distance') <= max_distance * 0.5, 1.1),  # Medium: 10% boost
                else_=1.0
            )
            search_query = search_query.add_columns(location_boost.label('location_boost'))
        else:
            search_query = search_query.add_columns(func.literal(1.0).label('location_boost'))
        
        # A/B Testing: Apply different ranking algorithms based on variant
        if ab_test_variant == "variant_b":
            # Variant B: More weight on popularity
            final_score = (
                func.coalesce(text('relevance'), 0) * 0.3 +
                func.coalesce(text('popularity'), 0) * 0.5 +
                func.coalesce(text('personalization'), 1.0) * 0.2
            ) * func.coalesce(text('location_boost'), 1.0)
        elif ab_test_variant == "variant_c":
            # Variant C: More weight on personalization
            final_score = (
                func.coalesce(text('relevance'), 0) * 0.3 +
                func.coalesce(text('popularity'), 0) * 0.2 +
                func.coalesce(text('personalization'), 1.0) * 0.5
            ) * func.coalesce(text('location_boost'), 1.0)
        else:
            # Default (variant A): Balanced approach
            final_score = (
                func.coalesce(text('relevance'), 0) * 0.4 +
                func.coalesce(text('popularity'), 0) * 0.3 +
                func.coalesce(text('personalization'), 1.0) * 0.3
            ) * func.coalesce(text('location_boost'), 1.0)
        
        search_query = search_query.add_columns(final_score.label('final_score'))
        
        # Location filters
        if city:
            search_query = search_query.where(Listing.city.ilike(f"%{city}%"))
        if country:
            search_query = search_query.where(Listing.country == country)
        
        # Listing type filter
        if listing_type:
            search_query = search_query.where(Listing.listing_type == listing_type.value)
        
        # Price filters
        if min_price:
            search_query = search_query.where(Listing.base_price >= min_price)
        if max_price:
            search_query = search_query.where(Listing.base_price <= max_price)
        
        # Guest capacity filter
        if min_guests:
            search_query = search_query.where(Listing.max_guests >= min_guests)
        
        # Bedrooms filter
        if min_bedrooms:
            search_query = search_query.where(Listing.bedrooms >= min_bedrooms)
        
        # Bathrooms filter
        if min_bathrooms:
            search_query = search_query.where(Listing.bathrooms >= min_bathrooms)
        
        # Enhanced geographic search with PostGIS
        if latitude and longitude and radius_km:
            # Use PostGIS ST_DWithin for accurate distance calculation
            # Convert radius from km to degrees (approximate: 1 degree ≈ 111 km)
            radius_degrees = radius_km / 111.0
            
            # PostGIS distance calculation
            # Note: This assumes PostGIS is installed and location is stored as POINT
            # If using separate lat/lng columns, convert to POINT first
            search_query = search_query.where(
                func.ST_DWithin(
                    func.ST_MakePoint(Listing.longitude, Listing.latitude),
                    func.ST_MakePoint(longitude, latitude),
                    radius_degrees
                )
            )
            
            # Calculate distance for sorting
            distance_expr = func.ST_Distance(
                func.ST_MakePoint(Listing.longitude, Listing.latitude),
                func.ST_MakePoint(longitude, latitude)
            ) * 111.0  # Convert to km
            search_query = search_query.add_columns(distance_expr.label('distance'))
        else:
            search_query = search_query.add_columns(func.literal(None).label('distance'))
        
        # Get total count
        count_query = select(func.count()).select_from(search_query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply sorting
        if sort_by == "relevance":
            # Use final_score for relevance sorting (includes all boosts)
            search_query = search_query.order_by(func.desc(text('final_score')))
        elif sort_by == "price_asc":
            search_query = search_query.order_by(Listing.base_price.asc())
        elif sort_by == "price_desc":
            search_query = search_query.order_by(Listing.base_price.desc())
        elif sort_by == "rating":
            search_query = search_query.order_by(Listing.rating.desc(), Listing.review_count.desc())
        elif sort_by == "newest":
            search_query = search_query.order_by(Listing.created_at.desc())
        elif sort_by == "popularity":
            search_query = search_query.order_by(func.desc(text('popularity')))
        elif latitude and longitude:
            # Sort by distance if location provided
            search_query = search_query.order_by(text('distance'))
        else:
            # Default: use final_score (includes all boosts)
            search_query = search_query.order_by(func.desc(text('final_score')))
        
        # Get paginated results with relationships
        search_query = search_query.options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.host_profile),
            selectinload(Listing.amenities)
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        
        # Extract listings from result (may include additional columns like relevance, distance)
        rows = result.all()
        listings = [row[0] if isinstance(row, tuple) else row for row in rows]
        
        return listings, total
    
    @staticmethod
    async def get_search_suggestions(
        db: AsyncSession,
        query: str,
        limit: int = 10
    ) -> List[dict]:
        """Return city and country search suggestions for the given query."""
        suggestions = []
        
        # City suggestions
        city_query = select(Listing.city).where(
            Listing.city.ilike(f"%{query}%"),
            Listing.status == ListingStatus.ACTIVE.value
        ).distinct().limit(limit)
        city_result = await db.execute(city_query)
        cities = city_result.scalars().all()
        
        for city in cities:
            suggestions.append({
                "type": "city",
                "text": city,
                "value": city
            })
        
        # Country suggestions
        country_query = select(Listing.country).where(
            Listing.country.ilike(f"%{query}%"),
            Listing.status == ListingStatus.ACTIVE.value
        ).distinct().limit(limit)
        country_result = await db.execute(country_query)
        countries = country_result.scalars().all()
        
        for country in countries:
            suggestions.append({
                "type": "country",
                "text": country,
                "value": country
            })
        
        return suggestions[:limit]

