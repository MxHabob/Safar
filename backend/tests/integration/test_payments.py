"""
Integration tests for payment processing.
"""
import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch, MagicMock

from app.modules.payments.services import PaymentService
from app.modules.bookings.models import PaymentMethodType, Booking, BookingStatus
from app.modules.users.models import User, UserRole
from app.modules.listings.models import Listing, ListingStatus
from app.core.id import generate_typed_id
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
@patch('app.modules.payments.services.stripe.PaymentIntent')
async def test_payment_intent_creation_stripe(mock_stripe_pi, db_session: AsyncSession):
    """Test Stripe payment intent creation."""
    # Create test booking
    user = User(
        id=generate_typed_id("usr"),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST
    )
    db_session.add(user)
    
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=generate_typed_id("usr"),
        title="Test Listing",
        price_per_night=Decimal("100.00"),
        status=ListingStatus.ACTIVE
    )
    db_session.add(listing)
    
    booking = Booking(
        id=generate_typed_id("book"),
        guest_id=user.id,
        listing_id=listing.id,
        check_in=datetime.now(timezone.utc) + timedelta(days=1),
        check_out=datetime.now(timezone.utc) + timedelta(days=3),
        guests=2,
        total_amount=Decimal("200.00"),
        status=BookingStatus.PENDING
    )
    db_session.add(booking)
    await db_session.commit()
    
    # Mock Stripe PaymentIntent
    mock_pi_instance = MagicMock()
    mock_pi_instance.id = "pi_test123"
    mock_pi_instance.client_secret = "pi_test123_secret"
    mock_stripe_pi.create.return_value = mock_pi_instance
    
    # Test payment intent creation
    result = await PaymentService.create_payment_intent(
        db_session,
        booking_id=booking.id,
        amount=Decimal("200.00"),
        currency="USD",
        payment_method_type=PaymentMethodType.CARD
    )
    
    assert "payment_intent_id" in result or "client_secret" in result
    mock_stripe_pi.create.assert_called_once()


@pytest.mark.asyncio
@patch('app.infrastructure.payments.paypal.PayPalClient.get_access_token')
@patch('app.infrastructure.payments.paypal.httpx.AsyncClient')
async def test_payment_intent_creation_paypal(mock_httpx_client, mock_get_token, db_session: AsyncSession):
    """Test PayPal order creation."""
    # Create test booking
    user = User(
        id=generate_typed_id("usr"),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.GUEST
    )
    db_session.add(user)
    
    listing = Listing(
        id=generate_typed_id("lst"),
        host_id=generate_typed_id("usr"),
        title="Test Listing",
        price_per_night=Decimal("100.00"),
        status=ListingStatus.ACTIVE
    )
    db_session.add(listing)
    
    booking = Booking(
        id=generate_typed_id("book"),
        guest_id=user.id,
        listing_id=listing.id,
        check_in=datetime.now(timezone.utc) + timedelta(days=1),
        check_out=datetime.now(timezone.utc) + timedelta(days=3),
        guests=2,
        total_amount=Decimal("200.00"),
        status=BookingStatus.PENDING
    )
    db_session.add(booking)
    await db_session.commit()
    
    # Mock PayPal responses
    mock_get_token.return_value = "test_access_token"
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "id": "test_order_id",
        "links": [{"rel": "approve", "href": "https://paypal.com/approve"}]
    }
    mock_response.raise_for_status = MagicMock()
    
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
    mock_httpx_client.return_value = mock_client_instance
    
    # Test PayPal order creation
    result = await PaymentService.create_payment_intent(
        db_session,
        booking_id=booking.id,
        amount=Decimal("200.00"),
        currency="USD",
        payment_method_type=PaymentMethodType.PAYPAL
    )
    
    assert "order_id" in result or "approval_url" in result

