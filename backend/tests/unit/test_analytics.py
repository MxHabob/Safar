"""
Unit tests for analytics service.
"""
import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics.service import AnalyticsService
from app.core.id import generate_typed_id


@pytest.mark.asyncio
async def test_track_event(db_session: AsyncSession):
    """Test event tracking."""
    event = await AnalyticsService.track_event(
        db_session,
        user_id=generate_typed_id(prefix="USR"),
        event_name="test_event",
        source="test",
        payload={"key": "value"}
    )
    
    assert event.event_name == "test_event"
    assert event.source == "test"
    assert event.payload == {"key": "value"}


@pytest.mark.asyncio
async def test_get_dashboard_metrics(db_session: AsyncSession):
    """Test dashboard metrics calculation."""
    from datetime import datetime, timedelta, timezone
    from decimal import Decimal
    from app.modules.bookings.models import Booking, BookingStatus
    from app.modules.listings.models import Listing, ListingStatus
    from app.modules.users.models import User, UserRole
    from app.core.id import generate_typed_id
    
    # Create test user
    user = User(
        id=generate_typed_id("usr"),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(user)
    await db_session.flush()
    
    # Create test listing
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=user.id,
        title="Test Listing",
        description="Test",
        city="Test",
        country="Test",
        address_line1="Test",
        base_price=Decimal("100.00"),
        listing_type="apartment",
        status=ListingStatus.ACTIVE.value,
        max_guests=4
    )
    db_session.add(listing)
    await db_session.flush()
    
    # Create test bookings
    booking1 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK001",
        guest_id=user.id,
        listing_id=listing.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=10),
        check_out=datetime.now(timezone.utc) - timedelta(days=7),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=10)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=7)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("300.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking1)
    
    booking2 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK002",
        guest_id=user.id,
        listing_id=listing.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=5),
        check_out=datetime.now(timezone.utc) - timedelta(days=2),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=5)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=2)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("300.00"),
        status=BookingStatus.CANCELLED.value
    )
    db_session.add(booking2)
    
    await db_session.commit()
    
    # Get dashboard metrics
    metrics = await AnalyticsService.get_dashboard_metrics(
        db_session,
        user_id=user.id,
        start_date=datetime.now(timezone.utc) - timedelta(days=30),
        end_date=datetime.now(timezone.utc)
    )
    
    assert isinstance(metrics, dict)
    assert "total_bookings" in metrics
    assert "completed_bookings" in metrics
    assert "cancelled_bookings" in metrics
    assert metrics["total_bookings"] >= 2
    assert metrics["completed_bookings"] >= 1
    assert metrics["cancelled_bookings"] >= 1


@pytest.mark.asyncio
async def test_get_booking_trends(db_session: AsyncSession):
    """Test booking trends calculation."""
    from datetime import datetime, timedelta, timezone
    from decimal import Decimal
    from app.modules.bookings.models import Booking, BookingStatus
    from app.modules.listings.models import Listing, ListingStatus
    from app.modules.users.models import User, UserRole
    from app.core.id import generate_typed_id
    
    # Create test user
    user = User(
        id=generate_typed_id("usr"),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(user)
    await db_session.flush()
    
    # Create test listing
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=user.id,
        title="Test Listing",
        description="Test",
        city="Test",
        country="Test",
        address_line1="Test",
        base_price=Decimal("100.00"),
        listing_type="apartment",
        status=ListingStatus.ACTIVE.value,
        max_guests=4
    )
    db_session.add(listing)
    await db_session.flush()
    
    # Create bookings across different time periods
    for days_ago in [30, 20, 10, 5]:
        booking = Booking(
            id=generate_typed_id("book"),
            booking_number=f"BK{days_ago}",
            guest_id=user.id,
            listing_id=listing.id,
            check_in=datetime.now(timezone.utc) - timedelta(days=days_ago),
            check_out=datetime.now(timezone.utc) - timedelta(days=days_ago-3),
            check_in_date=(datetime.now(timezone.utc) - timedelta(days=days_ago)).date(),
            check_out_date=(datetime.now(timezone.utc) - timedelta(days=days_ago-3)).date(),
            nights=3,
            guests=2,
            total_amount=Decimal("300.00"),
            status=BookingStatus.COMPLETED.value
        )
        db_session.add(booking)
    
    await db_session.commit()
    
    # Get booking trends
    trends = await AnalyticsService.get_booking_trends(
        db_session,
        start_date=datetime.now(timezone.utc) - timedelta(days=30),
        end_date=datetime.now(timezone.utc),
        period="daily"
    )
    
    assert isinstance(trends, dict)
    assert "periods" in trends
    assert "bookings" in trends
    assert "revenue" in trends
    assert len(trends["periods"]) > 0

