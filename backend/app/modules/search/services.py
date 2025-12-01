"""
Search services for listings.
"""
from typing import List, Optional
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
        limit: int = 50
    ) -> tuple[List[Listing], int]:
        """Search listings with text, location, and filtering options."""
        # Base query
        search_query = select(Listing).where(Listing.status == ListingStatus.ACTIVE.value)
        
        # Text search
        if query:
            search_query = search_query.where(
                or_(
                    Listing.title.ilike(f"%{query}%"),
                    Listing.description.ilike(f"%{query}%"),
                    Listing.city.ilike(f"%{query}%"),
                    Listing.country.ilike(f"%{query}%")
                )
            )
        
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
        
        # Geographic search (within radius)
        if latitude and longitude and radius_km:
            # Simple distance calculation (Haversine formula approximation)
            # For production, use PostGIS or similar
            search_query = search_query.where(
                func.sqrt(
                    func.pow(Listing.latitude - latitude, 2) +
                    func.pow(Listing.longitude - longitude, 2)
                ) * 111.0 <= radius_km  # Rough conversion: 1 degree ≈ 111 km
            )
        
        # Get total count
        count_query = select(func.count()).select_from(search_query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results with relationships
        search_query = search_query.options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.host_profile),
            selectinload(Listing.amenities)
        ).offset(skip).limit(limit).order_by(Listing.created_at.desc())
        
        result = await db.execute(search_query)
        listings = result.scalars().all()
        
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

