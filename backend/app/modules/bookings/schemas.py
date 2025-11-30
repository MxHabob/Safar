"""
Schemas للحجوزات - Booking Schemas
Enhanced with new features
"""
from datetime import date, datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.modules.bookings.models import BookingStatus, PaymentStatus, PaymentMethod
from app.core.id import ID


class BookingCreate(BaseModel):
    """Schema لإنشاء حجز - Create booking schema"""
    listing_id: ID
    check_in: datetime
    check_out: datetime
    guests: int = Field(default=1, ge=1)
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0)
    special_requests: Optional[str] = None
    guest_message: Optional[str] = None
    coupon_code: Optional[str] = None
    
    @field_validator('check_in', 'check_out')
    @classmethod
    def validate_datetime_not_past(cls, v: datetime) -> datetime:
        """Validate that dates are not in the past"""
        if v.tzinfo is None:
            # If no timezone, assume UTC
            from datetime import timezone
            v = v.replace(tzinfo=timezone.utc)
        
        now = datetime.now(v.tzinfo)
        if v < now:
            raise ValueError(f"Date cannot be in the past. Provided: {v}, Current: {now}")
        return v
    
    @model_validator(mode='after')
    def validate_booking_data(self):
        """Validate booking data including dates and guest counts"""
        from datetime import timezone
        from app.core.config import get_settings
        
        settings = get_settings()
        check_in = self.check_in
        check_out = self.check_out
        
        # Ensure timezone-aware
        if check_in.tzinfo is None:
            check_in = check_in.replace(tzinfo=timezone.utc)
        if check_out.tzinfo is None:
            check_out = check_out.replace(tzinfo=timezone.utc)
        
        # CRITICAL: check_out must be after check_in
        if check_out <= check_in:
            raise ValueError(
                f"check_out ({check_out}) must be after check_in ({check_in})"
            )
        
        # Validate minimum stay (at least 1 night)
        nights = (check_out - check_in).days
        if nights < 1:
            raise ValueError(
                f"Booking must be for at least 1 night. "
                f"Duration: {check_out - check_in}"
            )
        
        # Validate maximum booking window (from config)
        if nights > settings.booking_max_window_days:
            raise ValueError(
                f"Booking cannot exceed {settings.booking_max_window_days} days. "
                f"Requested: {nights} nights"
            )
        
        # Validate guest counts consistency
        total_guests = self.adults + self.children + self.infants
        if self.guests != total_guests:
            raise ValueError(
                f"Total guests ({self.guests}) must equal adults ({self.adults}) + "
                f"children ({self.children}) + infants ({self.infants}) = {total_guests}"
            )
        
        # Note: Minimum/maximum advance booking validation is handled in service layer
        # for business logic flexibility (can vary by listing type, etc.)
        
        return self


class BookingUpdate(BaseModel):
    """Schema لتحديث حجز - Update booking schema"""
    special_requests: Optional[str] = None
    guest_message: Optional[str] = None


class BookingTimelineEventResponse(BaseModel):
    """Schema لحدث الجدول الزمني - Timeline event response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    status: str
    payload: Optional[dict] = None
    created_at: datetime


class BookingResponse(BaseModel):
    """Schema لاستجابة الحجز - Booking response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    booking_number: str
    listing_id: ID
    guest_id: ID
    check_in: datetime
    check_out: datetime
    nights: int
    guests: int
    adults: int
    children: int
    infants: int
    total_amount: float
    payout_amount: Optional[float] = None
    currency: str
    fees: Optional[dict] = None
    status: str
    payment_status: str
    payment_id: Optional[int] = None
    special_requests: Optional[str] = None
    guest_message: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    timeline_events: List[BookingTimelineEventResponse] = []
    created_at: datetime
    updated_at: datetime


class BookingListResponse(BaseModel):
    """Schema لقائمة الحجوزات - Booking list response"""
    items: List[BookingResponse]
    total: int
    skip: int
    limit: int


class BookingCancel(BaseModel):
    """Schema لإلغاء حجز - Cancel booking schema"""
    cancellation_reason: Optional[str] = None


class PaymentMethodResponse(BaseModel):
    """Schema لطريقة الدفع - Payment method response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    provider: str
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: bool


class PaymentResponse(BaseModel):
    """Schema لاستجابة الدفع - Payment response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    booking_id: Optional[ID] = None
    processor: str
    processor_ref: Optional[str] = None
    status: str
    amount: float
    currency: str
    captured_at: Optional[datetime] = None
    created_at: datetime


class PayoutResponse(BaseModel):
    """Schema لاستجابة الدفع للمضيف - Payout response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    host_profile_id: int
    booking_id: Optional[ID] = None
    status: str
    amount: float
    currency: str
    destination: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
