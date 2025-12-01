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
        sort_by: Optional[str] = "relevance"  # relevance, price_asc, price_desc, rating, newest
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
        if sort_by == "relevance" and query:
            search_query = search_query.order_by(func.desc(text('relevance')))
        elif sort_by == "price_asc":
            search_query = search_query.order_by(Listing.base_price.asc())
        elif sort_by == "price_desc":
            search_query = search_query.order_by(Listing.base_price.desc())
        elif sort_by == "rating":
            search_query = search_query.order_by(Listing.rating.desc(), Listing.review_count.desc())
        elif sort_by == "newest":
            search_query = search_query.order_by(Listing.created_at.desc())
        elif latitude and longitude:
            # Sort by distance if location provided
            search_query = search_query.order_by(text('distance'))
        else:
            # Default: newest first
            search_query = search_query.order_by(Listing.created_at.desc())
        
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

