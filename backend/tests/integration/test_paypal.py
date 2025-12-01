"""
Integration tests for PayPal payment processing.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from app.infrastructure.payments.paypal import PayPalService
from app.core.config import get_settings

settings = get_settings()


@pytest.mark.asyncio
@patch('app.infrastructure.payments.paypal.httpx.AsyncClient')
async def test_paypal_order_creation(mock_client):
    """Test PayPal order creation."""
    # Mock PayPal OAuth token response
    mock_auth_response = MagicMock()
    mock_auth_response.json.return_value = {
        "access_token": "test_access_token",
        "token_type": "Bearer",
        "expires_in": 3600
    }
    mock_auth_response.raise_for_status = MagicMock()
    
    # Mock PayPal order creation response
    mock_order_response = MagicMock()
    mock_order_response.json.return_value = {
        "id": "test_order_id",
        "status": "CREATED",
        "links": [
            {
                "rel": "approve",
                "href": "https://www.sandbox.paypal.com/checkoutnow?token=test_token"
            }
        ]
    }
    mock_order_response.raise_for_status = MagicMock()
    
    # Setup mock client
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.post = AsyncMock(side_effect=[
        mock_auth_response,
        mock_order_response
    ])
    mock_client.return_value = mock_client_instance
    
    # Test order creation
    if settings.paypal_client_id and settings.paypal_client_secret:
        result = await PayPalService.create_order(
            amount=100.00,
            currency="USD",
            booking_id="test_booking_123"
        )
        
        assert result["order_id"] == "test_order_id"
        assert result["status"] == "CREATED"
        assert result["approval_url"] is not None
        assert "paypal.com" in result["approval_url"]
    else:
        # If not configured, should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await PayPalService.create_order(amount=100.00)
        assert exc_info.value.status_code == 503


@pytest.mark.asyncio
@patch('app.infrastructure.payments.paypal.httpx.AsyncClient')
async def test_paypal_order_capture(mock_client):
    """Test PayPal order capture."""
    # Mock PayPal OAuth token response
    mock_auth_response = MagicMock()
    mock_auth_response.json.return_value = {
        "access_token": "test_access_token",
        "token_type": "Bearer",
        "expires_in": 3600
    }
    mock_auth_response.raise_for_status = MagicMock()
    
    # Mock PayPal order capture response
    mock_capture_response = MagicMock()
    mock_capture_response.json.return_value = {
        "id": "test_order_id",
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {
                            "id": "test_capture_id",
                            "status": "COMPLETED",
                            "amount": {
                                "currency_code": "USD",
                                "value": "100.00"
                            }
                        }
                    ]
                }
            }
        ]
    }
    mock_capture_response.raise_for_status = MagicMock()
    
    # Setup mock client
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.post = AsyncMock(return_value=mock_auth_response)
    mock_client_instance.get = AsyncMock(return_value=mock_auth_response)
    
    # For capture, we need to mock both post (for auth and capture)
    async def mock_post(*args, **kwargs):
        if "oauth2/token" in str(kwargs.get("url", "")):
            return mock_auth_response
        return mock_capture_response
    
    mock_client_instance.post = AsyncMock(side_effect=mock_post)
    mock_client.return_value = mock_client_instance
    
    # Test order capture
    if settings.paypal_client_id and settings.paypal_client_secret:
        result = await PayPalService.capture_order("test_order_id")
        
        assert result["order_id"] == "test_order_id"
        assert result["status"] == "COMPLETED"
        assert result["payment_id"] == "test_capture_id"
        assert result["amount"] == 100.00
        assert result["currency"] == "USD"
    else:
        # If not configured, should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await PayPalService.capture_order("test_order_id")
        assert exc_info.value.status_code == 503


@pytest.mark.asyncio
@patch('app.infrastructure.payments.paypal.httpx.AsyncClient')
async def test_paypal_get_order(mock_client):
    """Test getting PayPal order details."""
    # Mock PayPal OAuth token response
    mock_auth_response = MagicMock()
    mock_auth_response.json.return_value = {
        "access_token": "test_access_token",
        "token_type": "Bearer",
        "expires_in": 3600
    }
    mock_auth_response.raise_for_status = MagicMock()
    
    # Mock PayPal get order response
    mock_order_response = MagicMock()
    mock_order_response.json.return_value = {
        "id": "test_order_id",
        "status": "APPROVED",
        "intent": "CAPTURE"
    }
    mock_order_response.raise_for_status = MagicMock()
    
    # Setup mock client
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.post = AsyncMock(return_value=mock_auth_response)
    mock_client_instance.get = AsyncMock(return_value=mock_order_response)
    mock_client.return_value = mock_client_instance
    
    if settings.paypal_client_id and settings.paypal_client_secret:
        result = await PayPalService.get_order("test_order_id")
        
        assert result["id"] == "test_order_id"
        assert result["status"] == "APPROVED"

