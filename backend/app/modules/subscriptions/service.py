"""
Subscription service for managing host and guest subscriptions.
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.subscriptions.models import (
    SubscriptionPlan, Subscription, SubscriptionInvoice,
    SubscriptionPlanType, SubscriptionTier, SubscriptionStatus
)
from app.core.id import ID

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Service for managing subscriptions."""
    
    @staticmethod
    async def get_available_plans(
        db: AsyncSession,
        plan_type: SubscriptionPlanType
    ) -> List[SubscriptionPlan]:
        """Get available subscription plans for a plan type."""
        result = await db.execute(
            select(SubscriptionPlan)
            .where(
                and_(
                    SubscriptionPlan.plan_type == plan_type,
                    SubscriptionPlan.is_active == True
                )
            )
            .order_by(SubscriptionPlan.price_monthly.asc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_user_subscription(
        db: AsyncSession,
        user_id: ID,
        plan_type: Optional[SubscriptionPlanType] = None
    ) -> Optional[Subscription]:
        """Get user's active subscription."""
        conditions = [
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ]
        
        if plan_type:
            conditions.append(Subscription.plan_type == plan_type)
        
        result = await db.execute(
            select(Subscription)
            .where(and_(*conditions))
            .options(
                selectinload(Subscription.plan),
                selectinload(Subscription.invoices)
            )
            .order_by(Subscription.created_at.desc())
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_subscription(
        db: AsyncSession,
        user_id: ID,
        plan_id: ID,
        billing_cycle: str = "monthly",
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None
    ) -> Subscription:
        """Create a new subscription."""
        # Get plan
        plan_result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )
        
        if not plan.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription plan is not active"
            )
        
        # Check if user already has active subscription of this type
        existing = await SubscriptionService.get_user_subscription(
            db, user_id, plan.plan_type
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription of this type"
            )
        
        # Calculate period dates
        now = datetime.now(timezone.utc)
        if billing_cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)
        
        # Check for trial
        is_trial = plan.trial_days > 0
        trial_start = now if is_trial else None
        trial_end = (now + timedelta(days=plan.trial_days)) if is_trial else None
        
        subscription = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            plan_type=plan.plan_type,
            status=SubscriptionStatus.TRIAL if is_trial else SubscriptionStatus.ACTIVE,
            billing_cycle=billing_cycle,
            current_period_start=now,
            current_period_end=period_end,
            trial_start=trial_start,
            trial_end=trial_end,
            is_trial=is_trial,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            usage_metadata={}
        )
        
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription, ["plan"])
        
        logger.info(
            f"Created subscription: {subscription.id} for user {user_id}, "
            f"plan {plan_id}, type {plan.plan_type.value}"
        )
        
        return subscription
    
    @staticmethod
    async def cancel_subscription(
        db: AsyncSession,
        subscription_id: ID,
        user_id: ID,
        cancel_immediately: bool = False
    ) -> Subscription:
        """Cancel a subscription."""
        result = await db.execute(
            select(Subscription)
            .where(
                and_(
                    Subscription.id == subscription_id,
                    Subscription.user_id == user_id
                )
            )
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        if subscription.status != SubscriptionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription is not active"
            )
        
        if cancel_immediately:
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.cancelled_at = datetime.now(timezone.utc)
            subscription.current_period_end = datetime.now(timezone.utc)
        else:
            subscription.cancel_at_period_end = True
            subscription.cancelled_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(subscription)
        
        logger.info(
            f"Cancelled subscription: {subscription_id} for user {user_id}, "
            f"immediate={cancel_immediately}"
        )
        
        return subscription
    
    @staticmethod
    async def renew_subscription(
        db: AsyncSession,
        subscription_id: ID
    ) -> Subscription:
        """Renew subscription for next billing period."""
        result = await db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        # Calculate new period
        now = datetime.now(timezone.utc)
        if subscription.billing_cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)
        
        subscription.current_period_start = now
        subscription.current_period_end = period_end
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.cancel_at_period_end = False
        
        await db.commit()
        await db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    async def check_usage_limits(
        db: AsyncSession,
        user_id: ID,
        plan_type: SubscriptionPlanType,
        limit_type: str  # listings, bookings, guests
    ) -> Dict[str, Any]:
        """Check if user has reached usage limits."""
        subscription = await SubscriptionService.get_user_subscription(
            db, user_id, plan_type
        )
        
        if not subscription:
            # Free tier limits
            free_limits = {
                "listings": 1,
                "bookings_per_month": 5,
                "guests": 1
            }
            return {
                "has_subscription": False,
                "limit": free_limits.get(limit_type),
                "current_usage": 0,
                "remaining": free_limits.get(limit_type)
            }
        
        plan = subscription.plan
        
        # Get current usage
        current_usage = 0
        limit = None
        
        if limit_type == "listings":
            from app.modules.listings.models import Listing
            result = await db.execute(
                select(func.count(Listing.id))
                .where(Listing.host_id == user_id)
            )
            current_usage = result.scalar() or 0
            limit = plan.max_listings
        
        elif limit_type == "bookings_per_month":
            from app.modules.bookings.models import Booking
            from datetime import datetime, timedelta, timezone
            month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0)
            result = await db.execute(
                select(func.count(Booking.id))
                .where(
                    and_(
                        Booking.guest_id == user_id,
                        Booking.created_at >= month_start
                    )
                )
            )
            current_usage = result.scalar() or 0
            limit = plan.max_bookings_per_month
        
        elif limit_type == "guests":
            # This would be tracked differently
            limit = plan.max_guests
        
        return {
            "has_subscription": True,
            "subscription_id": str(subscription.id),
            "plan_name": plan.name,
            "limit": limit,
            "current_usage": current_usage,
            "remaining": (limit - current_usage) if limit else None,
            "is_unlimited": limit is None
        }
    
    @staticmethod
    async def expire_subscriptions(db: AsyncSession) -> int:
        """
        Expire subscriptions that have passed their period end.
        Called by scheduled task (Celery).
        """
        now = datetime.now(timezone.utc)
        
        result = await db.execute(
            select(Subscription).where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    Subscription.current_period_end < now,
                    Subscription.cancel_at_period_end == False
                )
            )
        )
        subscriptions = result.scalars().all()
        
        expired_count = 0
        for subscription in subscriptions:
            subscription.status = SubscriptionStatus.EXPIRED
            expired_count += 1
        
        if expired_count > 0:
            await db.commit()
            logger.info(f"Expired {expired_count} subscriptions")
        
        return expired_count

