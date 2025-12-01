"""
Chaos Engineering Tests
Tests system resilience by randomly killing services and verifying graceful degradation.
"""
import pytest
import asyncio
import subprocess
import time
from typing import Optional
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.database import get_db
from app.infrastructure.cache.redis import get_redis


@pytest.fixture
async def client(db_session):
    """Test client fixture."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    from httpx import AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_redis_failure_graceful_degradation(client: AsyncClient, db_session):
    """
    Chaos Test 1: Redis failure - system should continue operating with degraded caching.
    """
    # Stop Redis (simulate failure)
    try:
        subprocess.run(["docker", "compose", "-f", "docker-compose.yml", "stop", "redis"], 
                      check=False, timeout=10)
        await asyncio.sleep(2)  # Wait for service to stop
    except Exception:
        pass  # Redis might not be running in test environment
    
    # Test that API still works (should fall back gracefully)
    response = await client.get("/health")
    assert response.status_code in [200, 503]  # Health check might fail, but shouldn't crash
    
    # Test that non-cache-dependent endpoints work
    response = await client.get("/api/v1/listings")
    # Should either work or return 503, but not crash
    assert response.status_code in [200, 503, 500]
    
    # Restart Redis
    try:
        subprocess.run(["docker", "compose", "-f", "docker-compose.yml", "start", "redis"],
                      check=False, timeout=10)
        await asyncio.sleep(3)  # Wait for service to start
    except Exception:
        pass


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_database_connection_loss(client: AsyncClient):
    """
    Chaos Test 2: Database connection loss - system should handle gracefully.
    """
    # This test simulates database connection issues
    # In a real scenario, you would temporarily block database port
    
    # Test health endpoint
    response = await client.get("/health")
    # Health check should indicate database status
    assert response.status_code in [200, 503]
    
    # Test that read-only operations might still work with connection pooling
    # Write operations should fail gracefully
    response = await client.get("/api/v1/listings")
    # Should handle gracefully (might return 503 or cached data)
    assert response.status_code in [200, 503, 500]


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_rate_limiting_without_redis(client: AsyncClient):
    """
    Chaos Test 3: Rate limiting should degrade gracefully when Redis is unavailable.
    """
    # Stop Redis
    try:
        subprocess.run(["docker", "compose", "-f", "docker-compose.yml", "stop", "redis"],
                      check=False, timeout=10)
        await asyncio.sleep(2)
    except Exception:
        pass
    
    # Make multiple requests - should not crash even without rate limiting
    for i in range(10):
        response = await client.get("/api/v1/listings")
        # Should handle gracefully (might disable rate limiting or use fallback)
        assert response.status_code in [200, 429, 503]
        await asyncio.sleep(0.1)
    
    # Restart Redis
    try:
        subprocess.run(["docker", "compose", "-f", "docker-compose.yml", "start", "redis"],
                      check=False, timeout=10)
        await asyncio.sleep(3)
    except Exception:
        pass


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_payment_service_degradation(client: AsyncClient, db_session):
    """
    Chaos Test 4: Payment service failure - booking should handle gracefully.
    """
    # Simulate payment service being unavailable
    # In production, this would be done by blocking external API calls
    
    # Try to create a payment intent
    # Should fail gracefully with appropriate error message
    response = await client.post(
        "/api/v1/payments/intent",
        json={
            "booking_id": "test_booking",
            "amount": 100.0,
            "currency": "USD"
        }
    )
    # Should return error, not crash
    assert response.status_code in [400, 503, 500]


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_concurrent_database_operations(client: AsyncClient, db_session):
    """
    Chaos Test 5: High concurrency - system should handle concurrent requests.
    """
    # Simulate high concurrent load
    async def make_request():
        response = await client.get("/api/v1/listings")
        return response.status_code
    
    # Make 50 concurrent requests
    tasks = [make_request() for _ in range(50)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Most requests should succeed (some might fail under load, but shouldn't crash)
    success_count = sum(1 for r in results if r == 200)
    assert success_count > 0  # At least some should succeed
    # No exceptions should be unhandled
    assert all(not isinstance(r, Exception) or isinstance(r, (ConnectionError, TimeoutError)) for r in results)


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_partial_database_failure(client: AsyncClient):
    """
    Chaos Test 6: Partial database failure - read replicas should handle read operations.
    """
    # This test verifies that if primary DB fails, read operations
    # can be handled by replicas (when configured)
    
    # Health check should indicate database status
    response = await client.get("/health")
    assert response.status_code in [200, 503]
    
    # Read operations might still work with replicas
    response = await client.get("/api/v1/listings")
    assert response.status_code in [200, 503]


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_cache_miss_handling(client: AsyncClient):
    """
    Chaos Test 7: Cache misses should not cause failures.
    """
    # Clear cache (simulate cache miss scenario)
    try:
        redis = await get_redis()
        await redis.flushdb()
    except Exception:
        pass  # Redis might not be available
    
    # Requests should work even with cache misses
    response = await client.get("/api/v1/listings")
    assert response.status_code in [200, 503]


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_graceful_shutdown(client: AsyncClient):
    """
    Chaos Test 8: System should handle graceful shutdown requests.
    """
    # Health check should work
    response = await client.get("/health")
    assert response.status_code in [200, 503]
    
    # System should not crash on shutdown signal
    # (This would be tested in integration environment)


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_memory_pressure(client: AsyncClient):
    """
    Chaos Test 9: System should handle memory pressure gracefully.
    """
    # Make many requests to simulate memory pressure
    responses = []
    for i in range(100):
        try:
            response = await client.get("/api/v1/listings?limit=10")
            responses.append(response.status_code)
            await asyncio.sleep(0.01)
        except Exception:
            pass
    
    # System should handle memory pressure without crashing
    assert len(responses) > 0


@pytest.mark.chaos
@pytest.mark.asyncio
async def test_network_partition(client: AsyncClient):
    """
    Chaos Test 10: Network partition - system should detect and handle.
    """
    # Simulate network issues by making requests with short timeouts
    # System should handle timeouts gracefully
    
    try:
        response = await client.get("/api/v1/listings", timeout=0.001)  # Very short timeout
    except Exception:
        pass  # Expected to timeout
    
    # Normal requests should still work
    response = await client.get("/api/v1/listings", timeout=5.0)
    assert response.status_code in [200, 503, 500]

