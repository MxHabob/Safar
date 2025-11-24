"""
Integration tests للمصادقة - Authentication integration tests
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    """Test user login"""
    # First register
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "login@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    
    # Then login
    response = await client.post(
        "/api/v1/users/login",
        json={
            "email": "login@example.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

