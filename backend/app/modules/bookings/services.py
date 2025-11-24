"""
خدمات الحجوزات - Booking Services
Using Repository Pattern and Domain Entities
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from decimal import Decimal
import secrets
from fastapi import HTTPException, status

from app.repositories.unit_of_work import IUnitOfWork
from app.domain.entities.booking import BookingEntity
from app.domain.entities.listing import ListingEntity
from app.modules.bookings.schemas import BookingCreate
from app.modules.bookings.models import BookingStatus, PaymentStatus
from app.core.id import generate_typed_id, ID


class BookingService:
    """خدمة الحجوزات - Booking service using repositories"""
    
    @staticmethod
    def generate_booking_number() -> str:
        """إنشاء رقم حجز فريد - Generate unique booking number"""
        return f"BK{secrets.token_urlsafe(8).upper()}"
    
    @staticmethod
    async def check_listing_availability(
        uow: IUnitOfWork,
        listing_id: ID,
        check_in: datetime,
        check_out: datetime
    ) -> bool:
        """التحقق من توفر القائمة - Check listing availability"""
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
        """حساب سعر الحجز - Calculate booking price"""
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
            # TODO: Implement coupon logic
            pass
        
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
        guest_id: ID
    ) -> BookingEntity:
        """إنشاء حجز جديد - Create new booking"""
        # Get listing
        listing = await uow.listings.get_by_id(booking_data.listing_id)
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Use domain logic
        if not listing.is_active():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing is not active"
            )
        
        if not listing.can_be_booked():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing cannot be booked"
            )
        
        # Check availability
        is_available = await BookingService.check_listing_availability(
            uow,
            booking_data.listing_id,
            booking_data.check_in,
            booking_data.check_out
        )
        
        if not is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing not available for selected dates"
            )
        
        # Calculate price
        price_breakdown = await BookingService.calculate_booking_price(
            uow,
            booking_data.listing_id,
            booking_data.check_in,
            booking_data.check_out,
            booking_data.guests
        )
        
        # Calculate nights
        nights = (booking_data.check_out - booking_data.check_in).days
        
        # Create domain entity
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
            total_amount=price_breakdown["total"],
            payout_amount=price_breakdown["subtotal"] * Decimal("0.85"),  # 85% to host
            currency=price_breakdown["currency"],
            status=BookingStatus.PENDING.value,
            payment_status=PaymentStatus.PENDING.value,
            special_requests=booking_data.special_requests,
            guest_message=booking_data.guest_message
        )
        
        # Use domain logic
        if listing.booking_type == "instant":
            booking.status = BookingStatus.CONFIRMED.value
        
        # Save through repository
        created = await uow.bookings.create(booking)
        await uow.commit()
        
        return created
    
    @staticmethod
    async def get_booking_by_id(
        uow: IUnitOfWork,
        booking_id: ID
    ) -> Optional[BookingEntity]:
        """الحصول على حجز بالمعرف - Get booking by ID"""
        return await uow.bookings.get_by_id(booking_id)
    
    @staticmethod
    async def get_booking_by_number(
        uow: IUnitOfWork,
        booking_number: str
    ) -> Optional[BookingEntity]:
        """الحصول على حجز برقم الحجز - Get booking by booking number"""
        return await uow.bookings.get_by_booking_number(booking_number)
    
    @staticmethod
    async def get_guest_bookings(
        uow: IUnitOfWork,
        guest_id: ID,
        skip: int = 0,
        limit: int = 100
    ) -> list[BookingEntity]:
        """الحصول على حجوزات الضيف - Get guest bookings"""
        return await uow.bookings.get_by_guest(guest_id, skip=skip, limit=limit)
    
    @staticmethod
    async def cancel_booking(
        uow: IUnitOfWork,
        booking_id: ID,
        user_id: ID,
        reason: Optional[str] = None
    ) -> BookingEntity:
        """إلغاء حجز - Cancel booking"""
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
        
        # Update booking
        booking.status = BookingStatus.CANCELLED.value
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = reason
        
        updated = await uow.bookings.update(booking)
        await uow.commit()
        
        return updated
