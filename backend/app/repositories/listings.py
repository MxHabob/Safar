"""
Listing Repository
"""
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.repositories.base import BaseRepository
from app.domain.entities.listing import ListingEntity
from app.modules.listings.models import Listing, ListingStatus, ListingType
from app.core.id import ID


class IListingRepository:
    """Listing repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[ListingEntity]:
        """Get listing by ID"""
        pass
    
    async def get_by_slug(self, slug: str) -> Optional[ListingEntity]:
        """Get listing by slug"""
        pass
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ListingEntity]:
        """Get all listings with filters"""
        pass
    
    async def search(
        self,
        query: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_guests: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[ListingEntity], int]:
        """Search listings"""
        pass
    
    async def get_by_host(self, host_id: ID, skip: int = 0, limit: int = 100) -> List[ListingEntity]:
        """Get listings by host"""
        pass
    
    async def create(self, entity: ListingEntity) -> ListingEntity:
        """Create new listing"""
        pass
    
    async def update(self, entity: ListingEntity) -> ListingEntity:
        """Update listing"""
        pass
    
    async def delete(self, id: ID) -> bool:
        """Delete listing"""
        pass


class ListingRepository(BaseRepository[ListingEntity], IListingRepository):
    """Listing repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, Listing, ListingEntity)
    
    def _model_to_entity(self, model) -> Optional[ListingEntity]:
        """Convert SQLAlchemy model to domain entity"""
        if not model:
            return None
        
        return ListingEntity(
            id=model.id,
            title=model.title,
            slug=model.slug,
            summary=model.summary,
            description=model.description,
            listing_type=model.listing_type,
            status=model.status,
            host_id=model.host_id,
            host_profile_id=model.host_profile_id,
            agency_id=model.agency_id,
            address_line1=model.address_line1,
            address_line2=model.address_line2,
            city=model.city,
            state=model.state,
            country=model.country,
            postal_code=model.postal_code,
            latitude=model.latitude,
            longitude=model.longitude,
            capacity=model.capacity,
            bedrooms=model.bedrooms,
            beds=model.beds,
            bathrooms=model.bathrooms,
            max_guests=model.max_guests,
            square_meters=model.square_meters,
            base_price=model.base_price,
            currency=model.currency,
            cleaning_fee=model.cleaning_fee,
            service_fee=model.service_fee,
            security_deposit=model.security_deposit,
            booking_type=model.booking_type.value if hasattr(model.booking_type, 'value') else str(model.booking_type),
            min_stay_nights=model.min_stay_nights,
            max_stay_nights=model.max_stay_nights,
            check_in_time=model.check_in_time,
            check_out_time=model.check_out_time,
            rating=model.rating,
            review_count=model.review_count,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def get_by_slug(self, slug: str) -> Optional[ListingEntity]:
        """Get listing by slug"""
        result = await self.db.execute(
            select(Listing).where(Listing.slug == slug)
        )
        model = result.scalar_one_or_none()
        return self._model_to_entity(model) if model else None
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ListingEntity]:
        """Get all listings with filters"""
        query = select(Listing)
        
        if filters:
            if filters.get("status"):
                query = query.where(Listing.status == filters["status"])
            if filters.get("host_id"):
                query = query.where(Listing.host_id == filters["host_id"])
            if filters.get("city"):
                query = query.where(Listing.city.ilike(f"%{filters['city']}%"))
            if filters.get("country"):
                query = query.where(Listing.country == filters["country"])
        
        query = query.options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.host_profile)
        ).offset(skip).limit(limit).order_by(Listing.created_at.desc())
        
        result = await self.db.execute(query)
        models = result.scalars().all()
        return [self._model_to_entity(model) for model in models]
    
    async def search(
        self,
        query: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_guests: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[ListingEntity], int]:
        """Search listings"""
        search_query = select(Listing)
        
        if status:
            search_query = search_query.where(Listing.status == status)
        else:
            search_query = search_query.where(Listing.status == ListingStatus.ACTIVE.value)
        
        if query:
            search_query = search_query.where(
                or_(
                    Listing.title.ilike(f"%{query}%"),
                    Listing.description.ilike(f"%{query}%"),
                    Listing.city.ilike(f"%{query}%"),
                    Listing.country.ilike(f"%{query}%")
                )
            )
        
        if city:
            search_query = search_query.where(Listing.city.ilike(f"%{city}%"))
        if country:
            search_query = search_query.where(Listing.country == country)
        if listing_type:
            search_query = search_query.where(Listing.listing_type == listing_type.value)
        if min_price:
            search_query = search_query.where(Listing.base_price >= min_price)
        if max_price:
            search_query = search_query.where(Listing.base_price <= max_price)
        if min_guests:
            search_query = search_query.where(Listing.max_guests >= min_guests)
        
        # Get total count
        count_query = select(func.count()).select_from(search_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        search_query = search_query.options(
            selectinload(Listing.photos),
            selectinload(Listing.images),
            selectinload(Listing.host),
            selectinload(Listing.host_profile)
        ).offset(skip).limit(limit).order_by(Listing.created_at.desc())
        
        result = await self.db.execute(search_query)
        models = result.scalars().all()
        
        return [self._model_to_entity(model) for model in models], total
    
    async def get_by_host(self, host_id: ID, skip: int = 0, limit: int = 100) -> List[ListingEntity]:
        """Get listings by host"""
        query = select(Listing).where(
            Listing.host_id == host_id
        ).offset(skip).limit(limit).order_by(Listing.created_at.desc())
        
        result = await self.db.execute(query)
        models = result.scalars().all()
        return [self._model_to_entity(model) for model in models]
    
    async def create(self, entity: ListingEntity) -> ListingEntity:
        """Create new listing"""
        model = Listing(
            id=entity.id,
            title=entity.title,
            slug=entity.slug,
            summary=entity.summary,
            description=entity.description,
            listing_type=entity.listing_type,
            status=entity.status,
            host_id=entity.host_id,
            host_profile_id=entity.host_profile_id,
            agency_id=entity.agency_id,
            address_line1=entity.address_line1,
            address_line2=entity.address_line2,
            city=entity.city,
            state=entity.state,
            country=entity.country,
            postal_code=entity.postal_code,
            latitude=entity.latitude,
            longitude=entity.longitude,
            capacity=entity.capacity,
            bedrooms=entity.bedrooms,
            beds=entity.beds,
            bathrooms=entity.bathrooms,
            max_guests=entity.max_guests,
            square_meters=entity.square_meters,
            base_price=entity.base_price,
            currency=entity.currency,
            cleaning_fee=entity.cleaning_fee,
            service_fee=entity.service_fee,
            security_deposit=entity.security_deposit,
            booking_type=entity.booking_type,
            min_stay_nights=entity.min_stay_nights,
            max_stay_nights=entity.max_stay_nights,
            check_in_time=entity.check_in_time,
            check_out_time=entity.check_out_time,
            rating=entity.rating,
            review_count=entity.review_count
        )
        
        self.db.add(model)
        await self.db.commit()
        await self.db.refresh(model)
        return self._model_to_entity(model)
    
    async def update(self, entity: ListingEntity) -> ListingEntity:
        """Update listing"""
        result = await self.db.execute(
            select(Listing).where(Listing.id == entity.id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise ValueError(f"Listing with id {entity.id} not found")
        
        # Update fields
        model.title = entity.title
        model.slug = entity.slug
        model.summary = entity.summary
        model.description = entity.description
        model.listing_type = entity.listing_type
        model.status = entity.status
        model.address_line1 = entity.address_line1
        model.address_line2 = entity.address_line2
        model.city = entity.city
        model.state = entity.state
        model.country = entity.country
        model.postal_code = entity.postal_code
        model.latitude = entity.latitude
        model.longitude = entity.longitude
        model.capacity = entity.capacity
        model.bedrooms = entity.bedrooms
        model.beds = entity.beds
        model.bathrooms = entity.bathrooms
        model.max_guests = entity.max_guests
        model.square_meters = entity.square_meters
        model.base_price = entity.base_price
        model.currency = entity.currency
        model.cleaning_fee = entity.cleaning_fee
        model.service_fee = entity.service_fee
        model.security_deposit = entity.security_deposit
        model.min_stay_nights = entity.min_stay_nights
        model.max_stay_nights = entity.max_stay_nights
        model.check_in_time = entity.check_in_time
        model.check_out_time = entity.check_out_time
        
        await self.db.commit()
        await self.db.refresh(model)
        return self._model_to_entity(model)

