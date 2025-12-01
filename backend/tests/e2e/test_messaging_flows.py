"""
E2E tests for messaging and real-time chat flows
"""
import pytest
from httpx import AsyncClient
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from app.main import app
from app.modules.users.models import User, UserRole
from app.modules.listings.models import Listing, ListingStatus, ListingType
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.messages.models import Conversation, Message
from app.core.security import get_password_hash
from app.core.id import generate_typed_id


@pytest.fixture
async def messaging_setup(db_session):
    """Create users and listing for messaging tests."""
    host = User(
        id=generate_typed_id("usr"),
        email="host@example.com",
        hashed_password=get_password_hash("hostpass123"),
        role=UserRole.HOST,
        is_active=True
    )
    db_session.add(host)
    
    guest = User(
        id=generate_typed_id("usr"),
        email="guest@example.com",
        hashed_password=get_password_hash("guestpass123"),
        role=UserRole.GUEST,
        is_active=True
    )
    db_session.add(guest)
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
    await db_session.commit()
    
    return {"host": host, "guest": guest, "listing": listing}


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_create_conversation(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 19: Create conversation between guest and host."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create conversation
    conv_response = await client.post(
        "/api/v1/messages/conversations",
        json={
            "participant_id": str(host.id),
            "listing_id": str(listing.id)
        },
        headers=headers
    )
    assert conv_response.status_code in [200, 201]
    conv_data = conv_response.json()
    assert "id" in conv_data
    assert str(host.id) in [str(p.get("id")) for p in conv_data.get("participants", [])]


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_send_message(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 20: Send message in conversation."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create conversation first
    conv_response = await client.post(
        "/api/v1/messages/conversations",
        json={
            "participant_id": str(host.id),
            "listing_id": str(listing.id)
        },
        headers=headers
    )
    conv_id = conv_response.json()["id"]
    
    # Send message
    message_response = await client.post(
        "/api/v1/messages",
        json={
            "conversation_id": conv_id,
            "body": "Hello, is this property available?",
            "listing_id": str(listing.id)
        },
        headers=headers
    )
    assert message_response.status_code in [200, 201]
    message_data = message_response.json()
    assert message_data["body"] == "Hello, is this property available?"
    assert message_data["sender_id"] == str(guest.id)


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_get_conversation_messages(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 21: Retrieve conversation messages."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create conversation and send messages
    conv_response = await client.post(
        "/api/v1/messages/conversations",
        json={
            "participant_id": str(host.id),
            "listing_id": str(listing.id)
        },
        headers=headers
    )
    conv_id = conv_response.json()["id"]
    
    # Send multiple messages
    for i in range(3):
        await client.post(
            "/api/v1/messages",
            json={
                "conversation_id": conv_id,
                "body": f"Message {i+1}",
                "listing_id": str(listing.id)
            },
            headers=headers
        )
    
    # Get messages
    messages_response = await client.get(
        f"/api/v1/messages/conversations/{conv_id}/messages",
        headers=headers
    )
    assert messages_response.status_code == 200
    messages_data = messages_response.json()
    assert "items" in messages_data
    assert len(messages_data["items"]) >= 3


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_mark_message_read(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 22: Mark message as read."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Login as guest and create conversation
    guest_login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    guest_token = guest_login.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}
    
    conv_response = await client.post(
        "/api/v1/messages/conversations",
        json={
            "participant_id": str(host.id),
            "listing_id": str(listing.id)
        },
        headers=guest_headers
    )
    conv_id = conv_response.json()["id"]
    
    # Send message as guest
    message_response = await client.post(
        "/api/v1/messages",
        json={
            "conversation_id": conv_id,
            "body": "Test message",
            "listing_id": str(listing.id)
        },
        headers=guest_headers
    )
    message_id = message_response.json()["id"]
    
    # Login as host and mark as read
    host_login = await client.post(
        "/api/v1/users/login",
        json={"email": "host@example.com", "password": "hostpass123"}
    )
    host_token = host_login.json()["access_token"]
    host_headers = {"Authorization": f"Bearer {host_token}"}
    
    read_response = await client.post(
        f"/api/v1/messages/{message_id}/read",
        headers=host_headers
    )
    assert read_response.status_code in [200, 201]
    read_data = read_response.json()
    assert read_data["is_read"] is True


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_list_conversations(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 23: List all conversations for user."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create multiple conversations
    for i in range(3):
        await client.post(
            "/api/v1/messages/conversations",
            json={
                "participant_id": str(host.id),
                "listing_id": str(listing.id)
            },
            headers=headers
        )
    
    # List conversations
    list_response = await client.get(
        "/api/v1/messages/conversations",
        headers=headers
    )
    assert list_response.status_code == 200
    convs_data = list_response.json()
    assert "items" in convs_data
    assert len(convs_data["items"]) >= 1


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_e2e_message_with_booking(client: AsyncClient, db_session, messaging_setup):
    """E2E Test 24: Send message related to a booking."""
    guest = messaging_setup["guest"]
    host = messaging_setup["host"]
    listing = messaging_setup["listing"]
    
    # Create booking
    check_in = datetime.now(timezone.utc) + timedelta(days=7)
    check_out = check_in + timedelta(days=3)
    
    booking = Booking(
        id=generate_typed_id("book"),
        booking_number="BK-MSG-001",
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
        status=BookingStatus.CONFIRMED.value
    )
    db_session.add(booking)
    await db_session.commit()
    
    # Login as guest
    login = await client.post(
        "/api/v1/users/login",
        json={"email": "guest@example.com", "password": "guestpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create conversation with booking
    conv_response = await client.post(
        "/api/v1/messages/conversations",
        json={
            "participant_id": str(host.id),
            "listing_id": str(listing.id),
            "booking_id": str(booking.id)
        },
        headers=headers
    )
    assert conv_response.status_code in [200, 201]
    
    # Send message about booking
    message_response = await client.post(
        "/api/v1/messages",
        json={
            "conversation_id": conv_response.json()["id"],
            "body": "What time is check-in?",
            "booking_id": str(booking.id)
        },
        headers=headers
    )
    assert message_response.status_code in [200, 201]

