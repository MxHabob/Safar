"""
Admin API schemas for request/response models.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.modules.users.models import UserRole, UserStatus
from app.modules.listings.models import ListingStatus
from app.modules.bookings.models import BookingStatus
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
    roles: List[str] = []
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
    status: str
    method: str
    created_at: datetime
    completed_at: Optional[datetime] = None


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

