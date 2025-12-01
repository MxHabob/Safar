"""
E2E tests for review and rating flows
"""
import pytest
from httpx import AsyncClient
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from app.main import app
from app.modules.users.models import User, UserRole
from app.modules.listings.models import Listing, ListingStatus, ListingType
from app.modules.bookings.models import Booking, BookingStatus
from app.core.security import get_password_hash
from app.core.id import generate_typed_id


@pytest.fixture
async def completed_booking_for_review(db_session):
    """Create a completed booking for review tests."""
    guest = User(
        id=generate_typed_id("usr"),
        email="guest@example.com",
        hashed_password=get_password_hash("guestpass123"),
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(guest)
    
    host = User(
        id=generate_typed_id("usr"),
        email="host@example.com",
        hashed_password=get_password_hash("hostpass123"),
        role=UserRole.HOST,
        is_active=True
    )
    db_session.add(host)
    await db_session.flush()
    
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=host.id,
        title="Test Listing",
        description="Test",
        city="Test",
        country="Test",
        address_line1="Test",
        base_price=Decimal("100.00"),
        listing_type=ListingType.APARTMENT.value,
        status=ListingStatus.ACTIVE.value,
        max_guests=4,
        currency="USD"
    )
    db_session.add(listing)
    await db_session.flush()
    
    # Create completed booking
    check_in = datetime.now(timezone.utc) - timedelta(days=10)
    check_out = check_in + timedelta(days=3)
    
    booking = Booking(
        id=generate_typed_id("book"),
        booking_number="BK-REVIEW-001",
        guest_id=guest.id,
        listing_id=listing.id,
        check_in=check_in,
        check_out=check_out,
        check_in_date=check_in.date(),
        check_out_date=check_out.date(),
        nights=3,
        guests=2,
        total_amount=Decimal("300.00"),
        currency="USD",
        status=BookingStatus.COMPLETED.value
    )
    db_session.add(booking)
    await db_session.commit()
    
    return {"guest": guest, "host": host, "listing": listing, "booking": booking}


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_create_review_after_booking(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 25: Guest creates review after completed booking."""
    guest = completed_booking_for_review["guest"]
    listing = completed_booking_for_review["listing"]
    booking = completed_booking_for_review["booking"]
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create review
    review_response = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 5.0,
            "cleanliness_rating": 5.0,
            "communication_rating": 4.5,
            "check_in_rating": 5.0,
            "accuracy_rating": 4.5,
            "location_rating": 5.0,
            "value_rating": 4.5,
            "title": "Amazing stay!",
            "comment": "Had a wonderful time. The property was exactly as described."
        },
        headers=headers
    )
    assert review_response.status_code in [200, 201]
    review_data = review_response.json()
    assert review_data["overall_rating"] == 5.0
    assert review_data["listing_id"] == str(listing.id)
    assert review_data["guest_id"] == str(guest.id)


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_listing_reviews_display(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 26: Reviews are displayed on listing page."""
    listing = completed_booking_for_review["listing"]
    guest = completed_booking_for_review["guest"]
    booking = completed_booking_for_review["booking"]
    
    # Login and create review
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create review
    await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 4.5,
            "title": "Great place",
            "comment": "Loved it!"
        },
        headers=headers
    )
    
    # Get listing reviews
    reviews_response = await client.get(
        f"/api/v1/reviews/listings/{listing.id}",
        headers=headers
    )
    assert reviews_response.status_code == 200
    reviews_data = reviews_response.json()
    assert "items" in reviews_data
    assert len(reviews_data["items"]) >= 1
    assert reviews_data["items"][0]["overall_rating"] == 4.5


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_prevent_duplicate_review(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 27: Prevent guest from reviewing same listing twice."""
    guest = completed_booking_for_review["guest"]
    listing = completed_booking_for_review["listing"]
    booking = completed_booking_for_review["booking"]
    
    # Login
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create first review
    review1 = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 5.0,
            "comment": "First review"
        },
        headers=headers
    )
    assert review1.status_code in [200, 201]
    
    # Try to create second review for same listing
    review2 = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 4.0,
            "comment": "Second review attempt"
        },
        headers=headers
    )
    # Should fail with 400
    assert review2.status_code == 400
    assert "already reviewed" in review2.json().get("detail", "").lower()


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_review_updates_listing_rating(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 28: Review updates listing's average rating."""
    listing = completed_booking_for_review["listing"]
    guest = completed_booking_for_review["guest"]
    booking = completed_booking_for_review["booking"]
    
    # Get initial rating
    initial_rating = listing.rating or Decimal("0.0")
    initial_count = listing.review_count or 0
    
    # Login and create review
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create review with rating
    review_response = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 4.5,
            "comment": "Good stay"
        },
        headers=headers
    )
    assert review_response.status_code in [200, 201]
    
    # Verify listing rating updated
    listing_response = await client.get(
        f"/api/v1/listings/{listing.id}",
        headers=headers
    )
    if listing_response.status_code == 200:
        listing_data = listing_response.json()
        # Rating should be updated
        if "rating" in listing_data:
            assert listing_data["rating"] >= initial_rating
        if "review_count" in listing_data:
            assert listing_data["review_count"] > initial_count


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_review_rating_validation(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 29: Review rating validation (1-5 scale)."""
    guest = completed_booking_for_review["guest"]
    listing = completed_booking_for_review["listing"]
    booking = completed_booking_for_review["booking"]
    
    # Login
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try invalid rating (too high)
    invalid_high = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 6.0,  # Invalid
            "comment": "Test"
        },
        headers=headers
    )
    assert invalid_high.status_code == 422  # Validation error
    
    # Try invalid rating (too low)
    invalid_low = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 0.5,  # Invalid
            "comment": "Test"
        },
        headers=headers
    )
    assert invalid_low.status_code == 422  # Validation error
    
    # Valid rating should work
    valid = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 4.0,  # Valid
            "comment": "Test"
        },
        headers=headers
    )
    assert valid.status_code in [200, 201]


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_review_with_multiple_ratings(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 30: Create review with all rating categories."""
    guest = completed_booking_for_review["guest"]
    listing = completed_booking_for_review["listing"]
    booking = completed_booking_for_review["booking"]
    
    # Login
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comprehensive review
    review_response = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(booking.id),
            "overall_rating": 4.5,
            "cleanliness_rating": 5.0,
            "communication_rating": 4.0,
            "check_in_rating": 5.0,
            "accuracy_rating": 4.5,
            "location_rating": 4.0,
            "value_rating": 4.5,
            "title": "Comprehensive Review",
            "comment": "Great experience overall with some areas for improvement."
        },
        headers=headers
    )
    assert review_response.status_code in [200, 201]
    review_data = review_response.json()
    
    # Verify all ratings are saved
    assert review_data["overall_rating"] == 4.5
    assert review_data["cleanliness_rating"] == 5.0
    assert review_data["communication_rating"] == 4.0
    assert review_data["check_in_rating"] == 5.0
    assert review_data["accuracy_rating"] == 4.5
    assert review_data["location_rating"] == 4.0
    assert review_data["value_rating"] == 4.5


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_review_pagination(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 31: Review listing supports pagination."""
    listing = completed_booking_for_review["listing"]
    
    # Get reviews with pagination
    reviews_page1 = await client.get(
        f"/api/v1/reviews/listings/{listing.id}?skip=0&limit=10"
    )
    assert reviews_page1.status_code == 200
    page1_data = reviews_page1.json()
    assert "items" in page1_data
    assert "total" in page1_data
    assert "skip" in page1_data
    assert "limit" in page1_data
    
    # Get second page
    reviews_page2 = await client.get(
        f"/api/v1/reviews/listings/{listing.id}?skip=10&limit=10"
    )
    assert reviews_page2.status_code == 200
    page2_data = reviews_page2.json()
    assert "items" in page2_data


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_review_only_after_completed_booking(client: AsyncClient, db_session, completed_booking_for_review):
    """E2E Test 32: Reviews can only be created for completed bookings."""
    guest = completed_booking_for_review["guest"]
    listing = completed_booking_for_review["listing"]
    
    # Create pending booking
    check_in = datetime.now(timezone.utc) + timedelta(days=7)
    check_out = check_in + timedelta(days=3)
    
    pending_booking = Booking(
        id=generate_typed_id("book"),
        booking_number="BK-PENDING-001",
        guest_id=guest.id,
        listing_id=listing.id,
        check_in=check_in,
        check_out=check_out,
        check_in_date=check_in.date(),
        check_out_date=check_out.date(),
        nights=3,
        guests=2,
        total_amount=Decimal("300.00"),
        currency="USD",
        status=BookingStatus.PENDING.value
    )
    db_session.add(pending_booking)
    await db_session.commit()
    
    # Login
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to review pending booking (should fail)
    review_response = await client.post(
        "/api/v1/reviews",
        json={
            "listing_id": str(listing.id),
            "booking_id": str(pending_booking.id),
            "overall_rating": 5.0,
            "comment": "Test"
        },
        headers=headers
    )
    # Should fail - can't review pending bookings
    assert review_response.status_code in [400, 422]

