"""
Subscription routes for hosts and guests.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.subscriptions.service import SubscriptionService
from app.modules.subscriptions.models import (
    SubscriptionPlan, Subscription, SubscriptionPlanType
)
from app.core.id import ID

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/plans")
async def get_subscription_plans(
    plan_type: SubscriptionPlanType = Query(..., description="host or guest"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get available subscription plans for hosts or guests.
    """
    plans = await SubscriptionService.get_available_plans(db, plan_type)
    return plans


@router.get("/my-subscription")
async def get_my_subscription(
    plan_type: Optional[SubscriptionPlanType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get current user's active subscription.
    """
    subscription = await SubscriptionService.get_user_subscription(
        db, current_user.id, plan_type
    )
    
    if not subscription:
        return {"has_subscription": False}
    
    return subscription


@router.post("/subscribe")
async def subscribe(
    plan_id: ID,
    billing_cycle: str = Query("monthly", regex="^(monthly|yearly)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Subscribe to a plan.
    
    Note: In production, this would integrate with Stripe to create
    a subscription and handle payment.
    """
    subscription = await SubscriptionService.create_subscription(
        db=db,
        user_id=current_user.id,
        plan_id=plan_id,
        billing_cycle=billing_cycle
    )
    return subscription


@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: ID,
    cancel_immediately: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Cancel a subscription.
    
    If cancel_immediately is False, subscription will remain active
    until the end of the current billing period.
    """
    subscription = await SubscriptionService.cancel_subscription(
        db=db,
        subscription_id=subscription_id,
        user_id=current_user.id,
        cancel_immediately=cancel_immediately
    )
    return subscription


@router.get("/usage/{limit_type}")
async def check_usage(
    limit_type: str = Path(..., regex="^(listings|bookings_per_month|guests)$"),
    plan_type: Optional[SubscriptionPlanType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Check usage against subscription limits.
    
    limit_type: listings, bookings_per_month, or guests
    """
    # Determine plan type if not provided
    if not plan_type:
        # Check if user has host profile
        if hasattr(current_user, 'host_profile') and current_user.host_profile:
            plan_type = SubscriptionPlanType.HOST
        else:
            plan_type = SubscriptionPlanType.GUEST
    
    usage = await SubscriptionService.check_usage_limits(
        db=db,
        user_id=current_user.id,
        plan_type=plan_type,
        limit_type=limit_type
    )
    return usage

