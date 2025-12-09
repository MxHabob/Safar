"""
Admin service layer for business logic.
Follows repository pattern and domain-driven design principles.
"""
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, desc
from sqlalchemy.orm import selectinload

from app.repositories.unit_of_work import IUnitOfWork
from app.modules.users.models import User, UserRole, UserStatus
from app.modules.listings.models import Listing, ListingStatus
from app.modules.bookings.models import Booking, BookingStatus, Payment, PaymentStatus
from app.modules.reviews.models import Review
from app.modules.analytics.service import AnalyticsService
from app.modules.admin.security import AdminSecurity
from app.core.id import ID


class AdminService:
    """Admin service for administrative operations."""
    
    # ========================================================================
    # User Management
    # ========================================================================
    
    @staticmethod
    async def list_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        role: Optional[UserRole] = None,
        status_filter: Optional[UserStatus] = None,
        search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """
        List users with optional filters.
        
        Returns:
            Tuple of (users list, total count)
        """
        # Security: Validate pagination
        AdminSecurity.validate_pagination(skip, limit)
        
        # Security: Sanitize search query
        search = AdminSecurity.sanitize_search_query(search)
        
        query = select(User)
        filters = []
        
        if role:
            filters.append(User.role == role)
        if status_filter:
            filters.append(User.status == status_filter)
        if search:
            search_filter = or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(User.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: ID
    ) -> Optional[User]:
        """Get user by ID with related data."""
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.host_profile))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: ID,
        admin_user: User,  # The admin performing the action
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        is_active: Optional[bool] = None,
        **kwargs
    ) -> User:
        """
        Update user (admin only).
        
        Security checks:
        - Prevents self-suspension
        - Prevents removing last admin
        - Validates user ID
        - Logs all changes
        """
        # Security: Validate user ID
        AdminSecurity.validate_user_id(user_id)
        
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Security: Prevent self-modification for dangerous actions
        if status == UserStatus.SUSPENDED or is_active is False:
            AdminSecurity.prevent_self_modification(
                admin_user, user_id, "suspend"
            )
        
        # Security: Check if removing last admin
        if role is not None:
            await AdminSecurity.check_last_admin(db, user, role)
            # Also prevent self-removal of admin role
            if admin_user.id == user_id and role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot remove admin role from your own account"
                )
        
        # Track changes for audit log
        changes = {}
        old_values = {}
        
        # Update fields
        if role is not None and user.role != role:
            old_values["role"] = user.role.value
            user.role = role
            changes["role"] = role.value
        
        if status is not None and user.status != status:
            old_values["status"] = user.status.value
            user.status = status
            changes["status"] = status.value
        
        if is_active is not None and user.is_active != is_active:
            old_values["is_active"] = user.is_active
            user.is_active = is_active
            changes["is_active"] = is_active
        
        # Update other fields (sanitized)
        allowed_fields = {"first_name", "last_name", "email"}
        for key, value in kwargs.items():
            if key in allowed_fields and hasattr(user, key) and value is not None:
                old_value = getattr(user, key)
                if old_value != value:
                    old_values[key] = old_value
                    setattr(user, key, value)
                    changes[key] = value
        
        await db.commit()
        await db.refresh(user)
        
        # Security: Log audit event with admin user ID
        await AnalyticsService.log_audit_event(
            db=db,
            user_id=admin_user.id,  # Track which admin made the change
            action="admin_update_user",
            resource_type="user",
            resource_id=str(user_id),
            details={
                "changes": changes,
                "old_values": old_values,
                "admin_id": str(admin_user.id),
                "admin_email": admin_user.email
            }
        )
        
        return user
    
    @staticmethod
    async def get_user_stats(db: AsyncSession) -> Dict[str, Any]:
        """Get user statistics for admin dashboard."""
        # Total users
        total_result = await db.execute(select(func.count(User.id)))
        total_users = total_result.scalar() or 0
        
        # By status
        status_result = await db.execute(
            select(
                User.status,
                func.count(User.id).label('count')
            ).group_by(User.status)
        )
        by_status = {row.status.value: row.count for row in status_result.all()}
        
        # By role
        role_result = await db.execute(
            select(
                User.role,
                func.count(User.id).label('count')
            ).group_by(User.role)
        )
        by_role = {row.role.value: row.count for row in role_result.all()}
        
        # Active users
        active_result = await db.execute(
            select(func.count(User.id)).where(User.is_active == True)
        )
        active_users = active_result.scalar() or 0
        
        # Recent signups (last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_result = await db.execute(
            select(func.count(User.id)).where(User.created_at >= week_ago)
        )
        recent_signups = recent_result.scalar() or 0
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "suspended_users": by_status.get(UserStatus.SUSPENDED.value, 0),
            "pending_verification": by_status.get(UserStatus.PENDING_VERIFICATION.value, 0),
            "by_role": by_role,
            "recent_signups": recent_signups
        }
    
    # ========================================================================
    # Dashboard & Analytics
    # ========================================================================
    
    @staticmethod
    async def get_dashboard_metrics(
        db: AsyncSession,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive dashboard metrics for admin.
        Uses AnalyticsService but ensures admin-level aggregation.
        """
        return await AnalyticsService.get_dashboard_metrics(
            db=db,
            user_id=None,  # Admin view - no user filter
            start_date=start_date,
            end_date=end_date
        )
    
    @staticmethod
    async def get_booking_trends(
        db: AsyncSession,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get booking trends for admin dashboard."""
        return await AnalyticsService.get_booking_trends(
            db=db,
            days=days,
            user_id=None  # Admin view
        )
    
    @staticmethod
    async def get_popular_destinations(
        db: AsyncSession,
        limit: int = 10,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get popular destinations for admin dashboard."""
        return await AnalyticsService.get_popular_destinations(
            db=db,
            limit=limit,
            days=days
        )
    
    # ========================================================================
    # Listings Management
    # ========================================================================
    
    @staticmethod
    async def list_listings(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        status: Optional[ListingStatus] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Listing], int]:
        """List all listings (admin view)."""
        # Security: Validate pagination
        AdminSecurity.validate_pagination(skip, limit)
        
        # Security: Sanitize search query
        search = AdminSecurity.sanitize_search_query(search)
        
        query = select(Listing)
        filters = []
        
        if status:
            filters.append(Listing.status == status)
        if search:
            search_filter = or_(
                Listing.title.ilike(f"%{search}%"),
                Listing.city.ilike(f"%{search}%"),
                Listing.country.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(Listing.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        listings = result.scalars().all()
        
        return list(listings), total
    
    @staticmethod
    async def get_listing_by_id(
        db: AsyncSession,
        listing_id: ID
    ) -> Optional[Listing]:
        """Get listing by ID with related data for admin."""
        result = await db.execute(
            select(Listing)
            .where(Listing.id == listing_id)
            .options(selectinload(Listing.host))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_listing_stats(db: AsyncSession) -> Dict[str, Any]:
        """Get listing statistics for admin."""
        # Total listings
        total_result = await db.execute(select(func.count(Listing.id)))
        total_listings = total_result.scalar() or 0
        
        # By status
        status_result = await db.execute(
            select(
                Listing.status,
                func.count(Listing.id).label('count')
            ).group_by(Listing.status)
        )
        by_status = {row.status.value: row.count for row in status_result.all()}
        
        # By type
        type_result = await db.execute(
            select(
                Listing.listing_type,
                func.count(Listing.id).label('count')
            ).group_by(Listing.listing_type)
        )
        by_type = {row.listing_type.value: row.count for row in type_result.all()}
        
        return {
            "total_listings": total_listings,
            "active_listings": by_status.get(ListingStatus.ACTIVE.value, 0),
            "pending_listings": by_status.get(ListingStatus.PENDING.value, 0),
            "by_type": by_type,
            "by_status": by_status
        }
    
    # ========================================================================
    # Bookings Management
    # ========================================================================
    
    @staticmethod
    async def list_bookings(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        status: Optional[BookingStatus] = None
    ) -> Tuple[List[Booking], int]:
        """List all bookings (admin view)."""
        # Security: Validate pagination
        AdminSecurity.validate_pagination(skip, limit)
        
        query = select(Booking)
        filters = []
        
        if status:
            filters.append(Booking.status == status)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(Booking.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        bookings = result.scalars().all()
        
        return list(bookings), total
    
    @staticmethod
    async def get_booking_by_id(
        db: AsyncSession,
        booking_id: ID
    ) -> Optional[Booking]:
        """Get booking by ID with related data for admin."""
        result = await db.execute(
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                selectinload(Booking.listing),
                selectinload(Booking.guest)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_booking_stats(db: AsyncSession) -> Dict[str, Any]:
        """Get booking statistics for admin."""
        # Total bookings
        total_result = await db.execute(select(func.count(Booking.id)))
        total_bookings = total_result.scalar() or 0
        
        # By status
        status_result = await db.execute(
            select(
                Booking.status,
                func.count(Booking.id).label('count'),
                func.sum(Booking.total_amount).label('revenue')
            ).group_by(Booking.status)
        )
        by_status = {}
        total_revenue = 0.0
        for row in status_result.all():
            by_status[row.status.value] = row.count
            if row.status == BookingStatus.COMPLETED:
                total_revenue += float(row.revenue or 0)
        
        # Average booking value
        avg_result = await db.execute(
            select(func.avg(Booking.total_amount))
        )
        avg_booking_value = float(avg_result.scalar() or 0)
        
        return {
            "total_bookings": total_bookings,
            "completed_bookings": by_status.get(BookingStatus.COMPLETED.value, 0),
            "cancelled_bookings": by_status.get(BookingStatus.CANCELLED.value, 0),
            "pending_bookings": by_status.get(BookingStatus.PENDING.value, 0),
            "total_revenue": total_revenue,
            "avg_booking_value": avg_booking_value
        }
    
    # ========================================================================
    # Payments Management
    # ========================================================================
    
    @staticmethod
    async def list_payments(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        status: Optional[PaymentStatus] = None
    ) -> Tuple[List[Payment], int]:
        """List all payments (admin view)."""
        # Security: Validate pagination
        AdminSecurity.validate_pagination(skip, limit)
        
        query = select(Payment)
        filters = []
        
        if status:
            filters.append(Payment.status == status)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(Payment.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        payments = result.scalars().all()
        
        return list(payments), total
    
    @staticmethod
    async def get_payment_by_id(
        db: AsyncSession,
        payment_id: ID
    ) -> Optional[Payment]:
        """Get payment by ID with related data for admin."""
        result = await db.execute(
            select(Payment)
            .where(Payment.id == payment_id)
            .options(selectinload(Payment.booking))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_payment_stats(db: AsyncSession) -> Dict[str, Any]:
        """Get payment statistics for admin."""
        # Total payments
        total_result = await db.execute(select(func.count(Payment.id)))
        total_payments = total_result.scalar() or 0
        
        # By status
        status_result = await db.execute(
            select(
                Payment.status,
                func.count(Payment.id).label('count'),
                func.sum(Payment.amount).label('total')
            ).group_by(Payment.status)
        )
        by_status = {}
        total_amount = 0.0
        total_refunded = 0.0
        
        for row in status_result.all():
            by_status[row.status.value] = row.count
            if row.status == PaymentStatus.COMPLETED:
                total_amount += float(row.total or 0)
            elif row.status == PaymentStatus.REFUNDED:
                total_refunded += float(row.total or 0)
        
        return {
            "total_payments": total_payments,
            "completed_payments": by_status.get(PaymentStatus.COMPLETED.value, 0),
            "pending_payments": by_status.get(PaymentStatus.PENDING.value, 0),
            "failed_payments": by_status.get(PaymentStatus.FAILED.value, 0),
            "total_amount": total_amount,
            "total_refunded": total_refunded
        }

