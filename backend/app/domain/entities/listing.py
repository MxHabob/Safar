"""
Listing Domain Entity
"""
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.domain.base import DomainEntity
from app.core.id import ID


class ListingEntity(DomainEntity):
    """Listing domain entity"""
    
    def __init__(
        self,
        id: Optional[ID] = None,
        title: str = "",
        slug: str = "",
        summary: Optional[str] = None,
        description: Optional[str] = None,
        listing_type: str = "",
        status: str = "draft",
        host_id: Optional[ID] = None,
        host_profile_id: Optional[ID] = None,
        agency_id: Optional[ID] = None,
        address_line1: str = "",
        address_line2: Optional[str] = None,
        city: str = "",
        state: Optional[str] = None,
        country: str = "",
        postal_code: Optional[str] = None,
        latitude: Optional[Decimal] = None,
        longitude: Optional[Decimal] = None,
        capacity: int = 1,
        bedrooms: int = 0,
        beds: int = 0,
        bathrooms: Decimal = Decimal("0"),
        max_guests: int = 1,
        square_meters: Optional[int] = None,
        base_price: Decimal = Decimal("0"),
        currency: str = "USD",
        cleaning_fee: Decimal = Decimal("0"),
        service_fee: Decimal = Decimal("0"),
        security_deposit: Decimal = Decimal("0"),
        booking_type: str = "request",
        min_stay_nights: int = 1,
        max_stay_nights: Optional[int] = None,
        check_in_time: str = "15:00",
        check_out_time: str = "11:00",
        rating: Decimal = Decimal("0"),
        review_count: int = 0,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        **kwargs
    ):
        super().__init__(id, created_at, updated_at)
        self.title = title
        self.slug = slug
        self.summary = summary
        self.description = description
        self.listing_type = listing_type
        self.status = status
        self.host_id = host_id
        self.host_profile_id = host_profile_id
        self.agency_id = agency_id
        self.address_line1 = address_line1
        self.address_line2 = address_line2
        self.city = city
        self.state = state
        self.country = country
        self.postal_code = postal_code
        self.latitude = latitude
        self.longitude = longitude
        self.capacity = capacity
        self.bedrooms = bedrooms
        self.beds = beds
        self.bathrooms = bathrooms
        self.max_guests = max_guests
        self.square_meters = square_meters
        self.base_price = base_price
        self.currency = currency
        self.cleaning_fee = cleaning_fee
        self.service_fee = service_fee
        self.security_deposit = security_deposit
        self.booking_type = booking_type
        self.min_stay_nights = min_stay_nights
        self.max_stay_nights = max_stay_nights
        self.check_in_time = check_in_time
        self.check_out_time = check_out_time
        self.rating = rating
        self.review_count = review_count
    
    def is_active(self) -> bool:
        """Check if listing is active"""
        return self.status == "active"
    
    def is_draft(self) -> bool:
        """Check if listing is draft"""
        return self.status == "draft"
    
    def can_be_booked(self) -> bool:
        """Check if listing can be booked"""
        return self.is_active() and self.booking_type in ["instant", "request"]
    
    def calculate_total_price(self, nights: int) -> Decimal:
        """Calculate total price for given nights"""
        base = self.base_price * nights
        cleaning = self.cleaning_fee
        service = (base * self.service_fee) / 100 if self.service_fee else Decimal("0")
        return base + cleaning + service

