"""
Redis cache setup and connection management.
"""
import json
from typing import Optional, Any
from redis import asyncio as aioredis
from app.core.config import get_settings

settings = get_settings()

# Global Redis connection instance
redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Get a shared Redis connection instance."""
    global redis_client
    if redis_client is None:
        redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client


async def close_redis():
    """Close the shared Redis connection, if it exists."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


class CacheService:
    """High-level cache operations backed by Redis."""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Get a value from cache by key.

        The value is JSON-decoded when possible.
        """
        redis = await get_redis()
        value = await redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    
    @staticmethod
    async def set(key: str, value: Any, expire: int = 3600) -> bool:
        """Set a value in cache with an expiration time in seconds."""
        redis = await get_redis()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await redis.set(key, value, ex=expire)
    
    @staticmethod
    async def delete(key: str) -> bool:
        """Delete a value from cache by key."""
        redis = await get_redis()
        return await redis.delete(key) > 0
    
    @staticmethod
    async def exists(key: str) -> bool:
        """Return True if a cache key exists."""
        redis = await get_redis()
        return await redis.exists(key) > 0
    
    @staticmethod
    async def increment(key: str, amount: int = 1) -> int:
        """Atomically increment an integer value stored at key."""
        redis = await get_redis()
        return await redis.incrby(key, amount)
    
    @staticmethod
    async def decrement(key: str, amount: int = 1) -> int:
        """Atomically decrement an integer value stored at key."""
        redis = await get_redis()
        return await redis.decrby(key, amount)

