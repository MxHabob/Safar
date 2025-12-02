"""
Redis cache setup and connection management.
Supports both single Redis instance and Redis Cluster mode for high availability.
"""
import json
import logging
from typing import Optional, Any, Union
from redis import asyncio as aioredis
try:
    from redis.asyncio.cluster import RedisCluster as AsyncRedisCluster
except ImportError:
    # Fallback for older redis-py versions
    AsyncRedisCluster = None
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

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
            nodes = []
            
            if cluster_nodes:
                # Parse cluster nodes (format: host1:port1,host2:port2,host3:port3)
                try:
                    for node in cluster_nodes.split(','):
                        node = node.strip()
                        if ':' in node:
                            host, port = node.split(':', 1)
                            nodes.append({"host": host.strip(), "port": int(port.strip())})
                        else:
                            logger.warning(f"Invalid cluster node format: {node}. Expected 'host:port'")
                except ValueError as e:
                    raise ValueError(f"Invalid cluster nodes format: {cluster_nodes}. Error: {e}")
            else:
                # Fallback: try to parse from redis_url if it contains multiple nodes
                # Format: redis://host1:port1,host2:port2,host3:port3
                redis_url = getattr(settings, 'redis_url', '')
                if redis_url and ',' in redis_url:
                    # Extract nodes from URL
                    try:
                        # Remove protocol and path
                        url_without_protocol = redis_url.replace('redis://', '').replace('rediss://', '')
                        # Handle authentication if present
                        if '@' in url_without_protocol:
                            auth_part, nodes_part = url_without_protocol.split('@', 1)
                            nodes_str = nodes_part.split('/')[0]  # Remove database number if present
                        else:
                            nodes_str = url_without_protocol.split('/')[0]
                        
                        for node in nodes_str.split(','):
                            node = node.strip()
                            if ':' in node:
                                host, port = node.split(':', 1)
                                nodes.append({"host": host.strip(), "port": int(port.strip())})
                            else:
                                nodes.append({"host": node.strip(), "port": 6379})
                    except (ValueError, AttributeError) as e:
                        logger.error(f"Failed to parse cluster nodes from redis_url: {redis_url}. Error: {e}")
                        raise ValueError(f"Invalid redis_url format for cluster mode: {redis_url}")
                else:
                    # Cluster mode enabled but no cluster nodes configured
                    # Fall back to single Redis instance mode instead of failing
                    logger.warning(
                        "Redis cluster mode is enabled but no cluster nodes are configured. "
                        "Falling back to single Redis instance mode."
                    )
                    cluster_enabled = False
            
            if cluster_enabled and nodes:
                # Validate nodes format
                if not all(isinstance(node, dict) and 'host' in node and 'port' in node for node in nodes):
                    raise ValueError(f"Invalid nodes format. Expected list of dicts with 'host' and 'port' keys. Got: {nodes}")
                
                # Ensure all values are strings/integers, not dicts
                validated_nodes = []
                for node in nodes:
                    host = node.get('host') if isinstance(node, dict) else None
                    port = node.get('port') if isinstance(node, dict) else None
                    
                    if host is None or port is None:
                        raise ValueError(f"Invalid node format: {node}. Must have 'host' and 'port' keys.")
                    
                    # Ensure host is a string and port is an integer
                    if not isinstance(host, str):
                        host = str(host)
                    if not isinstance(port, int):
                        try:
                            port = int(port)
                        except (ValueError, TypeError):
                            raise ValueError(f"Invalid port value: {port}. Must be an integer.")
                    
                    validated_nodes.append({"host": host, "port": port})
                
                # Create cluster connection
                # Note: Using only parameters supported in redis-py 5.0+
                try:
                    redis_client = AsyncRedisCluster(
                        startup_nodes=validated_nodes,
                        password=getattr(settings, 'redis_password', None),
                        decode_responses=True,
                        health_check_interval=30,  # Check cluster health every 30 seconds
                        max_connections=50
                    )
                except Exception as e:
                    logger.error(f"Failed to create Redis cluster connection: {e}")
                    raise
        
        # Single Redis instance mode (or fallback from cluster mode)
        if not cluster_enabled or redis_client is None:
            redis_url = getattr(settings, 'redis_url', None)
            if not redis_url:
                # Build redis_url from individual components
                redis_host = getattr(settings, 'redis_host', 'localhost')
                redis_port = getattr(settings, 'redis_port', 6379)
                redis_db = getattr(settings, 'redis_db', 0)
                redis_password = getattr(settings, 'redis_password', None)
                
                auth = f":{redis_password}@" if redis_password else ""
                redis_url = f"redis://{auth}{redis_host}:{redis_port}/{redis_db}"
            
            redis_client = await aioredis.from_url(
                redis_url,
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

