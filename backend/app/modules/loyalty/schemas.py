"""
Loyalty program schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LoyaltyStatusResponse(BaseModel):
    """Loyalty status response."""
    balance: int = Field(..., description="Current points balance")
    tier: str = Field(..., description="Current tier (bronze, silver, gold, platinum)")
    tier_name: str = Field(..., description="Tier display name")
    points_per_dollar: float = Field(..., description="Points earned per dollar spent")
    discount_percentage: int = Field(..., description="Tier discount percentage")
    priority_support: bool = Field(..., description="Whether user has priority support")
    points_to_next_tier: Optional[int] = Field(None, description="Points needed for next tier")
    next_tier: Optional[int] = Field(None, description="Next tier threshold")
    expires_at: Optional[str] = Field(None, description="Points expiry date")
    recent_transactions: List[Dict[str, Any]] = Field(default_factory=list, description="Recent transactions")
    program_name: str = Field(..., description="Loyalty program name")


class PointsAwardResponse(BaseModel):
    """Response for points award."""
    points_awarded: int = Field(..., description="Points awarded")
    new_balance: int = Field(..., description="New points balance")
    current_tier: str = Field(..., description="Current tier")
    new_tier: str = Field(..., description="New tier (may be same as current)")
    tier_upgraded: bool = Field(..., description="Whether tier was upgraded")
    transaction_id: str = Field(..., description="Transaction timestamp ID")


class PointsRedemptionRequest(BaseModel):
    """Request to redeem points."""
    points: int = Field(..., ge=100, description="Points to redeem (minimum 100, multiples of 100)")
    booking_id: Optional[str] = Field(None, description="Optional booking ID for redemption")


class PointsRedemptionResponse(BaseModel):
    """Response for points redemption."""
    points_redeemed: int = Field(..., description="Points redeemed")
    discount_amount: float = Field(..., description="Discount amount in dollars")
    new_balance: int = Field(..., description="New points balance")
    transaction_id: str = Field(..., description="Transaction timestamp ID")


class RedemptionOption(BaseModel):
    """Redemption option."""
    id: str = Field(..., description="Redemption option ID")
    name: str = Field(..., description="Display name")
    points_required: int = Field(..., description="Points required")
    value: float = Field(..., description="Value in dollars")
    type: str = Field(..., description="Type (discount, free_night, etc.)")


class RedemptionOptionsResponse(BaseModel):
    """Response with available redemption options."""
    options: List[RedemptionOption] = Field(..., description="Available redemption options")

