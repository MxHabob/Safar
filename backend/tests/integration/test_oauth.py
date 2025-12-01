"""
Integration tests for OAuth providers.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from app.infrastructure.oauth.service import OAuthService
from app.core.config import get_settings

settings = get_settings()


@pytest.mark.asyncio
@patch('app.infrastructure.oauth.service.httpx.AsyncClient')
async def test_facebook_token_verification(mock_client):
    """Test Facebook OAuth token verification."""
    # Mock successful Facebook API responses
    mock_user_response = MagicMock()
    mock_user_response.json.return_value = {
        "id": "123456789",
        "name": "Test User",
        "email": "test@example.com",
        "picture": {
            "data": {
                "url": "https://example.com/pic.jpg"
            }
        }
    }
    mock_user_response.raise_for_status = MagicMock()
    
    mock_debug_response = MagicMock()
    mock_debug_response.json.return_value = {
        "data": {
            "app_id": settings.facebook_app_id or "test_app_id",
            "is_valid": True
        }
    }
    mock_debug_response.raise_for_status = MagicMock()
    
    # Setup mock client
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.get = AsyncMock(side_effect=[
        mock_user_response,
        mock_debug_response
    ])
    mock_client.return_value = mock_client_instance
    
    # Test token verification
    if settings.facebook_app_id and settings.facebook_app_secret:
        result = await OAuthService.verify_facebook_token("test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
        assert result["sub"] == "123456789"
        assert result["email_verified"] is True
    else:
        # If not configured, should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await OAuthService.verify_facebook_token("test_token")
        assert exc_info.value.status_code == 503


@pytest.mark.asyncio
@patch('app.infrastructure.oauth.service.httpx.AsyncClient')
async def test_github_token_verification(mock_client):
    """Test GitHub OAuth token verification."""
    # Mock successful GitHub API responses
    mock_user_response = MagicMock()
    mock_user_response.json.return_value = {
        "id": 123456,
        "login": "testuser",
        "name": "Test User",
        "email": "test@example.com",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    mock_user_response.raise_for_status = MagicMock()
    
    # Setup mock client
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.get = AsyncMock(return_value=mock_user_response)
    mock_client.return_value = mock_client_instance
    
    # Test token verification
    if settings.github_client_id and settings.github_client_secret:
        result = await OAuthService.verify_github_token("test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
        assert result["sub"] == "123456"
        assert result["picture"] == "https://example.com/avatar.jpg"
    else:
        # If not configured, should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await OAuthService.verify_github_token("test_token")
        assert exc_info.value.status_code == 503


@pytest.mark.asyncio
@patch('app.infrastructure.oauth.service.httpx.AsyncClient')
async def test_facebook_token_verification_invalid_token(mock_client):
    """Test Facebook OAuth with invalid token."""
    # Mock failed Facebook API response
    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = Exception("Invalid token")
    mock_response.text = "Invalid token"
    
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.get = AsyncMock(return_value=mock_response)
    mock_client.return_value = mock_client_instance
    
    # Should raise HTTPException for invalid token
    with pytest.raises(HTTPException) as exc_info:
        await OAuthService.verify_facebook_token("invalid_token")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
@patch('app.infrastructure.oauth.service.httpx.AsyncClient')
async def test_github_token_verification_no_email(mock_client):
    """Test GitHub OAuth when user has no public email."""
    # Mock GitHub API response with no email, then email endpoint
    mock_user_response = MagicMock()
    mock_user_response.json.return_value = {
        "id": 123456,
        "login": "testuser",
        "name": "Test User",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    mock_user_response.raise_for_status = MagicMock()
    
    mock_email_response = MagicMock()
    mock_email_response.status_code = 200
    mock_email_response.json.return_value = [
        {
            "email": "test@example.com",
            "primary": True,
            "verified": True
        }
    ]
    
    mock_client_instance = AsyncMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    mock_client_instance.get = AsyncMock(side_effect=[
        mock_user_response,
        mock_email_response
    ])
    mock_client.return_value = mock_client_instance
    
    if settings.github_client_id and settings.github_client_secret:
        result = await OAuthService.verify_github_token("test_token")
        
        assert result["email"] == "test@example.com"
        assert result["email_verified"] is True

