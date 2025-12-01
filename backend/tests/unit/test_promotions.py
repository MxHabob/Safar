"""
Unit tests for promotions and coupons.
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.promotions.services import PromotionService
from app.modules.promotions.models import Coupon, DiscountType
from app.core.id import generate_typed_id


@pytest.mark.asyncio
async def test_validate_coupon_percentage(db_session: AsyncSession):
    """Test percentage discount coupon validation."""
    # Create test coupon
    coupon = Coupon(
        id=generate_typed_id(prefix="CPN"),
        code="SAVE20",
        name="20% Off",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("20"),
        max_discount_amount=Decimal("100"),
        min_purchase_amount=Decimal("50"),
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
        is_active=True,
        max_uses=100,
        max_uses_per_user=1,
        current_uses=0
    )
    db_session.add(coupon)
    await db_session.commit()
    
    # Test validation
    result = await PromotionService.validate_coupon(
        db_session,
        coupon_code="SAVE20",
        listing_id=generate_typed_id(prefix="LST"),
        booking_amount=Decimal("200"),
        check_in_date=date.today() + timedelta(days=7),
        check_out_date=date.today() + timedelta(days=10),
        nights=3,
        guests=2
    )
    
    assert result["coupon_code"] == "SAVE20"
    assert result["discount_type"] == "percentage"
    assert result["discount_amount"] == Decimal("40")  # 20% of 200
    assert result["discount_amount"] <= result["max_discount_amount"]


@pytest.mark.asyncio
async def test_validate_coupon_fixed_amount(db_session: AsyncSession):
    """Test fixed amount discount coupon validation."""
    coupon = Coupon(
        id=generate_typed_id(prefix="CPN"),
        code="FIXED50",
        name="$50 Off",
        discount_type=DiscountType.FIXED_AMOUNT,
        discount_value=Decimal("50"),
        min_purchase_amount=Decimal("100"),
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
        is_active=True,
        max_uses=100,
        max_uses_per_user=1,
        current_uses=0
    )
    db_session.add(coupon)
    await db_session.commit()
    
    result = await PromotionService.validate_coupon(
        db_session,
        coupon_code="FIXED50",
        listing_id=generate_typed_id(prefix="LST"),
        booking_amount=Decimal("150"),
        check_in_date=date.today() + timedelta(days=7),
        check_out_date=date.today() + timedelta(days=10),
        nights=3,
        guests=2
    )
    
    assert result["discount_amount"] == Decimal("50")


@pytest.mark.asyncio
async def test_validate_coupon_expired(db_session: AsyncSession):
    """Test that expired coupons are rejected."""
    coupon = Coupon(
        id=generate_typed_id(prefix="CPN"),
        code="EXPIRED",
        name="Expired Coupon",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() - timedelta(days=1),
        is_active=True,
        max_uses=100,
        max_uses_per_user=1,
        current_uses=0
    )
    db_session.add(coupon)
    await db_session.commit()
    
    with pytest.raises(Exception):  # Should raise HTTPException
        await PromotionService.validate_coupon(
            db_session,
            coupon_code="EXPIRED",
            listing_id=generate_typed_id(prefix="LST"),
            booking_amount=Decimal("100"),
            check_in_date=date.today() + timedelta(days=7),
            check_out_date=date.today() + timedelta(days=10),
            nights=3,
            guests=2
        )


@pytest.mark.asyncio
async def test_validate_coupon_min_purchase(db_session: AsyncSession):
    """Test minimum purchase amount validation."""
    from fastapi import HTTPException
    
    coupon = Coupon(
        id=generate_typed_id(prefix="CPN"),
        code="MIN100",
        name="Min $100",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        min_purchase_amount=Decimal("100"),
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
        is_active=True,
        max_uses=100,
        max_uses_per_user=1,
        current_uses=0
    )
    db_session.add(coupon)
    await db_session.commit()
    
    # Should fail with amount below minimum
    with pytest.raises(HTTPException) as exc_info:
        await PromotionService.validate_coupon(
            db_session,
            coupon_code="MIN100",
            listing_id=generate_typed_id(prefix="LST"),
            booking_amount=Decimal("50"),  # Below minimum
            check_in_date=date.today() + timedelta(days=7),
            check_out_date=date.today() + timedelta(days=10),
            nights=3,
            guests=2
        )
    
    assert "minimum purchase" in exc_info.value.detail.lower()

