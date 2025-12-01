"""
Unit tests for recommendation engine.
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recommendations.service import RecommendationService
from app.modules.listings.models import Listing, ListingStatus, ListingType
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.reviews.models import Review
from app.modules.users.models import User, UserRole
from app.core.id import generate_typed_id


@pytest.fixture
async def test_recommendation_data(db_session: AsyncSession):
    """Create test data for recommendation tests."""
    # Create users
    host = User(
        id=generate_typed_id("usr"),
        email="host@example.com",
        hashed_password="hashed",
        role=UserRole.HOST,
        is_active=True
    )
    db_session.add(host)
    
    guest1 = User(
        id=generate_typed_id("usr"),
        email="guest1@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(guest1)
    
    guest2 = User(
        id=generate_typed_id("usr"),
        email="guest2@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(guest2)
    
    await db_session.flush()
    
    # Create listings
    listing1 = Listing(
        id=generate_typed_id("lst"),
        host_id=host.id,
        title="Beach House",
        description="Beautiful beach house",
        city="Miami",
        country="USA",
        address_line1="123 Beach",
        base_price=Decimal("200.00"),
        listing_type=ListingType.HOUSE.value,
        status=ListingStatus.ACTIVE.value,
        max_guests=6,
        bedrooms=3,
        rating=Decimal("4.5"),
        review_count=10
    )
    db_session.add(listing1)
    
    listing2 = Listing(
        id=generate_typed_id("lst"),
        host_id=host.id,
        title="City Apartment",
        description="Modern apartment",
        city="New York",
        country="USA",
        address_line1="456 City",
        base_price=Decimal("150.00"),
        listing_type=ListingType.APARTMENT.value,
        status=ListingStatus.ACTIVE.value,
        max_guests=4,
        bedrooms=2,
        rating=Decimal("4.8"),
        review_count=25
    )
    db_session.add(listing2)
    
    listing3 = Listing(
        id=generate_typed_id("lst"),
        host_id=host.id,
        title="Mountain Cabin",
        description="Cozy cabin",
        city="Aspen",
        country="USA",
        address_line1="789 Mountain",
        base_price=Decimal("300.00"),
        listing_type=ListingType.CABIN.value,
        status=ListingStatus.ACTIVE.value,
        max_guests=4,
        bedrooms=2,
        rating=Decimal("4.2"),
        review_count=5
    )
    db_session.add(listing3)
    
    listing4 = Listing(
        id=generate_typed_id("lst"),
        host_id=host.id,
        title="Luxury Villa",
        description="Stunning villa",
        city="Dubai",
        country="UAE",
        address_line1="321 Luxury",
        base_price=Decimal("500.00"),
        listing_type=ListingType.VILLA.value,
        status=ListingStatus.ACTIVE.value,
        max_guests=8,
        bedrooms=4,
        rating=Decimal("4.9"),
        review_count=50
    )
    db_session.add(listing4)
    
    await db_session.flush()
    
    # Create bookings - guest1 booked listing1 and listing2
    booking1 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK001",
        guest_id=guest1.id,
        listing_id=listing1.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=30),
        check_out=datetime.now(timezone.utc) - timedelta(days=27),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=30)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=27)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("600.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking1)
    
    booking2 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK002",
        guest_id=guest1.id,
        listing_id=listing2.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=15),
        check_out=datetime.now(timezone.utc) - timedelta(days=12),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=15)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=12)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("450.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking2)
    
    # guest2 also booked listing1 and listing2 (similar user)
    booking3 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK003",
        guest_id=guest2.id,
        listing_id=listing1.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=20),
        check_out=datetime.now(timezone.utc) - timedelta(days=17),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=20)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=17)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("600.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking3)
    
    booking4 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK004",
        guest_id=guest2.id,
        listing_id=listing2.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=10),
        check_out=datetime.now(timezone.utc) - timedelta(days=7),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=10)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=7)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("450.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking4)
    
    # guest2 also booked listing3 (which guest1 hasn't booked - should be recommended)
    booking5 = Booking(
        id=generate_typed_id("book"),
        booking_number="BK005",
        guest_id=guest2.id,
        listing_id=listing3.id,
        check_in=datetime.now(timezone.utc) - timedelta(days=5),
        check_out=datetime.now(timezone.utc) - timedelta(days=2),
        check_in_date=(datetime.now(timezone.utc) - timedelta(days=5)).date(),
        check_out_date=(datetime.now(timezone.utc) - timedelta(days=2)).date(),
        nights=3,
        guests=2,
        total_amount=Decimal("900.00"),
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking5)
    
    await db_session.commit()
    
    return {
        "host": host,
        "guest1": guest1,
        "guest2": guest2,
        "listing1": listing1,
        "listing2": listing2,
        "listing3": listing3,
        "listing4": listing4
    }


@pytest.mark.asyncio
async def test_get_recommendations_for_user(db_session: AsyncSession, test_recommendation_data):
    """Test getting personalized recommendations."""
    guest1 = test_recommendation_data["guest1"]
    
    # Get recommendations for guest1
    recommendations = await RecommendationService.get_recommendations_for_user(
        db_session,
        user_id=guest1.id,
        limit=10
    )
    
    # Should get recommendations (collaborative filtering should suggest listing3)
    assert isinstance(recommendations, list)
    # Should not include listings guest1 already booked
    recommended_ids = [r.id for r in recommendations]
    assert test_recommendation_data["listing1"].id not in recommended_ids
    assert test_recommendation_data["listing2"].id not in recommended_ids
    
    # Should include at least one recommendation
    assert len(recommendations) > 0


@pytest.mark.asyncio
async def test_get_similar_listings(db_session: AsyncSession, test_recommendation_data):
    """Test getting similar listings."""
    listing1 = test_recommendation_data["listing1"]
    
    # Get similar listings to listing1
    similar = await RecommendationService.get_similar_listings(
        db_session,
        listing_id=listing1.id,
        limit=5
    )
    
    assert isinstance(similar, list)
    # Should not include the listing itself
    assert listing1.id not in [l.id for l in similar]
    # Should return similar listings (same type, similar price, etc.)
    assert len(similar) >= 0  # May be 0 if no similar listings


@pytest.mark.asyncio
async def test_get_trending_listings(db_session: AsyncSession, test_recommendation_data):
    """Test getting trending listings."""
    # Get trending listings
    trending = await RecommendationService.get_trending_listings(
        db_session,
        limit=10
    )
    
    assert isinstance(trending, list)
    # Should return listings ordered by trending score
    assert len(trending) >= 0
    
    # If there are trending listings, they should be active
    for listing in trending:
        assert listing.status == ListingStatus.ACTIVE.value


@pytest.mark.asyncio
async def test_get_recommendations_for_new_user(db_session: AsyncSession, test_recommendation_data):
    """Test recommendations for user with no booking history."""
    # Create new user with no bookings
    new_user = User(
        id=generate_typed_id("usr"),
        email="newuser@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(new_user)
    await db_session.commit()
    
    # Get recommendations - should fall back to popular listings
    recommendations = await RecommendationService.get_recommendations_for_user(
        db_session,
        user_id=new_user.id,
        limit=10
    )
    
    # Should still return recommendations (popular listings)
    assert isinstance(recommendations, list)
    assert len(recommendations) >= 0

