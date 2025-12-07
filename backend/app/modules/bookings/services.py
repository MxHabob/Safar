"""
Booking services.
Implements booking workflows using the repository pattern and domain entities.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from decimal import Decimal
import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.unit_of_work import IUnitOfWork
from app.domain.entities.booking import BookingEntity
from app.domain.entities.listing import ListingEntity
from app.modules.bookings.schemas import BookingCreate
from app.modules.bookings.models import BookingStatus, PaymentStatus
from app.core.id import generate_typed_id, ID
from app.core.config import get_settings

settings = get_settings()


class BookingService:
    """Booking service using repositories and domain entities."""
    
    @staticmethod
    def generate_booking_number() -> str:
        """Generate a unique booking number."""
        return f"BK{secrets.token_urlsafe(8).upper()}"
    
    @staticmethod
    async def check_listing_availability(
        uow: IUnitOfWork,
        listing_id: ID,
        check_in: datetime,
        check_out: datetime
    ) -> bool:
        """Check if a listing is available for the given date range."""
        # Get listing using domain logic
        listing = await uow.listings.get_by_id(listing_id)
        
        if not listing:
            return False
        
        # Use domain logic
        if not listing.is_active():
            return False
        
        if not listing.can_be_booked():
            return False
        
        # Check availability using repository
        return await uow.bookings.check_availability(
            listing_id=listing_id,
            check_in=check_in,
            check_out=check_out
        )
    
    @staticmethod
    async def calculate_booking_price(
        uow: IUnitOfWork,
        listing_id: ID,
        check_in: datetime,
        check_out: datetime,
        guests: int,
        coupon_code: Optional[str] = None
    ) -> Dict[str, Decimal]:
        """Calculate booking price and return a detailed price breakdown."""
        listing = await uow.listings.get_by_id(listing_id)
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Calculate nights
        nights = (check_out - check_in).days
        if nights < listing.min_stay_nights:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum stay is {listing.min_stay_nights} nights"
            )
        
        # Use domain logic to calculate price
        total_price = listing.calculate_total_price(nights)
        
        # Add security deposit
        security_deposit = listing.security_deposit or Decimal("0")
        
        # Calculate breakdown
        base_price = listing.base_price * nights
        cleaning_fee = listing.cleaning_fee or Decimal("0")
        service_fee = (base_price * listing.service_fee) / 100 if listing.service_fee else Decimal("0")
        
        # Apply coupon if provided
        discount = Decimal("0")
        if coupon_code:
            from app.modules.promotions.services import PromotionService
            from datetime import date
            import logging
            
            logger = logging.getLogger(__name__)
            
            # Calculate subtotal before discount for coupon validation
            subtotal_before_discount = base_price + cleaning_fee + service_fee
            
            # Convert datetime to date if needed
            check_in_date = check_in.date() if isinstance(check_in, datetime) else check_in
            check_out_date = check_out.date() if isinstance(check_out, datetime) else check_out
            
            # Validate and calculate coupon discount
            # Note: guest_id not available in this context, will validate without user-specific checks
            try:
                coupon_info = await PromotionService.validate_coupon(
                    uow.db,
                    coupon_code=coupon_code,
                    listing_id=listing_id,
                    booking_amount=subtotal_before_discount,
                    check_in_date=check_in_date,
                    check_out_date=check_out_date,
                    nights=nights,
                    guests=guests,
                    user_id=None  # Will be validated later when creating booking
                )
                discount = coupon_info["discount_amount"]
            except HTTPException:
                # If coupon validation fails, raise the exception
                raise
            except Exception as e:
                # Log error but don't fail booking calculation
                logger.warning(f"Error validating coupon {coupon_code}: {str(e)}")
                discount = Decimal("0")
        
        subtotal = base_price + cleaning_fee + service_fee
        total = subtotal - discount + security_deposit
        
        return {
            "base_price": base_price,
            "cleaning_fee": cleaning_fee,
            "service_fee": service_fee,
            "security_deposit": security_deposit,
            "discount": discount,
            "subtotal": subtotal,
            "total": total,
            "nights": nights,
            "currency": listing.currency
        }
    
    @staticmethod
    async def create_booking(
        uow: IUnitOfWork,
        booking_data: BookingCreate,
        guest_id: ID,
        request_id: Optional[str] = None
    ) -> BookingEntity:
        """Create a new booking.
        
        Uses row-level locking (`SELECT ... FOR UPDATE NOWAIT`) to prevent double-booking
        race conditions and handles exclusion constraint violations gracefully.
        """
        import logging
        from sqlalchemy.exc import IntegrityError
        
        logger = logging.getLogger(__name__)
        
        try:
            # CRITICAL: Lock listing row to prevent concurrent bookings
            # This ensures atomicity of availability check + booking creation
            # Transaction isolation level (REPEATABLE READ) prevents phantom reads
            listing = await uow.listings.get_by_id(booking_data.listing_id, with_lock=True)
            
            if not listing:
                logger.warning(
                    f"Booking attempt failed: Listing not found. "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Listing not found"
                )
            
            # Use domain logic
            if not listing.is_active():
                logger.warning(
                    f"Booking attempt failed: Listing not active. "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Listing is not active"
                )
            
            if not listing.can_be_booked():
                logger.warning(
                    f"Booking attempt failed: Listing cannot be booked. "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Listing cannot be booked"
                )
            
            # CRITICAL: Additional date validation (business logic layer)
            # Schema validation handles basic checks, but we add business rules here
            now = datetime.now(timezone.utc)
            check_in = booking_data.check_in
            check_out = booking_data.check_out
            
            # Ensure timezone-aware
            if check_in.tzinfo is None:
                check_in = check_in.replace(tzinfo=timezone.utc)
            if check_out.tzinfo is None:
                check_out = check_out.replace(tzinfo=timezone.utc)
            
            # Validate minimum advance booking
            if settings.booking_min_advance_hours > 0:
                min_advance = timedelta(hours=settings.booking_min_advance_hours)
                if check_in < now + min_advance:
                    logger.warning(
                        f"Booking attempt failed: Insufficient advance notice. "
                        f"check_in={check_in}, now={now}, min_advance_hours={settings.booking_min_advance_hours}, "
                        f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Booking must be made at least {settings.booking_min_advance_hours} hours in advance"
                    )
            
            # Validate maximum advance booking
            max_advance = timedelta(days=settings.booking_max_advance_days)
            if check_in > now + max_advance:
                logger.warning(
                    f"Booking attempt failed: Booking too far in advance. "
                    f"check_in={check_in}, now={now}, max_advance_days={settings.booking_max_advance_days}, "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Booking cannot be made more than {settings.booking_max_advance_days} days in advance"
                )
            
            # Validate against listing's min/max stay requirements
            nights = (check_out - check_in).days
            if listing.min_stay_nights and nights < listing.min_stay_nights:
                logger.warning(
                    f"Booking attempt failed: Minimum stay requirement not met. "
                    f"nights={nights}, min_stay_nights={listing.min_stay_nights}, "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Minimum stay is {listing.min_stay_nights} nights. Requested: {nights} nights"
                )
            
            if listing.max_stay_nights and nights > listing.max_stay_nights:
                logger.warning(
                    f"Booking attempt failed: Maximum stay requirement exceeded. "
                    f"nights={nights}, max_stay_nights={listing.max_stay_nights}, "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Maximum stay is {listing.max_stay_nights} nights. Requested: {nights} nights"
                )
            
            # Validate guest capacity
            if booking_data.guests > listing.max_guests:
                logger.warning(
                    f"Booking attempt failed: Guest capacity exceeded. "
                    f"guests={booking_data.guests}, max_guests={listing.max_guests}, "
                    f"listing_id={booking_data.listing_id}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Listing accommodates maximum {listing.max_guests} guests. Requested: {booking_data.guests} guests"
                )
            
            # Check availability (within locked transaction)
            is_available = await uow.bookings.check_availability(
                listing_id=booking_data.listing_id,
                check_in=booking_data.check_in,
                check_out=booking_data.check_out
            )
            
            if not is_available:
                logger.warning(
                    f"Booking attempt failed: Listing not available for dates. "
                    f"listing_id={booking_data.listing_id}, check_in={booking_data.check_in}, "
                    f"check_out={booking_data.check_out}, guest_id={guest_id}, request_id={request_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Listing not available for selected dates"
                )
            
            # Calculate price (with coupon if provided)
            price_breakdown = await BookingService.calculate_booking_price(
                uow,
                booking_data.listing_id,
                booking_data.check_in,
                booking_data.check_out,
                booking_data.guests,
                coupon_code=getattr(booking_data, 'coupon_code', None)
            )
            
            # Calculate nights
            nights = (booking_data.check_out - booking_data.check_in).days
            
            # Apply coupon if provided and validate with user_id
            coupon_code = getattr(booking_data, 'coupon_code', None)
            discount_amount = price_breakdown.get("discount", Decimal("0"))
            
            if coupon_code:
                # Re-validate coupon with actual user_id for user-specific checks
                from app.modules.promotions.services import PromotionService
                from datetime import date
                
                try:
                    coupon_info = await PromotionService.validate_coupon(
                        uow.db,
                        coupon_code=coupon_code,
                        listing_id=booking_data.listing_id,
                        booking_amount=price_breakdown["subtotal"],
                        check_in_date=booking_data.check_in.date() if hasattr(booking_data.check_in, 'date') else booking_data.check_in,
                        check_out_date=booking_data.check_out.date() if hasattr(booking_data.check_out, 'date') else booking_data.check_out,
                        nights=nights,
                        guests=booking_data.guests,
                        user_id=guest_id  # Now we have the actual user_id
                    )
                    discount_amount = coupon_info["discount_amount"]
                except HTTPException:
                    raise  # Re-raise validation errors
                except Exception as e:
                    logger.warning(f"Error validating coupon {coupon_code}: {str(e)}")
                    discount_amount = Decimal("0")
                    coupon_code = None  # Don't apply invalid coupon
            
            # Create domain entity with all pricing details
            booking = BookingEntity(
                id=generate_typed_id(prefix="BKG"),
                booking_number=BookingService.generate_booking_number(),
                listing_id=booking_data.listing_id,
                guest_id=guest_id,
                check_in=booking_data.check_in,
                check_out=booking_data.check_out,
                nights=nights,
                guests=booking_data.guests,
                adults=booking_data.adults or booking_data.guests,
                children=booking_data.children or 0,
                infants=booking_data.infants or 0,
                total_amount=price_breakdown["total"] - discount_amount,  # Apply discount
                payout_amount=(price_breakdown["subtotal"] - discount_amount) * Decimal("0.85"),  # 85% to host
                currency=price_breakdown["currency"],
                status=BookingStatus.PENDING.value,
                payment_status=PaymentStatus.PENDING.value,
                special_requests=booking_data.special_requests,
                guest_message=booking_data.guest_message
            )
            
            # Add pricing fields and coupon to entity for repository mapping
            booking.base_price = price_breakdown["base_price"]
            booking.cleaning_fee = price_breakdown.get("cleaning_fee", Decimal("0"))
            booking.service_fee = price_breakdown.get("service_fee", Decimal("0"))
            booking.security_deposit = price_breakdown.get("security_deposit", Decimal("0"))
            booking.discount_amount = discount_amount
            booking.coupon_code = coupon_code
            
            # Save through repository (within locked transaction)
            created = await uow.bookings.create(booking)
            
            # Apply coupon usage increment after booking is created
            if coupon_code and created:
                try:
                    await PromotionService.apply_coupon(uow.db, coupon_code, created.id)
                except Exception as e:
                    logger.warning(f"Error applying coupon usage {coupon_code}: {str(e)}")
                    # Don't fail booking if coupon usage tracking fails
            
            # Use domain logic - update status for instant bookings
            if listing.booking_type == "instant":
                created.status = BookingStatus.CONFIRMED.value
                # Update the booking with the new status
                created = await uow.bookings.update(created)
            
            try:
                await uow.commit()
            except IntegrityError as e:
                # CRITICAL: Handle exclusion constraint violation
                # This can happen if another transaction created a booking between our check and commit
                # The database constraint is the final safeguard
                await uow.rollback()
                
                error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
                
                # Check if it's an exclusion constraint violation
                if "excl_booking_overlap" in error_msg or "exclude" in error_msg.lower():
                    logger.warning(
                        f"Booking creation failed: Exclusion constraint violation (double-booking prevented). "
                        f"listing_id={booking_data.listing_id}, check_in={booking_data.check_in}, "
                        f"check_out={booking_data.check_out}, guest_id={guest_id}, request_id={request_id}, "
                        f"error={error_msg}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="These dates are no longer available. Another booking was just confirmed. Please select different dates."
                    )
                else:
                    # Other integrity errors (unique constraints, etc.)
                    logger.error(
                        f"Booking creation failed: Integrity constraint violation. "
                        f"listing_id={booking_data.listing_id}, guest_id={guest_id}, "
                        f"request_id={request_id}, error={error_msg}",
                        exc_info=True
                    )
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Booking creation failed due to a conflict. Please try again."
                    )
            
            logger.info(
                f"Booking created successfully. "
                f"booking_id={created.id}, booking_number={created.booking_number}, "
                f"listing_id={booking_data.listing_id}, guest_id={guest_id}, "
                f"check_in={booking_data.check_in}, check_out={booking_data.check_out}, "
                f"total_amount={created.total_amount}, request_id={request_id}"
            )
            
            return created
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(
                f"Booking creation failed with exception. "
                f"listing_id={booking_data.listing_id}, guest_id={guest_id}, "
                f"request_id={request_id}, error={str(e)}",
                exc_info=True
            )
            await uow.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking"
            )
    
    @staticmethod
    async def get_booking_by_id(
        uow: IUnitOfWork,
        booking_id: ID
    ) -> Optional[BookingEntity]:
        """Get a booking by its ID."""
        return await uow.bookings.get_by_id(booking_id)
    
    @staticmethod
    async def get_booking_by_number(
        uow: IUnitOfWork,
        booking_number: str
    ) -> Optional[BookingEntity]:
        """Get a booking by its booking number."""
        return await uow.bookings.get_by_booking_number(booking_number)
    
    @staticmethod
    async def get_guest_bookings(
        uow: IUnitOfWork,
        guest_id: ID,
        skip: int = 0,
        limit: int = 100
    ) -> list[BookingEntity]:
        """Get bookings for a specific guest (paginated)."""
        return await uow.bookings.get_by_guest(guest_id, skip=skip, limit=limit)
    
    @staticmethod
    async def cancel_booking(
        uow: IUnitOfWork,
        booking_id: ID,
        user_id: ID,
        reason: Optional[str] = None
    ) -> BookingEntity:
        """Cancel a booking if the user is authorized and rules allow it."""
        booking = await uow.bookings.get_by_id(booking_id)
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check authorization
        if booking.guest_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this booking"
            )
        
        # Use domain logic
        if not booking.can_be_cancelled():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking cannot be cancelled"
            )
        
        # Store old status for analytics
        old_status = booking.status
        
        # Update booking
        booking.status = BookingStatus.CANCELLED.value
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = reason
        
        updated = await uow.bookings.update(booking)
        await uow.commit()
        
        # Track analytics event
        try:
            from app.modules.analytics.service import AnalyticsService
            await AnalyticsService.track_event(
                db=uow.db,
                user_id=booking.guest_id,
                event_name="booking_status_changed",
                source="api",
                payload={
                    "booking_id": str(booking_id),
                    "old_status": old_status,
                    "new_status": BookingStatus.CANCELLED.value,
                    "changed_by": str(user_id),
                    "cancellation_reason": reason
                }
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to track booking cancellation analytics: {e}")
        
        # Send notifications
        try:
            from app.modules.notifications.service import NotificationService
            await NotificationService.booking_cancelled(
                db=uow.db,
                booking_id=booking_id,
                guest_id=booking.guest_id,
                host_id=booking.listing.host_id if hasattr(booking, 'listing') and booking.listing else None,
                cancelled_by=user_id,
                reason=reason
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send booking cancellation notification: {e}")
        
        # Emit WebSocket event to host dashboard
        try:
            from app.modules.bookings.models import Booking as BookingModel
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload
            result = await uow.db.execute(
                select(BookingModel)
                .where(BookingModel.id == booking_id)
                .options(selectinload(BookingModel.listing))
            )
            booking_model = result.scalar_one_or_none()
            if booking_model and booking_model.listing:
                from app.infrastructure.websocket.manager import manager
                await manager.send_to_room(
                    {
                        "type": "booking_updated",
                        "booking_id": str(booking_id),
                        "status": BookingStatus.CANCELLED.value,
                        "booking_number": booking_model.booking_number
                    },
                    room_id=f"host_dashboard_{booking_model.listing.host_id}"
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to emit WebSocket event for cancellation: {e}")
        
        return updated
    
    @staticmethod
    async def confirm_booking(
        db: AsyncSession,
        booking_id: ID,
        host_id: ID
    ):
        """Confirm a booking on behalf of the host.
        
        CRITICAL: Uses row-level locking to prevent race conditions.
        """
        import logging
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.bookings.models import Booking as BookingModel
        from app.modules.listings.models import Listing
        
        logger = logging.getLogger(__name__)
        
        # CRITICAL: Lock booking row to prevent concurrent modifications
        result = await db.execute(
            select(BookingModel)
            .where(BookingModel.id == booking_id)
            .with_for_update(nowait=True)
            .options(selectinload(BookingModel.listing))
        )
        booking = result.scalar_one_or_none()
        
        if not booking:
            logger.warning(
                f"Booking confirmation failed: Booking not found. "
                f"booking_id={booking_id}, host_id={host_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Verify host owns the listing
        listing = await db.execute(
            select(Listing).where(Listing.id == booking.listing_id)
        )
        listing_obj = listing.scalar_one_or_none()
        
        if not listing_obj or listing_obj.host_id != host_id:
            logger.warning(
                f"Booking confirmation failed: Host not authorized. "
                f"booking_id={booking_id}, host_id={host_id}, listing_host_id={listing_obj.host_id if listing_obj else None}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to confirm this booking"
            )
        
        # Check if booking can be confirmed
        if booking.status != BookingStatus.PENDING.value:
            logger.warning(
                f"Booking confirmation failed: Invalid status. "
                f"booking_id={booking_id}, current_status={booking.status}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Booking cannot be confirmed. Current status: {booking.status}"
            )
        
        # Store old status for analytics
        old_status = booking.status
        
        # Update booking status
        booking.status = BookingStatus.CONFIRMED.value
        booking.confirmed_at = datetime.utcnow()
        
        await db.flush()
        await db.refresh(booking)
        
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
                    "new_status": BookingStatus.CONFIRMED.value,
                    "changed_by": str(host_id)
                }
            )
        except Exception as e:
            logger.warning(f"Failed to track booking status change analytics: {e}")
        
        # Send notifications
        try:
            from app.modules.notifications.service import NotificationService
            await NotificationService.booking_confirmed(
                db=db,
                booking_id=booking_id,
                guest_id=booking.guest_id,
                host_id=host_id
            )
        except Exception as e:
            logger.warning(f"Failed to send booking confirmed notification: {e}")
        
        # Emit WebSocket event to host dashboard
        try:
            from app.infrastructure.websocket.manager import manager
            await manager.send_to_room(
                {
                    "type": "booking_updated",
                    "booking_id": str(booking_id),
                    "status": BookingStatus.CONFIRMED.value,
                    "booking_number": booking.booking_number
                },
                room_id=f"host_dashboard_{host_id}"
            )
        except Exception as e:
            logger.warning(f"Failed to emit WebSocket event: {e}")
        
        logger.info(
            f"Booking confirmed successfully. "
            f"booking_id={booking_id}, booking_number={booking.booking_number}, host_id={host_id}"
        )
        
        return booking