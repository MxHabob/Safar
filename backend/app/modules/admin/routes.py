"""
Admin API routes.
All endpoints require admin or super_admin role with 2FA.
"""
from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.dependencies import require_admin
from app.modules.users.models import User, UserRole, UserStatus
from app.modules.listings.models import ListingStatus
from app.modules.bookings.models import BookingStatus
from app.modules.bookings.models import PaymentStatus
from app.modules.admin.services import AdminService
from app.modules.analytics.service import AnalyticsService
from app.modules.admin.schemas import (
    AdminUserUpdate,
    AdminUserResponse,
    AdminUserListResponse,
    AdminUserStatsResponse,
    DashboardMetricsResponse,
    BookingTrendsResponse,
    PopularDestinationsResponse,
    AdminListingResponse,
    AdminListingListResponse,
    AdminListingStatsResponse,
    AdminBookingResponse,
    AdminBookingListResponse,
    AdminBookingStatsResponse,
    AdminPaymentResponse,
    AdminPaymentListResponse,
    AdminPaymentStatsResponse,
)
from app.core.id import ID

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================================
# User Management
# ============================================================================

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status_filter: Optional[UserStatus] = Query(None, description="Filter by status", alias="status"),
    search: Optional[str] = Query(None, description="Search by name/email"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    List all users with optional filters.
    Only accessible to admins.
    """
    users, total = await AdminService.list_users(
        db=db,
        skip=skip,
        limit=limit,
        role=role,
        status_filter=status_filter,
        search=search
    )
    
    # Convert to response models
    user_responses = [
        AdminUserResponse.model_validate(user) for user in users
    ]
    
    return AdminUserListResponse(
        items=user_responses,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get user details by ID.
    Only accessible to admins.
    """
    user = await AdminService.get_user_by_id(db=db, user_id=user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return AdminUserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: ID,
    user_update: AdminUserUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update user (role, status, etc.).
    Only accessible to admins.
    
    Security:
    - Prevents self-suspension
    - Prevents removing last admin
    - All changes are audit logged
    """
    updated_user = await AdminService.update_user(
        db=db,
        user_id=user_id,
        admin_user=current_user,  # Pass admin user for security checks
        role=user_update.role,
        status=user_update.status,
        is_active=user_update.is_active,
        first_name=user_update.first_name,
        last_name=user_update.last_name,
        email=user_update.email
    )
    
    return AdminUserResponse.model_validate(updated_user)


@router.post("/users/{user_id}/suspend", response_model=AdminUserResponse)
async def suspend_user(
    user_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Suspend a user account.
    Only accessible to admins.
    
    Security:
    - Prevents self-suspension
    - Audit logged
    """
    updated_user = await AdminService.update_user(
        db=db,
        user_id=user_id,
        admin_user=current_user,
        status=UserStatus.SUSPENDED,
        is_active=False
    )
    
    # Log specific suspend action
    await AnalyticsService.log_audit_event(
        db=db,
        user_id=current_user.id,
        action="admin_suspend_user",
        resource_type="user",
        resource_id=str(user_id),
        details={"admin_id": str(current_user.id), "admin_email": current_user.email}
    )
    
    return AdminUserResponse.model_validate(updated_user)


@router.post("/users/{user_id}/activate", response_model=AdminUserResponse)
async def activate_user(
    user_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Activate a user account.
    Only accessible to admins.
    
    Security:
    - Audit logged
    """
    updated_user = await AdminService.update_user(
        db=db,
        user_id=user_id,
        admin_user=current_user,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    
    # Log specific activate action
    await AnalyticsService.log_audit_event(
        db=db,
        user_id=current_user.id,
        action="admin_activate_user",
        resource_type="user",
        resource_id=str(user_id),
        details={"admin_id": str(current_user.id), "admin_email": current_user.email}
    )
    
    return AdminUserResponse.model_validate(updated_user)


@router.get("/users/stats", response_model=AdminUserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get user statistics for admin dashboard.
    Only accessible to admins.
    """
    stats = await AdminService.get_user_stats(db=db)
    return AdminUserStatsResponse(**stats)


# ============================================================================
# Dashboard & Analytics
# ============================================================================

@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get comprehensive dashboard metrics for admin.
    Only accessible to admins.
    """
    metrics = await AdminService.get_dashboard_metrics(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
    return DashboardMetricsResponse(**metrics)


@router.get("/dashboard/booking-trends", response_model=BookingTrendsResponse)
async def get_booking_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get booking trends over time for admin dashboard.
    Only accessible to admins.
    """
    trends = await AdminService.get_booking_trends(db=db, days=days)
    return BookingTrendsResponse(trends=trends, period_days=days)


@router.get("/dashboard/popular-destinations", response_model=PopularDestinationsResponse)
async def get_popular_destinations(
    limit: int = Query(10, ge=1, le=50, description="Number of destinations"),
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get most popular destinations for admin dashboard.
    Only accessible to admins.
    """
    destinations = await AdminService.get_popular_destinations(
        db=db,
        limit=limit,
        days=days
    )
    return PopularDestinationsResponse(
        destinations=destinations,
        period_days=days
    )


# ============================================================================
# Listings Management
# ============================================================================

@router.get("/listings", response_model=AdminListingListResponse)
async def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[ListingStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search listings"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    List all listings (admin view).
    Only accessible to admins.
    """
    from app.modules.admin.schemas import AdminListingResponse
    
    listings, total = await AdminService.list_listings(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        search=search
    )
    
    listing_responses = [
        AdminListingResponse.model_validate(listing) for listing in listings
    ]
    
    return AdminListingListResponse(
        items=listing_responses,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/listings/{listing_id}", response_model=AdminListingResponse)
async def get_listing(
    listing_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get listing details by ID.
    Only accessible to admins.
    """
    listing = await AdminService.get_listing_by_id(db=db, listing_id=listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    return AdminListingResponse.model_validate(listing)


@router.get("/listings/stats", response_model=AdminListingStatsResponse)
async def get_listing_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get listing statistics for admin.
    Only accessible to admins.
    """
    stats = await AdminService.get_listing_stats(db=db)
    return AdminListingStatsResponse(**stats)


# ============================================================================
# Bookings Management
# ============================================================================

@router.get("/bookings", response_model=AdminBookingListResponse)
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[BookingStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    List all bookings (admin view).
    Only accessible to admins.
    """
    from app.modules.admin.schemas import AdminBookingResponse
    
    bookings, total = await AdminService.list_bookings(
        db=db,
        skip=skip,
        limit=limit,
        status=status
    )
    
    booking_responses = [
        AdminBookingResponse.model_validate(booking) for booking in bookings
    ]
    
    return AdminBookingListResponse(
        items=booking_responses,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/bookings/{booking_id}", response_model=AdminBookingResponse)
async def get_booking(
    booking_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get booking details by ID.
    Only accessible to admins.
    """
    booking = await AdminService.get_booking_by_id(db=db, booking_id=booking_id)
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    return AdminBookingResponse.model_validate(booking)


@router.get("/bookings/stats", response_model=AdminBookingStatsResponse)
async def get_booking_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get booking statistics for admin.
    Only accessible to admins.
    """
    stats = await AdminService.get_booking_stats(db=db)
    return AdminBookingStatsResponse(**stats)


# ============================================================================
# Payments Management
# ============================================================================

@router.get("/payments", response_model=AdminPaymentListResponse)
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[PaymentStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    List all payments (admin view).
    Only accessible to admins.
    """
    from app.modules.admin.schemas import AdminPaymentResponse
    
    payments, total = await AdminService.list_payments(
        db=db,
        skip=skip,
        limit=limit,
        status=status
    )
    
    payment_responses = [
        AdminPaymentResponse.model_validate(payment) for payment in payments
    ]
    
    return AdminPaymentListResponse(
        items=payment_responses,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/payments/{payment_id}", response_model=AdminPaymentResponse)
async def get_payment(
    payment_id: ID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get payment details by ID.
    Only accessible to admins.
    """
    payment = await AdminService.get_payment_by_id(db=db, payment_id=payment_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return AdminPaymentResponse.model_validate(payment)


@router.get("/payments/stats", response_model=AdminPaymentStatsResponse)
async def get_payment_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_read_db)
) -> Any:
    """
    Get payment statistics for admin.
    Only accessible to admins.
    """
    stats = await AdminService.get_payment_stats(db=db)
    return AdminPaymentStatsResponse(**stats)

