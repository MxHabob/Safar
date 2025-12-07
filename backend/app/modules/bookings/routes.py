"""
Booking routes.
Enhanced with new features.
"""
from typing import Any, List, Optional
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_host, get_unit_of_work
from app.repositories.unit_of_work import IUnitOfWork
from app.modules.users.models import User
from app.modules.bookings.models import Booking, BookingStatus
from app.core.id import ID
from app.modules.bookings.schemas import (
    BookingCreate, BookingResponse, BookingListResponse, BookingCancel
)
from app.modules.bookings.services import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """Create a new booking."""
    # Generate request ID for logging
    request_id = request.headers.get("X-Request-ID") or f"req_{secrets.token_urlsafe(8)}"
    
    booking_entity = await BookingService.create_booking(
        uow, booking_data, current_user.id, request_id=request_id
    )
    
    # Get full booking model for response
    from app.modules.bookings.models import Booking as BookingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(BookingModel)
        .where(BookingModel.id == booking_entity.id)
        .options(
            selectinload(BookingModel.listing),
            selectinload(BookingModel.guest),
            selectinload(BookingModel.timeline_events),
            selectinload(BookingModel.payments)
        )
    )
    booking = result.scalar_one_or_none()
    
    # Convert SQLAlchemy model to Pydantic schema
    return BookingResponse.model_validate(booking)


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """List bookings for the current user."""
    # Get bookings using service
    booking_entities = await BookingService.get_guest_bookings(
        uow, current_user.id, skip=skip, limit=limit
    )
    
    # Filter by status if provided
    if status_filter:
        booking_entities = [
            b for b in booking_entities if b.status == status_filter
        ]
    
    # Get full booking models for response
    from app.modules.bookings.models import Booking as BookingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    booking_ids = [b.id for b in booking_entities]
    if not booking_ids:
        return {
            "items": [],
            "total": 0,
            "skip": skip,
            "limit": limit
        }
    
    result = await uow.db.execute(
        select(BookingModel)
        .where(BookingModel.id.in_(booking_ids))
        .options(
            selectinload(BookingModel.listing),
            selectinload(BookingModel.guest),
            selectinload(BookingModel.timeline_events),
            selectinload(BookingModel.payments)
        )
    )
    bookings = result.scalars().all()
    
    return {
        "items": bookings,
        "total": len(booking_entities),
        "skip": skip,
        "limit": limit
    }


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: ID,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """Get booking details."""
    booking_entity = await BookingService.get_booking_by_id(uow, booking_id)
    
    if not booking_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check authorization
    if booking_entity.guest_id != current_user.id:
        # Check if user is the host
        listing = await uow.listings.get_by_id(booking_entity.listing_id)
        if not listing or listing.host_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this booking"
            )
    
    # Get full booking model
    from app.modules.bookings.models import Booking as BookingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(BookingModel)
        .where(BookingModel.id == booking_id)
        .options(
            selectinload(BookingModel.listing),
            selectinload(BookingModel.guest),
            selectinload(BookingModel.timeline_events),
            selectinload(BookingModel.payments)
        )
    )
    booking = result.scalar_one_or_none()
    
    # Convert SQLAlchemy model to Pydantic schema
    return BookingResponse.model_validate(booking)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: ID,
    cancel_data: BookingCancel,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """Cancel a booking."""
    booking_entity = await BookingService.cancel_booking(
        uow, booking_id, current_user.id, cancel_data.cancellation_reason
    )
    
    # Get full booking model
    from app.modules.bookings.models import Booking as BookingModel
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await uow.db.execute(
        select(BookingModel)
        .where(BookingModel.id == booking_id)
        .options(selectinload(BookingModel.timeline_events))
    )
    booking = result.scalar_one_or_none()
    
    # Convert SQLAlchemy model to Pydantic schema
    return BookingResponse.model_validate(booking)


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(
    booking_id: ID,
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Confirm a booking (host only)."""
    booking = await BookingService.confirm_booking(
        db, booking_id, current_user.id
    )
    
    await db.refresh(booking, ["timeline_events"])
    
    # Convert SQLAlchemy model to Pydantic schema
    return BookingResponse.model_validate(booking)


@router.post("/{booking_id}/complete", response_model=BookingResponse)
async def complete_booking(
    booking_id: ID,
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Mark a booking as completed and award loyalty points.
    
    This should be called after guest checkout. Awards loyalty points to the guest.
    """
    # Get booking
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(selectinload(Booking.listing))
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify host owns the listing
    if booking.listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this booking"
        )
    
    # Store old status for analytics
    old_status = booking.status
    
    # Update booking status
    booking.status = BookingStatus.COMPLETED
    booking.completed_at = func.now()
    
    await db.commit()
    await db.refresh(booking, ["timeline_events"])
    
    # Track analytics event
    try:
        from app.modules.analytics.service import AnalyticsService
        await AnalyticsService.track_event(
            db=db,
            user_id=booking.guest_id,
            event_name="booking_status_changed",
            source="api",
            payload={
                "booking_id": str(booking_id),
                "old_status": old_status,
                "new_status": BookingStatus.COMPLETED.value,
                "changed_by": str(current_user.id)
            }
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to track booking status change analytics: {e}")
    
    # Send notifications
    try:
        from app.modules.notifications.service import NotificationService
        await NotificationService.booking_completed(
            db=db,
            booking_id=booking_id,
            guest_id=booking.guest_id,
            host_id=current_user.id
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send booking completed notification: {e}")
    
    # Emit WebSocket event to host dashboard
    try:
        from app.infrastructure.websocket.manager import manager
        await manager.send_to_room(
            {
                "type": "booking_updated",
                "booking_id": str(booking_id),
                "status": BookingStatus.COMPLETED.value,
                "booking_number": booking.booking_number
            },
            room_id=f"host_dashboard_{current_user.id}"
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to emit WebSocket event: {e}")
    
    # Award loyalty points (async via Celery task)
    try:
        from app.modules.loyalty.tasks import award_points_for_booking_task
        award_points_for_booking_task.delay(str(booking_id))
    except Exception as e:
        # Log error but don't fail the completion
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to queue loyalty points award: {str(e)}")
    
    # Convert SQLAlchemy model to Pydantic schema
    return BookingResponse.model_validate(booking)


@router.get("/host/listings", response_model=BookingListResponse)
async def list_host_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List bookings for the current host."""
    from app.modules.listings.models import Listing
    
    # Get host listings
    listings_result = await db.execute(
        select(Listing.id).where(Listing.host_id == current_user.id)
    )
    listing_ids = [row[0] for row in listings_result.all()]
    
    if not listing_ids:
        return {
            "items": [],
            "total": 0,
            "skip": skip,
            "limit": limit
        }
    
    query = select(Booking).where(Booking.listing_id.in_(listing_ids))
    
    if status_filter:
        query = query.where(Booking.status == status_filter)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.options(
        selectinload(Booking.listing),
        selectinload(Booking.guest),
        selectinload(Booking.timeline_events)
    ).offset(skip).limit(limit).order_by(Booking.created_at.desc())
    
    result = await db.execute(query)
    bookings = result.scalars().all()
    
    return {
        "items": bookings,
        "total": total,
        "skip": skip,
        "limit": limit
    }
