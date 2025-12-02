"""
Redis cache setup and connection management.
Supports both single Redis instance and Redis Cluster mode for high availability.
"""
import json
from typing import Optional, Any, Union
from redis import asyncio as aioredis
try:
    from redis.asyncio.cluster import RedisCluster as AsyncRedisCluster
except ImportError:
    # Fallback for older redis-py versions
    AsyncRedisCluster = None
from app.core.config import get_settings

settings = get_settings()

# Global Redis connection instance (can be single instance or cluster)
redis_client: Optional[Union[aioredis.Redis, AsyncRedisCluster]] = None


async def get_redis() -> Union[aioredis.Redis, AsyncRedisCluster]:
    """
    Get a shared Redis connection instance.
    
    Supports both single Redis instance and Redis Cluster mode.
    Cluster mode is detected via REDIS_CLUSTER_ENABLED environment variable
    or by checking if redis_url contains multiple nodes.
    """
    global redis_client
    if redis_client is None:
        # Check if cluster mode is enabled
        cluster_enabled = getattr(settings, 'redis_cluster_enabled', False)
        
        if cluster_enabled:
            if AsyncRedisCluster is None:
                raise ImportError(
                    "Redis Cluster requires redis-py >= 4.2.0. "
                    "Install with: pip install 'redis[hiredis]>=4.2.0'"
                )
            # Redis Cluster mode
            cluster_nodes = getattr(settings, 'redis_cluster_nodes', None)
            if cluster_nodes:
                # Parse cluster nodes (format: host1:port1,host2:port2,host3:port3)
                nodes = []
                for node in cluster_nodes.split(','):
                    host, port = node.strip().split(':')
                    nodes.append((host, int(port)))
            else:
                # Fallback: try to parse from redis_url if it contains multiple nodes
                # Format: redis://host1:port1,host2:port2,host3:port3
                if ',' in settings.redis_url:
                    # Extract nodes from URL
                    url_parts = settings.redis_url.replace('redis://', '').split('/')
                    nodes_str = url_parts[0]
                    nodes = []
                    for node in nodes_str.split(','):
                        if ':' in node:
                            host, port = node.split(':')
                            nodes.append((host, int(port)))
                        else:
                            nodes.append((node, 6379))
                else:
                    # Single node cluster (not recommended but supported)
                    nodes = [(settings.redis_host, settings.redis_port)]
            
            # Create cluster connection
            # Note: Using only parameters supported in redis-py 5.0+
            redis_client = AsyncRedisCluster(
                startup_nodes=nodes,
                password=settings.redis_password,
                decode_responses=True,
                health_check_interval=30,  # Check cluster health every 30 seconds
                max_connections=50
            )
        else:
            # Single Redis instance mode
            redis_client = await aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                retry_on_timeout=True,
                health_check_interval=30
            )
    return redis_client


async def close_redis():
    """Close the shared Redis connection, if it exists."""
    global redis_client
    if redis_client:
        await redis_client.close()
        await redis_client.aclose()  # For cluster connections
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
    
    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """Delete all keys matching a pattern.
        
        Args:
            pattern: Redis key pattern (e.g., "search:*")
        
        Returns:
            Number of keys deleted
        """
        redis = await get_redis()
        deleted_count = 0
        
        # For Redis Cluster, use SCAN
        if hasattr(redis, 'scan_iter'):
            # Single Redis instance or cluster with scan_iter
            async for key in redis.scan_iter(match=pattern):
                await redis.delete(key)
                deleted_count += 1
        else:
            # Fallback: get all keys matching pattern (use with caution in production)
            try:
                keys = await redis.keys(pattern)
                if keys:
                    deleted_count = await redis.delete(*keys)
            except Exception as e:
                logger.warning(f"Failed to delete pattern {pattern}: {e}")
        
        return deleted_count

