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
        
        # Handle payment_id - use payment_intent_id if payment_id doesn't exist
        payment_id = getattr(model, 'payment_id', None)
        if payment_id is None:
            payment_id = getattr(model, 'payment_intent_id', None)
        
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
            payment_id=payment_id,
            special_requests=model.special_requests,
            guest_message=model.guest_message,
            cancelled_at=model.cancelled_at,
            cancellation_reason=model.cancellation_reason,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _entity_to_model(self, entity: BookingEntity) -> Booking:
        """Convert domain entity to SQLAlchemy model
        
        NOTE: This method only creates new models. Updates are handled by the update() method.
        """
        from app.modules.bookings.models import BookingStatus, PaymentStatus
        
        # Create new model (updates are handled by update() method)
        return Booking(
            id=entity.id,
            booking_number=entity.booking_number,
            listing_id=entity.listing_id,
            guest_id=entity.guest_id,
            check_in=entity.check_in,
            check_out=entity.check_out,
            nights=entity.nights,
            guests=entity.guests,
            adults=entity.adults,
            children=entity.children,
            infants=entity.infants,
            base_price=getattr(entity, 'base_price', entity.total_amount),  # Fallback to total if not set
            cleaning_fee=getattr(entity, 'cleaning_fee', 0),
            service_fee=getattr(entity, 'service_fee', 0),
            security_deposit=getattr(entity, 'security_deposit', 0),
            discount_amount=getattr(entity, 'discount_amount', 0),
            coupon_code=getattr(entity, 'coupon_code', None),
            total_amount=entity.total_amount,
            payout_amount=entity.payout_amount,
            currency=entity.currency,
            status=entity.status,
            payment_status=entity.payment_status,
            special_requests=entity.special_requests,
            guest_message=entity.guest_message,
            cancelled_at=entity.cancelled_at,
            cancellation_reason=entity.cancellation_reason
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
        
        # Check if any overlapping bookings exist (can be multiple)
        # Use first() instead of scalar_one_or_none() since multiple rows are possible
        return overlapping.scalars().first() is None
    
    async def update(self, entity: BookingEntity) -> BookingEntity:
        """Update booking with special handling for coupon_code and discount_amount"""
        from sqlalchemy import select
        
        result = await self.db.execute(
            select(Booking).where(Booking.id == entity.id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise ValueError(f"Booking with id {entity.id} not found")
        
        # Update standard fields
        model.booking_number = entity.booking_number
        model.listing_id = entity.listing_id
        model.guest_id = entity.guest_id
        model.check_in = entity.check_in
        model.check_out = entity.check_out
        model.nights = entity.nights
        model.guests = entity.guests
        model.adults = entity.adults
        model.children = entity.children
        model.infants = entity.infants
        model.total_amount = entity.total_amount
        model.payout_amount = entity.payout_amount
        model.currency = entity.currency
        model.status = entity.status
        model.payment_status = entity.payment_status
        model.special_requests = entity.special_requests
        model.guest_message = entity.guest_message
        model.cancelled_at = entity.cancelled_at
        model.cancellation_reason = entity.cancellation_reason
        
        # Handle special fields that may not be in entity.__dict__
        if hasattr(entity, 'coupon_code'):
            model.coupon_code = entity.coupon_code
        if hasattr(entity, 'discount_amount'):
            model.discount_amount = entity.discount_amount
        if hasattr(entity, 'base_price'):
            model.base_price = entity.base_price
        if hasattr(entity, 'cleaning_fee'):
            model.cleaning_fee = entity.cleaning_fee
        if hasattr(entity, 'service_fee'):
            model.service_fee = entity.service_fee
        if hasattr(entity, 'security_deposit'):
            model.security_deposit = entity.security_deposit
        
        await self.db.flush()
        await self.db.refresh(model)
        return self._model_to_entity(model)

