"""
Booking Domain Entity
"""
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.domain.base import DomainEntity
from app.core.id import ID


class BookingEntity(DomainEntity):
    """Booking domain entity"""
    
    def __init__(
        self,
        id: Optional[ID] = None,
        booking_number: str = "",
        listing_id: ID = None,
        guest_id: ID = None,
        check_in: datetime = None,
        check_out: datetime = None,
        nights: int = 0,
        guests: int = 1,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        total_amount: Decimal = Decimal("0"),
        payout_amount: Optional[Decimal] = None,
        currency: str = "USD",
        status: str = "pending",
        payment_status: str = "pending",
        payment_id: Optional[ID] = None,
        special_requests: Optional[str] = None,
        guest_message: Optional[str] = None,
        cancelled_at: Optional[datetime] = None,
        cancellation_reason: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        **kwargs
    ):
        super().__init__(id, created_at, updated_at)
        self.booking_number = booking_number
        self.listing_id = listing_id
        self.guest_id = guest_id
        self.check_in = check_in
        self.check_out = check_out
        self.nights = nights
        self.guests = guests
        self.adults = adults
        self.children = children
        self.infants = infants
        self.total_amount = total_amount
        self.payout_amount = payout_amount
        self.currency = currency
        self.status = status
        self.payment_status = payment_status
        self.payment_id = payment_id
        self.special_requests = special_requests
        self.guest_message = guest_message
        self.cancelled_at = cancelled_at
        self.cancellation_reason = cancellation_reason
    
    def is_confirmed(self) -> bool:
        """Check if booking is confirmed"""
        return self.status == "confirmed"
    
    def is_pending(self) -> bool:
        """Check if booking is pending"""
        return self.status == "pending"
    
    def is_cancelled(self) -> bool:
        """Check if booking is cancelled"""
        return self.status == "cancelled"
    
    def is_paid(self) -> bool:
        """Check if booking is paid"""
        return self.payment_status == "captured"
    
    def can_be_cancelled(self) -> bool:
        """Check if booking can be cancelled"""
        return self.status in ["pending", "confirmed"] and not self.is_cancelled()
    
    def is_overlapping(self, other_check_in: datetime, other_check_out: datetime) -> bool:
        """Check if booking overlaps with given dates"""
        return (
            (self.check_in <= other_check_in < self.check_out) or
            (self.check_in < other_check_out <= self.check_out) or
            (other_check_in <= self.check_in and other_check_out >= self.check_out)
        )

