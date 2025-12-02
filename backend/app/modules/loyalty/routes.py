"""
Loyalty program routes.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.loyalty.service import LoyaltyService
from app.modules.loyalty.schemas import (
    LoyaltyStatusResponse,
    PointsAwardResponse,
    PointsRedemptionRequest,
    PointsRedemptionResponse,
    RedemptionOptionsResponse
)

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])


@router.get("/status", response_model=LoyaltyStatusResponse)
async def get_loyalty_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get user's loyalty program status.
    
    Returns:
        Current balance, tier, benefits, and transaction history
    """
    status_data = await LoyaltyService.get_user_loyalty_status(db, current_user.id)
    return status_data


@router.post("/redeem", response_model=PointsRedemptionResponse)
async def redeem_points(
    redemption_request: PointsRedemptionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Redeem loyalty points for discount.
    
    Points can be redeemed in multiples of 100 (100 points = $1 discount).
    Minimum redemption is 100 points.
    """
    result = await LoyaltyService.redeem_points(
        db,
        user_id=current_user.id,
        points_to_redeem=redemption_request.points,
        booking_id=redemption_request.booking_id
    )
    return result


@router.get("/redemption-options", response_model=RedemptionOptionsResponse)
async def get_redemption_options(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get available redemption options.
    
    Returns list of redemption options with point costs and values.
    """
    options = await LoyaltyService.get_redemption_options(db)
    return {"options": options}


@router.get("/history")
async def get_loyalty_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get loyalty transaction history.
    
    Returns recent transactions from user's loyalty ledger.
    """
    ledger = await LoyaltyService.get_or_create_ledger(db, current_user.id)
    
    transactions = list(ledger.transactions) if ledger.transactions else []
    # Return most recent transactions
    recent_transactions = transactions[-limit:] if len(transactions) > limit else transactions
    
    return {
        "transactions": recent_transactions,
        "total": len(transactions)
    }

