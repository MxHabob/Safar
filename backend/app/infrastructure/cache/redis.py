"""
إعداد Redis للـ Caching - Redis Cache Setup
"""
import json
from typing import Optional, Any
from redis import asyncio as aioredis
from app.core.config import get_settings

settings = get_settings()

# Global Redis connection
redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """الحصول على اتصال Redis - Get Redis connection"""
    global redis_client
    if redis_client is None:
        redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client


async def close_redis():
    """إغلاق اتصال Redis - Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


class CacheService:
    """خدمة الـ Cache - Cache service"""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """الحصول على قيمة من Cache - Get value from cache"""
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
        """حفظ قيمة في Cache - Set value in cache"""
        redis = await get_redis()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await redis.set(key, value, ex=expire)
    
    @staticmethod
    async def delete(key: str) -> bool:
        """حذف قيمة من Cache - Delete value from cache"""
        redis = await get_redis()
        return await redis.delete(key) > 0
    
    @staticmethod
    async def exists(key: str) -> bool:
        """التحقق من وجود مفتاح - Check if key exists"""
        redis = await get_redis()
        return await redis.exists(key) > 0
    
    @staticmethod
    async def increment(key: str, amount: int = 1) -> int:
        """زيادة قيمة - Increment value"""
        redis = await get_redis()
        return await redis.incrby(key, amount)
    
    @staticmethod
    async def decrement(key: str, amount: int = 1) -> int:
        """تقليل قيمة - Decrement value"""
        redis = await get_redis()
        return await redis.decrby(key, amount)

