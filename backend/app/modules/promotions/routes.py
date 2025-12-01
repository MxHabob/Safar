"""
Promotion and coupon management routes.
"""
from typing import Any, List, Optional, Dict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_host
from app.modules.users.models import User
from app.modules.promotions.models import Coupon, Promotion, DiscountType, PromotionType
from app.modules.promotions.services import PromotionService
from app.core.id import ID

router = APIRouter(prefix="/promotions", tags=["Promotions"])


@router.post("/coupons", response_model=Dict[str, Any])
async def create_coupon(
    code: str = Body(..., description="Coupon code"),
    name: str = Body(..., description="Coupon name"),
    description: Optional[str] = Body(None),
    discount_type: DiscountType = Body(..., description="Discount type"),
    discount_value: float = Body(..., description="Discount value"),
    max_discount_amount: Optional[float] = Body(None),
    min_purchase_amount: float = Body(0),
    start_date: date = Body(..., description="Start date"),
    end_date: date = Body(..., description="End date"),
    max_uses: Optional[int] = Body(None),
    max_uses_per_user: int = Body(1),
    applicable_to_properties: Optional[List[ID]] = Body(None),
    applicable_to_users: Optional[List[ID]] = Body(None),
    current_user: User = Depends(require_host),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new coupon.
    Requires HOST role.
    """
    from app.core.id import generate_typed_id
    
    coupon = Coupon(
        id=generate_typed_id(prefix="CPN"),
        code=code.upper(),
        name=name,
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        max_discount_amount=max_discount_amount,
        min_purchase_amount=min_purchase_amount,
        start_date=start_date,
        end_date=end_date,
        is_active=True,
        max_uses=max_uses,
        max_uses_per_user=max_uses_per_user,
        current_uses=0,
        applicable_to_properties=applicable_to_properties or [],
        applicable_to_users=applicable_to_users or []
    )
    
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    
    return {
        "id": coupon.id,
        "code": coupon.code,
        "name": coupon.name,
        "message": "Coupon created successfully"
    }


@router.get("/coupons", response_model=List[Dict[str, Any]])
async def list_coupons(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    List coupons.
    """
    from sqlalchemy import select, and_
    
    query = select(Coupon)
    if active_only:
        today = date.today()
        query = query.where(
            and_(
                Coupon.is_active == True,
                Coupon.start_date <= today,
                Coupon.end_date >= today
            )
        )
    
    query = query.offset(skip).limit(limit).order_by(Coupon.created_at.desc())
    result = await db.execute(query)
    coupons = result.scalars().all()
    
    return [
        {
            "id": coupon.id,
            "code": coupon.code,
            "name": coupon.name,
            "description": coupon.description,
            "discount_type": coupon.discount_type.value,
            "discount_value": float(coupon.discount_value),
            "start_date": coupon.start_date.isoformat(),
            "end_date": coupon.end_date.isoformat(),
            "is_active": coupon.is_active,
            "current_uses": coupon.current_uses,
            "max_uses": coupon.max_uses
        }
        for coupon in coupons
    ]


@router.get("/coupons/{coupon_code}/validate", response_model=Dict[str, Any])
async def validate_coupon(
    coupon_code: str,
    listing_id: ID = Query(..., description="Listing ID"),
    booking_amount: float = Query(..., description="Booking amount"),
    check_in_date: date = Query(..., description="Check-in date"),
    check_out_date: date = Query(..., description="Check-out date"),
    nights: int = Query(..., description="Number of nights"),
    guests: int = Query(..., description="Number of guests"),
    current_user: Optional[User] = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Validate a coupon code and get discount amount.
    """
    from decimal import Decimal
    
    try:
        result = await PromotionService.validate_coupon(
            db,
            coupon_code=coupon_code,
            listing_id=listing_id,
            booking_amount=Decimal(str(booking_amount)),
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            nights=nights,
            guests=guests,
            user_id=current_user.id if current_user else None
        )
        
        return {
            "valid": True,
            "coupon_code": result["coupon_code"],
            "discount_amount": float(result["discount_amount"]),
            "discount_type": result["discount_type"]
        }
    except HTTPException as e:
        return {
            "valid": False,
            "error": e.detail
        }


@router.get("/applicable", response_model=List[Dict[str, Any]])
async def get_applicable_promotions(
    listing_id: Optional[ID] = Query(None),
    check_in_date: Optional[date] = Query(None),
    nights: Optional[int] = Query(None),
    guests: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get active promotions applicable to a listing or booking.
    Public endpoint.
    """
    promotions = await PromotionService.get_applicable_promotions(
        db,
        listing_id=listing_id,
        check_in_date=check_in_date,
        nights=nights,
        guests=guests
    )
    
    return [
        {
            "id": promo.id,
            "name": promo.name,
            "description": promo.description,
            "promotion_type": promo.promotion_type.value,
            "discount_type": promo.discount_type.value,
            "discount_value": float(promo.discount_value),
            "start_date": promo.start_date.isoformat(),
            "end_date": promo.end_date.isoformat()
        }
        for promo in promotions
    ]

