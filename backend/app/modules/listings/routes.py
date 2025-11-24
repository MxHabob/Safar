"""
مسارات القوائم - Listing Routes
Using Services with Repository Pattern
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_host, get_unit_of_work
from app.repositories.unit_of_work import IUnitOfWork
from app.modules.users.models import User
from app.modules.listings.models import ListingStatus, ListingType
from app.modules.listings.schemas import (
    ListingCreate, ListingResponse, ListingUpdate, ListingListResponse,
    ListingLocationCreate, ListingLocationUpdate
)
from app.modules.listings.services import ListingService
from app.core.id import ID

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.get("", response_model=ListingListResponse)
async def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    city: Optional[str] = None,
    country: Optional[str] = None,
    listing_type: Optional[ListingType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_guests: Optional[int] = None,
    status: Optional[ListingStatus] = ListingStatus.ACTIVE,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    قائمة القوائم مع فلترة
    List listings with filters
    """
    listings, total = await ListingService.list_listings(
        uow=uow,
        skip=skip,
        limit=limit,
        city=city,
        country=country,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_guests=min_guests,
        status=status
    )
    
    # Convert domain entities to response models
    # Note: In production, you'd use a mapper or converter
    items = []
    for listing in listings:
        # Convert ListingEntity to ListingResponse
        # This is simplified - you'd use a proper mapper
        from app.modules.listings.models import Listing as ListingModel
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        result = await uow.db.execute(
            select(ListingModel)
            .where(ListingModel.id == listing.id)
            .options(
                selectinload(ListingModel.photos),
                selectinload(ListingModel.images),
                selectinload(ListingModel.host),
                selectinload(ListingModel.host_profile)
            )
        )
        listing_model = result.scalar_one_or_none()
        if listing_model:
            items.append(listing_model)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: ID,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    الحصول على تفاصيل قائمة
    Get listing details
    """
    listing = await ListingService.get_listing_by_id(uow, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Get full model with relationships
    from app.modules.listings.models import Listing as ListingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(ListingModel)
        .where(ListingModel.id == listing.id)
        .options(
            selectinload(ListingModel.photos),
            selectinload(ListingModel.images),
            selectinload(ListingModel.host),
            selectinload(ListingModel.host_profile),
            selectinload(ListingModel.amenities),
            selectinload(ListingModel.rules),
            selectinload(ListingModel.reviews),
            selectinload(ListingModel.location),
            selectinload(ListingModel.calendar)
        )
    )
    listing_model = result.scalar_one_or_none()
    
    if not listing_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    return listing_model


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    إنشاء قائمة جديدة
    Create new listing
    """
    listing = await ListingService.create_listing(
        uow=uow,
        listing_data=listing_data,
        host_id=current_user.id
    )
    
    # Get full model with relationships
    from app.modules.listings.models import Listing as ListingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(ListingModel)
        .where(ListingModel.id == listing.id)
        .options(
            selectinload(ListingModel.photos),
            selectinload(ListingModel.images),
            selectinload(ListingModel.location)
        )
    )
    listing_model = result.scalar_one_or_none()
    
    return listing_model


@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: ID,
    listing_data: ListingUpdate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    تحديث قائمة
    Update listing
    """
    is_admin = current_user.role.value in ["admin", "super_admin"]
    
    listing = await ListingService.update_listing(
        uow=uow,
        listing_id=listing_id,
        listing_data=listing_data,
        user_id=current_user.id,
        is_admin=is_admin
    )
    
    # Get full model
    from app.modules.listings.models import Listing as ListingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(ListingModel)
        .where(ListingModel.id == listing.id)
        .options(
            selectinload(ListingModel.photos),
            selectinload(ListingModel.images)
        )
    )
    listing_model = result.scalar_one_or_none()
    
    return listing_model


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: ID,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    حذف قائمة
    Delete listing
    """
    is_admin = current_user.role.value in ["admin", "super_admin"]
    
    await ListingService.delete_listing(
        uow=uow,
        listing_id=listing_id,
        user_id=current_user.id,
        is_admin=is_admin
    )
    
    return None


@router.post("/{listing_id}/location", response_model=ListingResponse)
async def create_listing_location(
    listing_id: ID,
    location_data: ListingLocationCreate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    إنشاء أو تحديث موقع القائمة مع PostGIS
    Create or update listing location with PostGIS
    """
    # Check listing exists and user owns it
    listing = await ListingService.get_listing_by_id(uow, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Create/update location
    from app.modules.listings.models import ListingLocation
    from geoalchemy2 import WKTElement
    from sqlalchemy import select
    
    point = WKTElement(
        f'POINT({location_data.longitude} {location_data.latitude})',
        srid=4326
    )
    
    location_result = await uow.db.execute(
        select(ListingLocation).where(ListingLocation.listing_id == listing_id)
    )
    location = location_result.scalar_one_or_none()
    
    if location:
        location.timezone = location_data.timezone
        location.neighborhood = location_data.neighborhood
        location.coordinates = point
    else:
        location = ListingLocation(
            listing_id=listing_id,
            timezone=location_data.timezone,
            neighborhood=location_data.neighborhood,
            coordinates=point
        )
        uow.db.add(location)
    
    await uow.commit()
    
    # Get full listing model
    from app.modules.listings.models import Listing as ListingModel
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(ListingModel)
        .where(ListingModel.id == listing_id)
        .options(selectinload(ListingModel.location))
    )
    listing_model = result.scalar_one_or_none()
    
    return listing_model
