"""
Listing Services
Using Repository Pattern and Domain Entities
"""
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from decimal import Decimal
import re

from app.repositories.unit_of_work import IUnitOfWork
from app.domain.entities.listing import ListingEntity
from app.modules.listings.schemas import ListingCreate, ListingUpdate
from app.modules.listings.models import ListingStatus, ListingType
from app.core.id import generate_typed_id, ID


class ListingService:
    """Listing service using repositories."""
    
    @staticmethod
    async def get_listing_by_id(
        uow: IUnitOfWork,
        listing_id: ID
    ) -> Optional[ListingEntity]:
        """Get listing by ID."""
        return await uow.listings.get_by_id(listing_id)
    
    @staticmethod
    async def get_listing_by_slug(
        uow: IUnitOfWork,
        slug: str
    ) -> Optional[ListingEntity]:
        """Get listing by slug."""
        return await uow.listings.get_by_slug(slug)
    
    @staticmethod
    async def list_listings(
        uow: IUnitOfWork,
        skip: int = 0,
        limit: int = 50,
        city: Optional[str] = None,
        country: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_guests: Optional[int] = None,
        status: Optional[ListingStatus] = ListingStatus.ACTIVE
    ) -> Tuple[List[ListingEntity], int]:
        """List listings with optional filters."""
        return await uow.listings.search(
            query=None,
            city=city,
            country=country,
            listing_type=listing_type,
            min_price=min_price,
            max_price=max_price,
            min_guests=min_guests,
            status=status.value if status else ListingStatus.ACTIVE.value,
            skip=skip,
            limit=limit
        )
    
    @staticmethod
    async def search_listings(
        uow: IUnitOfWork,
        query: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_guests: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[ListingEntity], int]:
        """Search listings with text and filter criteria."""
        return await uow.listings.search(
            query=query,
            city=city,
            country=country,
            listing_type=listing_type,
            min_price=min_price,
            max_price=max_price,
            min_guests=min_guests,
            status=ListingStatus.ACTIVE.value,
            skip=skip,
            limit=limit
        )
    
    @staticmethod
    async def create_listing(
        uow: IUnitOfWork,
        listing_data: ListingCreate,
        host_id: ID
    ) -> ListingEntity:
        """Create a new listing for the given host."""
        # Generate slug
        slug = ListingService._generate_slug(listing_data.title)
        
        # Check if slug exists
        existing = await uow.listings.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{generate_typed_id(prefix='')[:6]}"
        
        # Get host profile if exists
        host_profile_id = None
        from app.modules.users.models import HostProfile
        from sqlalchemy import select
        result = await uow.db.execute(
            select(HostProfile).where(HostProfile.user_id == host_id)
        )
        host_profile = result.scalar_one_or_none()
        if host_profile:
            host_profile_id = host_profile.id
        
        # Create domain entity
        listing = ListingEntity(
            id=generate_typed_id(prefix="LST"),
            title=listing_data.title,
            slug=slug,
            summary=listing_data.summary,
            description=listing_data.description,
            listing_type=listing_data.listing_type.value,
            status=ListingStatus.DRAFT.value,
            host_id=host_id,
            host_profile_id=host_profile_id,
            address_line1=listing_data.address_line1,
            address_line2=listing_data.address_line2,
            city=listing_data.city,
            state=listing_data.state,
            country=listing_data.country,
            postal_code=listing_data.postal_code,
            latitude=listing_data.latitude,
            longitude=listing_data.longitude,
            capacity=listing_data.capacity,
            bedrooms=listing_data.bedrooms,
            beds=listing_data.beds,
            bathrooms=listing_data.bathrooms,
            max_guests=listing_data.max_guests,
            square_meters=listing_data.square_meters,
            base_price=listing_data.base_price,
            currency=listing_data.currency,
            cleaning_fee=listing_data.cleaning_fee or Decimal("0"),
            service_fee=listing_data.service_fee or Decimal("0"),
            security_deposit=listing_data.security_deposit or Decimal("0"),
            booking_type=listing_data.booking_type.value,
            min_stay_nights=listing_data.min_stay_nights or 1,
            max_stay_nights=listing_data.max_stay_nights,
            check_in_time=listing_data.check_in_time or "15:00",
            check_out_time=listing_data.check_out_time or "11:00",
            rating=Decimal("0"),
            review_count=0
        )
        
        # Use domain logic
        if listing.is_draft():
            listing.status = ListingStatus.DRAFT.value
        
        # Save through repository
        created = await uow.listings.create(listing)
        
        # Create location if coordinates provided
        if listing_data.latitude and listing_data.longitude:
            from app.modules.listings.models import ListingLocation
            from geoalchemy2 import WKTElement
            
            point = WKTElement(
                f'POINT({listing_data.longitude} {listing_data.latitude})',
                srid=4326
            )
            location = ListingLocation(
                listing_id=created.id,
                timezone=listing_data.city,  # Should be proper timezone lookup
                neighborhood=None,
                coordinates=point
            )
            uow.db.add(location)
        
        await uow.commit()
        return created
    
    @staticmethod
    async def update_listing(
        uow: IUnitOfWork,
        listing_id: ID,
        listing_data: ListingUpdate,
        user_id: ID,
        is_admin: bool = False
    ) -> ListingEntity:
        """Update a listing, ensuring the user is authorized."""
        listing = await uow.listings.get_by_id(listing_id)
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Check authorization using domain logic
        if not is_admin and listing.host_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this listing"
            )
        
        # Update fields
        update_data = listing_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(listing, field):
                if field == "listing_type" and value:
                    setattr(listing, field, value.value if hasattr(value, 'value') else value)
                elif field == "status" and value:
                    setattr(listing, field, value.value if hasattr(value, 'value') else value)
                else:
                    setattr(listing, field, value)
        
        # Use domain logic to validate
        if listing.status == "active" and not listing.can_be_booked():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing cannot be activated with current settings"
            )
        
        updated = await uow.listings.update(listing)
        await uow.commit()
        return updated
    
    @staticmethod
    async def delete_listing(
        uow: IUnitOfWork,
        listing_id: ID,
        user_id: ID,
        is_admin: bool = False
    ) -> bool:
        """Delete a listing, ensuring the user is authorized."""
        listing = await uow.listings.get_by_id(listing_id)
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Check authorization
        if not is_admin and listing.host_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this listing"
            )
        
        deleted = await uow.listings.delete(listing_id)
        await uow.commit()
        return deleted
    
    @staticmethod
    async def get_host_listings(
        uow: IUnitOfWork,
        host_id: ID,
        skip: int = 0,
        limit: int = 100
    ) -> List[ListingEntity]:
        """Get all listings for a given host."""
        return await uow.listings.get_by_host(host_id, skip=skip, limit=limit)
    
    @staticmethod
    def _generate_slug(title: str) -> str:
        """Generate a URL-friendly slug from the given title."""
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug[:500]  # Limit to 500 chars

