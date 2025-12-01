"""
Integration tests for booking flow with coupons.
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.modules.bookings.services import BookingService
from app.modules.bookings.schemas import BookingCreate
from app.modules.promotions.models import Coupon, DiscountType
from app.modules.listings.models import Listing, ListingStatus
from app.modules.users.models import User, UserRole
from app.repositories.unit_of_work import UnitOfWork
from app.core.id import generate_typed_id, ID


@pytest.mark.asyncio
async def test_booking_price_calculation_with_coupon(db_session: AsyncSession):
    """Test booking price calculation includes coupon discount."""
    # Create test user
    user = User(
        id=generate_typed_id("usr"),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST
    )
    db_session.add(user)
    await db_session.commit()
    
    # Create test listing
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=generate_typed_id("usr"),
        title="Test Listing",
        description="Test Description",
        city="Test City",
        country="Test Country",
        price_per_night=Decimal("100.00"),
        max_guests=4,
        status=ListingStatus.ACTIVE
    )
    db_session.add(listing)
    await db_session.commit()
    
    # Create coupon
    coupon = Coupon(
        id=generate_typed_id("coup"),
        code="TEST10",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        is_active=True,
        max_uses=100,
        max_uses_per_user=1
    )
    db_session.add(coupon)
    await db_session.commit()
    
    # Test price calculation with coupon
    uow = UnitOfWork(db_session)
    check_in = datetime.now(timezone.utc) + timedelta(days=1)
    check_out = check_in + timedelta(days=3)
    
    price_breakdown = await BookingService.calculate_booking_price(
        uow,
        listing_id=listing.id,
        check_in=check_in,
        check_out=check_out,
        guests=2,
        coupon_code="TEST10"
    )
    
    # Verify discount is applied
    assert "discount" in price_breakdown
    assert price_breakdown["discount"] > Decimal("0")
    assert price_breakdown["total"] < price_breakdown.get("subtotal", Decimal("0"))

