"""
Admin API schemas for request/response models.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.modules.users.models import UserRole, UserStatus
from app.modules.listings.models import ListingStatus
from app.modules.bookings.models import BookingStatus, PaymentMethodType, PaymentStatus
from app.core.id import ID


# ============================================================================
# User Management Schemas
# ============================================================================

class AdminUserUpdate(BaseModel):
    """Schema for admin to update user."""
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None


class AdminUserResponse(BaseModel):
    """Admin view of user with additional admin fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: UserRole
    roles: List[str] = Field(default_factory=list)
    status: UserStatus
    is_active: bool
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    booking_count: Optional[int] = None
    listing_count: Optional[int] = None


class AdminUserListResponse(BaseModel):
    """Paginated list of users for admin."""
    items: List[AdminUserResponse]
    total: int
    skip: int
    limit: int


class AdminUserStatsResponse(BaseModel):
    """User statistics for admin dashboard."""
    total_users: int
    active_users: int
    suspended_users: int
    pending_verification: int
    by_role: Dict[str, int]
    recent_signups: int  # Last 7 days


# ============================================================================
# Dashboard Schemas
# ============================================================================

class DashboardMetricsResponse(BaseModel):
    """Admin dashboard metrics."""
    period: Dict[str, str]  # start_date, end_date
    bookings: Dict[str, Any]
    revenue: Dict[str, float]
    users: Dict[str, int]
    listings: Dict[str, Any]


class BookingTrendDataPoint(BaseModel):
    """Single data point for booking trends."""
    date: str
    bookings: int
    revenue: float
    completed: int


class BookingTrendsResponse(BaseModel):
    """Booking trends over time."""
    trends: List[BookingTrendDataPoint]
    period_days: int


class PopularDestinationResponse(BaseModel):
    """Popular destination data."""
    city: str
    country: str
    bookings: int
    avg_revenue: float


class PopularDestinationsResponse(BaseModel):
    """List of popular destinations."""
    destinations: List[PopularDestinationResponse]
    period_days: int


# ============================================================================
# Listings Management Schemas
# ============================================================================

class AdminListingResponse(BaseModel):
    """Admin view of listing."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    title: str
    slug: str
    host_id: ID
    status: ListingStatus
    city: Optional[str] = None
    country: Optional[str] = None
    price_per_night: float
    rating: Optional[float] = None
    review_count: int
    created_at: datetime
    updated_at: datetime
    
    @model_validator(mode='before')
    @classmethod
    def map_base_price_to_price_per_night(cls, data: Any) -> Any:
        """Map base_price to price_per_night for compatibility."""
        if isinstance(data, dict):
            if 'base_price' in data and 'price_per_night' not in data:
                data['price_per_night'] = float(data['base_price']) if data['base_price'] is not None else 0.0
        elif hasattr(data, 'base_price'):
            # For SQLAlchemy models: if price_per_night property doesn't exist or isn't accessible,
            # map from base_price
            if not hasattr(data, 'price_per_night') or not isinstance(getattr(type(data), 'price_per_night', None), property):
                base_price = getattr(data, 'base_price', None)
                if base_price is not None:
                    setattr(data, 'price_per_night', float(base_price))
                else:
                    setattr(data, 'price_per_night', 0.0)
        return data


class AdminListingListResponse(BaseModel):
    """Paginated list of listings for admin."""
    items: List[AdminListingResponse]
    total: int
    skip: int
    limit: int


class AdminListingStatsResponse(BaseModel):
    """Listing statistics for admin."""
    total_listings: int
    active_listings: int
    pending_listings: int
    by_type: Dict[str, int]
    by_status: Dict[str, int]


# ============================================================================
# Bookings Management Schemas
# ============================================================================

class AdminBookingResponse(BaseModel):
    """Admin view of booking."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    listing_id: ID
    guest_id: ID
    host_id: ID
    status: BookingStatus
    check_in: datetime
    check_out: datetime
    guests: int
    total_amount: float
    created_at: datetime
    
    @model_validator(mode='before')
    @classmethod
    def map_listing_host_id(cls, data: Any) -> Any:
        """Map host_id from listing relationship for compatibility."""
        if isinstance(data, dict):
            if 'listing' in data and isinstance(data['listing'], dict):
                if 'host_id' in data['listing'] and 'host_id' not in data:
                    data['host_id'] = data['listing']['host_id']
        elif hasattr(data, 'listing'):
            # For SQLAlchemy models: if host_id property doesn't exist or isn't accessible,
            # get it from the listing relationship
            if not hasattr(data, 'host_id') or not isinstance(getattr(type(data), 'host_id', None), property):
                listing = getattr(data, 'listing', None)
                if listing is not None:
                    host_id = getattr(listing, 'host_id', None)
                    if host_id is not None:
                        setattr(data, 'host_id', host_id)
        return data


class AdminBookingListResponse(BaseModel):
    """Paginated list of bookings for admin."""
    items: List[AdminBookingResponse]
    total: int
    skip: int
    limit: int


class AdminBookingStatsResponse(BaseModel):
    """Booking statistics for admin."""
    total_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    pending_bookings: int
    total_revenue: float
    avg_booking_value: float


# ============================================================================
# Payments Management Schemas
# ============================================================================

class AdminPaymentResponse(BaseModel):
    """Admin view of payment."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    booking_id: ID
    amount: float
    status: PaymentStatus
    method: Optional[PaymentMethodType] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    @model_validator(mode='before')
    @classmethod
    def map_payment_method_to_method(cls, data: Any) -> Any:
        """Map payment_method enum to method field, handling relationship name conflict."""
        if isinstance(data, dict):
            # For dict input, map payment_method to method
            if 'payment_method' in data and 'method' not in data:
                data['method'] = data['payment_method']
        elif hasattr(data, '_sa_instance_state'):
            # For SQLAlchemy models: convert to dict to avoid relationship conflicts
            # payment_method is the enum column, method is the relationship
            from sqlalchemy.inspection import inspect
            
            mapper = inspect(data.__class__)
            data_dict = {}
            
            # Extract all column values
            for column in mapper.columns:
                value = getattr(data, column.key, None)
                if value is not None:
                    data_dict[column.key] = value
            
            # Get payment_method enum value
            payment_method_enum = getattr(data, 'payment_method', None)
            
            # Map payment_method to method in the dict (override any relationship)
            data_dict['method'] = payment_method_enum
            
            # Ensure all required fields are present
            for key in ['id', 'booking_id', 'amount', 'status', 'created_at']:
                if key not in data_dict and hasattr(data, key):
                    data_dict[key] = getattr(data, key)
            
            # Add optional fields
            if hasattr(data, 'captured_at'):
                data_dict['completed_at'] = getattr(data, 'captured_at', None)
            
            return data_dict
        return data


class AdminPaymentListResponse(BaseModel):
    """Paginated list of payments for admin."""
    items: List[AdminPaymentResponse]
    total: int
    skip: int
    limit: int


class AdminPaymentStatsResponse(BaseModel):
    """Payment statistics for admin."""
    total_payments: int
    completed_payments: int
    pending_payments: int
    failed_payments: int
    total_amount: float
    total_refunded: float

