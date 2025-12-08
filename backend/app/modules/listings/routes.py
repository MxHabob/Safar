"""
Listing routes.
Expose listing CRUD and location endpoints using services with the repository pattern.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_active_user, 
    require_host, 
    get_unit_of_work,
    get_optional_active_user
)
from app.repositories.unit_of_work import IUnitOfWork
from app.modules.users.models import User
from typing import Optional, Union
from app.modules.listings.models import ListingStatus, ListingType
from app.modules.listings.schemas import (
    ListingCreate, ListingResponse, ListingUpdate, ListingListResponse,
    ListingLocationCreate, ListingLocationUpdate,
    PublicListingResponse, PublicListingLocationResponse,
    ListingPhotoResponse, ListingImageResponse
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
    List listings with optional filters (city, country, type, price, guests, status).
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
            # Convert SQLAlchemy model to Pydantic schema
            items.append(ListingResponse.model_validate(listing_model))
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{listing_id}", response_model=Union[PublicListingResponse, ListingResponse])
async def get_listing(
    listing_id: ID,
    optional_user: Optional[User] = Depends(get_optional_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Get listing details.
    
    - Public access: returns limited data (no exact address, limited host info).
    - Authenticated access: returns full data with personalized information.
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
    from decimal import Decimal
    
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
    
    # If user is not authenticated, return limited public data
    if not optional_user:
        
        # Create public response with limited data
        approximate_location = None
        if listing_model.location:
            lat = None
            lng = None
            # Preferred: extract from PostGIS geography point
            try:
                if listing_model.location.coordinates:
                    from geoalchemy2.shape import to_shape
                    point = to_shape(listing_model.location.coordinates)
                    lat = float(point.y)
                    lng = float(point.x)
            except Exception:
                # Best-effort fallback handled below
                lat = None
                lng = None

            # Fallback: legacy latitude/longitude fields on Listing
            if lat is None:
                lat = float(listing_model.latitude) if listing_model.latitude is not None else None
            if lng is None:
                lng = float(listing_model.longitude) if listing_model.longitude is not None else None

            # Round coordinates to 1 decimal place (approximate)
            if lat is not None and lng is not None:
                approximate_location = PublicListingLocationResponse(
                    city=listing_model.city,
                    country=listing_model.country,
                    neighborhood=listing_model.location.neighborhood if listing_model.location else None,
                    approximate_latitude=Decimal(round(lat, 1)),
                    approximate_longitude=Decimal(round(lng, 1))
                )
        
        return PublicListingResponse(
            id=listing_model.id,
            slug=listing_model.slug,
            title=listing_model.title,
            summary=listing_model.summary,
            description=listing_model.description,
            listing_type=listing_model.listing_type,
            status=listing_model.status,
            rating=listing_model.rating,
            review_count=listing_model.review_count,
            city=listing_model.city,
            country=listing_model.country,
            state=listing_model.state,
            approximate_location=approximate_location,
            base_price=listing_model.base_price,
            currency=listing_model.currency,
            cleaning_fee=listing_model.cleaning_fee,
            service_fee=listing_model.service_fee,
            capacity=listing_model.capacity,
            bedrooms=listing_model.bedrooms,
            beds=listing_model.beds,
            bathrooms=listing_model.bathrooms,
            max_guests=listing_model.max_guests,
            square_meters=listing_model.square_meters,
            photos=[ListingPhotoResponse.model_validate(p) for p in listing_model.photos],
            images=[ListingImageResponse.model_validate(img) for img in listing_model.images],
            booking_type=listing_model.booking_type,
            min_stay_nights=listing_model.min_stay_nights,
            max_stay_nights=listing_model.max_stay_nights,
            check_in_time=listing_model.check_in_time,
            check_out_time=listing_model.check_out_time,
            host_id=listing_model.host_id,
            created_at=listing_model.created_at,
            updated_at=listing_model.updated_at,
            is_favorite=False,
            can_book=False
        )
    
    # Authenticated user - return full data with personalization
    # Check if listing is in user's wishlist
    is_favorite = False
    try:
        from app.modules.wishlist.models import Wishlist
        wishlist_result = await uow.db.execute(
            select(Wishlist).where(
                Wishlist.listing_id == listing_id,
                Wishlist.user_id == optional_user.id
            )
        )
        is_favorite = wishlist_result.scalar_one_or_none() is not None
    except Exception:
        pass  # Wishlist module might not exist yet
    
    # Create full response with personalization
    response = ListingResponse.model_validate(listing_model)
    response.is_favorite = is_favorite
    response.can_book = True
    # TODO: Add viewed_recently check if needed
    
    return response


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Create a new listing for the current host.
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
    
    # Convert SQLAlchemy model to Pydantic schema
    return ListingResponse.model_validate(listing_model)


@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: ID,
    listing_data: ListingUpdate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Update an existing listing (host or admin only).
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
    
    # Convert SQLAlchemy model to Pydantic schema
    return ListingResponse.model_validate(listing_model)


@router.delete("/{listing_id}", response_class=Response)
async def delete_listing(
    listing_id: ID,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Delete a listing (host or admin only).
    """
    is_admin = current_user.role.value in ["admin", "super_admin"]
    
    await ListingService.delete_listing(
        uow=uow,
        listing_id=listing_id,
        user_id=current_user.id,
        is_admin=is_admin
    )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{listing_id}/location", response_model=ListingResponse)
async def create_listing_location(
    listing_id: ID,
    location_data: ListingLocationCreate,
    current_user: User = Depends(require_host),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Create or update the listing location with PostGIS coordinates.
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
    
    # Convert SQLAlchemy model to Pydantic schema
    return ListingResponse.model_validate(listing_model)
