"""
Booking Repository
"""
from typing import Optional, List
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.repositories.base import BaseRepository
from app.domain.entities.booking import BookingEntity
from app.modules.bookings.models import Booking, BookingStatus
from app.core.id import ID


class IBookingRepository:
    """Booking repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[BookingEntity]:
        """Get booking by ID"""
        pass
    
    async def get_by_booking_number(self, booking_number: str) -> Optional[BookingEntity]:
        """Get booking by booking number"""
        pass
    
    async def get_by_guest(self, guest_id: ID, skip: int = 0, limit: int = 100) -> List[BookingEntity]:
        """Get bookings by guest"""
        pass
    
    async def get_by_listing(
        self,
        listing_id: ID,
        check_in: Optional[datetime] = None,
        check_out: Optional[datetime] = None
    ) -> List[BookingEntity]:
        """Get bookings by listing with optional date range"""
        pass
    
    async def check_availability(
        self,
        listing_id: ID,
        check_in: datetime,
        check_out: datetime
    ) -> bool:
        """Check if listing is available for given dates"""
        pass
    
    async def create(self, entity: BookingEntity) -> BookingEntity:
        """Create new booking"""
        pass
    
    async def update(self, entity: BookingEntity) -> BookingEntity:
        """Update booking"""
        pass
    
    async def delete(self, id: ID) -> bool:
        """Delete booking"""
        pass


class BookingRepository(BaseRepository[BookingEntity], IBookingRepository):
    """Booking repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, Booking, BookingEntity)
    
    def _model_to_entity(self, model) -> Optional[BookingEntity]:
        """Convert SQLAlchemy model to domain entity"""
        if not model:
            return None
        
        return BookingEntity(
            id=model.id,
            booking_number=model.booking_number,
            listing_id=model.listing_id,
            guest_id=model.guest_id,
            check_in=model.check_in,
            check_out=model.check_out,
            nights=model.nights,
            guests=model.guests,
            adults=model.adults,
            children=model.children,
            infants=model.infants,
            total_amount=model.total_amount,
            payout_amount=model.payout_amount,
            currency=model.currency,
            status=model.status.value if hasattr(model.status, 'value') else str(model.status),
            payment_status=model.payment_status.value if hasattr(model.payment_status, 'value') else str(model.payment_status),
            payment_id=model.payment_id,
            special_requests=model.special_requests,
            guest_message=model.guest_message,
            cancelled_at=model.cancelled_at,
            cancellation_reason=model.cancellation_reason,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def get_by_booking_number(self, booking_number: str) -> Optional[BookingEntity]:
        """Get booking by booking number"""
        result = await self.db.execute(
            select(Booking).where(Booking.booking_number == booking_number)
        )
        model = result.scalar_one_or_none()
        return self._model_to_entity(model) if model else None
    
    async def get_by_guest(self, guest_id: ID, skip: int = 0, limit: int = 100) -> List[BookingEntity]:
        """Get bookings by guest"""
        query = select(Booking).where(
            Booking.guest_id == guest_id
        ).offset(skip).limit(limit).order_by(Booking.created_at.desc())
        
        result = await self.db.execute(query)
        models = result.scalars().all()
        return [self._model_to_entity(model) for model in models]
    
    async def get_by_listing(
        self,
        listing_id: ID,
        check_in: Optional[datetime] = None,
        check_out: Optional[datetime] = None
    ) -> List[BookingEntity]:
        """Get bookings by listing with optional date range"""
        query = select(Booking).where(Booking.listing_id == listing_id)
        
        if check_in and check_out:
            query = query.where(
                or_(
                    and_(
                        Booking.check_in <= check_in,
                        Booking.check_out > check_in
                    ),
                    and_(
                        Booking.check_in < check_out,
                        Booking.check_out >= check_out
                    ),
                    and_(
                        Booking.check_in >= check_in,
                        Booking.check_out <= check_out
                    )
                )
            )
        
        result = await self.db.execute(query)
        models = result.scalars().all()
        return [self._model_to_entity(model) for model in models]
    
    async def check_availability(
        self,
        listing_id: ID,
        check_in: datetime,
        check_out: datetime
    ) -> bool:
        """Check if listing is available for given dates"""
        overlapping = await self.db.execute(
            select(Booking).where(
                Booking.listing_id == listing_id,
                Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.PENDING.value]),
                or_(
                    and_(
                        Booking.check_in <= check_in,
                        Booking.check_out > check_in
                    ),
                    and_(
                        Booking.check_in < check_out,
                        Booking.check_out >= check_out
                    ),
                    and_(
                        Booking.check_in >= check_in,
                        Booking.check_out <= check_out
                    )
                )
            )
        )
        
        return overlapping.scalar_one_or_none() is None

