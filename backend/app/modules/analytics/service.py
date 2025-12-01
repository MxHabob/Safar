"""
Enhanced analytics service.
Provides comprehensive analytics and insights.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, extract
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.analytics.models import AnalyticsEvent, AuditLog
from app.modules.bookings.models import Booking, BookingStatus, PaymentStatus
from app.modules.listings.models import Listing, ListingStatus
from app.modules.reviews.models import Review
from app.modules.users.models import User
from app.core.id import ID


class AnalyticsService:
    """Service for analytics and insights."""
    
    @staticmethod
    async def track_event(
        db: AsyncSession,
        user_id: Optional[ID],
        event_name: str,
        source: str,
        payload: Optional[Dict[str, Any]] = None
    ) -> AnalyticsEvent:
        """
        Track an analytics event.
        
        Args:
            user_id: Optional user ID
            event_name: Event name (e.g., 'listing_viewed', 'booking_created')
            source: Source of event ('web', 'mobile', 'api')
            payload: Optional event data
        
        Returns:
            AnalyticsEvent model
        """
        event = AnalyticsEvent(
            user_id=user_id,
            event_name=event_name,
            source=source,
            payload=payload or {}
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event
    
    @staticmethod
    async def get_dashboard_metrics(
        db: AsyncSession,
        user_id: Optional[ID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive dashboard metrics.
        
        Args:
            user_id: Optional user ID for user-specific metrics
            start_date: Optional start date filter
            end_date: Optional end date filter
        
        Returns:
            Dictionary with various metrics
        """
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Validate date range
        if start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before end date"
            )
        
        # Limit date range to prevent excessive queries
        max_range = timedelta(days=365)
        if (end_date - start_date) > max_range:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date range cannot exceed 365 days"
            )
        
        conditions = [
            Booking.created_at >= start_date,
            Booking.created_at <= end_date
        ]
        
        if user_id:
            conditions.append(Booking.guest_id == user_id)
        
        # Booking metrics
        booking_stats = await db.execute(
            select(
                func.count(Booking.id).label('total_bookings'),
                func.sum(case((Booking.status == BookingStatus.COMPLETED.value, 1), else_=0)).label('completed_bookings'),
                func.sum(case((Booking.status == BookingStatus.CANCELLED.value, 1), else_=0)).label('cancelled_bookings'),
                func.sum(Booking.total_amount).label('total_revenue'),
                func.avg(Booking.total_amount).label('avg_booking_value')
            )
            .where(and_(*conditions))
        )
        booking_metrics = booking_stats.first()
        
        # Payment metrics
        from app.modules.bookings.models import Payment
        payment_stats = await db.execute(
            select(
                func.count(Payment.id).label('total_payments'),
                func.sum(case((Payment.status == PaymentStatus.COMPLETED.value, Payment.amount), else_=0)).label('total_paid'),
                func.sum(case((Payment.status == PaymentStatus.REFUNDED.value, Payment.amount), else_=0)).label('total_refunded')
            )
            .join(Booking, Payment.booking_id == Booking.id)
            .where(and_(*conditions))
        )
        payment_metrics = payment_stats.first()
        
        # Listing metrics (if user is host)
        listing_metrics = {}
        if user_id:
            listing_stats = await db.execute(
                select(
                    func.count(Listing.id).label('total_listings'),
                    func.sum(case((Listing.status == ListingStatus.ACTIVE.value, 1), else_=0)).label('active_listings'),
                    func.avg(Listing.rating).label('avg_rating'),
                    func.sum(Listing.review_count).label('total_reviews')
                )
                .where(
                    and_(
                        Listing.host_id == user_id,
                        Listing.created_at >= start_date
                    )
                )
            )
            listing_metrics = listing_stats.first()._asdict() if listing_stats.first() else {}
        
        # User growth (if admin)
        user_metrics = {}
        if not user_id:  # Admin view
            user_stats = await db.execute(
                select(
                    func.count(User.id).label('total_users'),
                    func.sum(case((User.status == 'active', 1), else_=0)).label('active_users'),
                    func.sum(case((User.role == 'host', 1), else_=0)).label('hosts')
                )
                .where(User.created_at >= start_date)
            )
            user_metrics = user_stats.first()._asdict() if user_stats.first() else {}
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "bookings": {
                "total": booking_metrics.total_bookings or 0,
                "completed": booking_metrics.completed_bookings or 0,
                "cancelled": booking_metrics.cancelled_bookings or 0,
                "completion_rate": (
                    (booking_metrics.completed_bookings or 0) / (booking_metrics.total_bookings or 1) * 100
                ) if booking_metrics.total_bookings else 0
            },
            "revenue": {
                "total": float(booking_metrics.total_revenue or 0),
                "average": float(booking_metrics.avg_booking_value or 0),
                "paid": float(payment_metrics.total_paid or 0) if payment_metrics else 0,
                "refunded": float(payment_metrics.total_refunded or 0) if payment_metrics else 0
            },
            "listings": listing_metrics,
            "users": user_metrics
        }
    
    @staticmethod
    async def get_booking_trends(
        db: AsyncSession,
        days: int = 30,
        user_id: Optional[ID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get booking trends over time.
        
        Returns:
            List of daily booking statistics
        """
        # Validate inputs
        if days <= 0 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        conditions = [
            Booking.created_at >= start_date,
            Booking.created_at <= end_date
        ]
        
        if user_id:
            conditions.append(Booking.guest_id == user_id)
        
        trends = await db.execute(
            select(
                func.date(Booking.created_at).label('date'),
                func.count(Booking.id).label('bookings'),
                func.sum(Booking.total_amount).label('revenue'),
                func.sum(case((Booking.status == BookingStatus.COMPLETED.value, 1), else_=0)).label('completed')
            )
            .where(and_(*conditions))
            .group_by(func.date(Booking.created_at))
            .order_by(func.date(Booking.created_at))
        )
        
        return [
            {
                "date": row.date.isoformat(),
                "bookings": row.bookings,
                "revenue": float(row.revenue or 0),
                "completed": row.completed
            }
            for row in trends.all()
        ]
    
    @staticmethod
    async def get_popular_destinations(
        db: AsyncSession,
        limit: int = 10,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get most popular destinations based on bookings.
        """
        # Validate inputs
        if limit <= 0 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 100"
            )
        
        if days <= 0 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        popular = await db.execute(
            select(
                Listing.city,
                Listing.country,
                func.count(Booking.id).label('bookings'),
                func.avg(Booking.total_amount).label('avg_revenue')
            )
            .join(Listing, Booking.listing_id == Listing.id)
            .where(
                and_(
                    Booking.created_at >= start_date,
                    Booking.status == BookingStatus.COMPLETED.value
                )
            )
            .group_by(Listing.city, Listing.country)
            .order_by(func.count(Booking.id).desc())
            .limit(limit)
        )
        
        return [
            {
                "city": row.city,
                "country": row.country,
                "bookings": row.bookings,
                "avg_revenue": float(row.avg_revenue or 0)
            }
            for row in popular.all()
        ]
    
    @staticmethod
    async def get_user_behavior_insights(
        db: AsyncSession,
        user_id: ID
    ) -> Dict[str, Any]:
        """
        Get user behavior insights.
        """
        # Validate inputs
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Booking patterns
        booking_patterns = await db.execute(
            select(
                extract('hour', Booking.created_at).label('hour'),
                extract('dow', Booking.created_at).label('day_of_week'),
                func.count(Booking.id).label('count')
            )
            .where(Booking.guest_id == user_id)
            .group_by(
                extract('hour', Booking.created_at),
                extract('dow', Booking.created_at)
            )
        )
        
        # Preferred listing types
        preferred_types = await db.execute(
            select(
                Listing.listing_type,
                func.count(Booking.id).label('count')
            )
            .join(Listing, Booking.listing_id == Listing.id)
            .where(Booking.guest_id == user_id)
            .group_by(Listing.listing_type)
            .order_by(func.count(Booking.id).desc())
        )
        
        # Average booking value
        avg_value = await db.execute(
            select(func.avg(Booking.total_amount))
            .where(Booking.guest_id == user_id)
        )
        
        return {
            "booking_patterns": [
                {
                    "hour": row.hour,
                    "day_of_week": row.day_of_week,
                    "count": row.count
                }
                for row in booking_patterns.all()
            ],
            "preferred_listing_types": [
                {
                    "type": row.listing_type,
                    "count": row.count
                }
                for row in preferred_types.all()
            ],
            "average_booking_value": float(avg_value.scalar() or 0)
        }
    
    @staticmethod
    async def log_audit_event(
        db: AsyncSession,
        user_id: Optional[ID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Log an audit event for compliance and security.
        
        Args:
            user_id: User who performed the action
            action: Action performed (e.g., 'create', 'update', 'delete', 'login')
            resource_type: Type of resource (e.g., 'booking', 'listing', 'user')
            resource_id: ID of the resource
            details: Optional additional details
        
        Returns:
            AuditLog model
        """
        log = AuditLog(
            actor_id=user_id,
            action=action,
            resource=resource_type,
            resource_id=resource_id,
            audit_metadata=details or {}
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

