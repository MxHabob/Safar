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
    try:
        # Try importing ClusterNode from both possible locations
        try:
            from redis.asyncio.cluster import ClusterNode
        except ImportError:
            from redis.cluster import ClusterNode
    except ImportError:
        ClusterNode = None
except ImportError:
    # Fallback for older redis-py versions
    AsyncRedisCluster = None
    ClusterNode = None
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
                # Handle both string and list inputs
                try:
                    # If cluster_nodes is already a list, use it directly
                    if isinstance(cluster_nodes, list):
                        # If it's a list of strings, parse each one
                        if cluster_nodes and isinstance(cluster_nodes[0], str):
                            for node_str in cluster_nodes:
                                node_str = node_str.strip()
                                if ':' in node_str:
                                    host, port = node_str.split(':', 1)
                                    nodes.append({"host": host.strip(), "port": int(port.strip())})
                                else:
                                    logger.warning(f"Invalid cluster node format: {node_str}. Expected 'host:port'")
                        # If it's already a list of dicts, validate and use it
                        elif cluster_nodes and isinstance(cluster_nodes[0], dict):
                            for node_dict in cluster_nodes:
                                if isinstance(node_dict, dict) and 'host' in node_dict and 'port' in node_dict:
                                    nodes.append({"host": str(node_dict['host']), "port": int(node_dict['port'])})
                                else:
                                    raise ValueError(f"Invalid node dict format: {node_dict}. Must have 'host' and 'port' keys.")
                        else:
                            raise ValueError(f"Invalid cluster_nodes list format: {cluster_nodes}")
                    # If cluster_nodes is a string, parse it
                    elif isinstance(cluster_nodes, str):
                        for node in cluster_nodes.split(','):
                            node = node.strip()
                            if ':' in node:
                                host, port = node.split(':', 1)
                                nodes.append({"host": host.strip(), "port": int(port.strip())})
                            else:
                                logger.warning(f"Invalid cluster node format: {node}. Expected 'host:port'")
                    else:
                        raise ValueError(f"Invalid cluster_nodes type: {type(cluster_nodes)}. Expected str or list.")
                except (ValueError, AttributeError, TypeError) as e:
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
                # Validate nodes format and convert to the format expected by redis-py
                # redis-py 5.x accepts both dicts and tuples, but we'll use dicts for clarity
                validated_nodes = []
                for node in nodes:
                    # Handle dict format
                    if isinstance(node, dict):
                        host = node.get('host') or node.get('hostname')
                        port = node.get('port')
                    # Handle tuple format (host, port)
                    elif isinstance(node, (tuple, list)) and len(node) >= 2:
                        host = node[0]
                        port = node[1]
                    else:
                        raise ValueError(f"Invalid node format: {node}. Expected dict with 'host' and 'port' keys or tuple (host, port).")
                    
                    if host is None or port is None:
                        raise ValueError(f"Invalid node format: {node}. Must have 'host' and 'port'.")
                    
                    # Ensure host is a string and port is an integer
                    if not isinstance(host, str):
                        host = str(host)
                    if not isinstance(port, int):
                        try:
                            port = int(port)
                        except (ValueError, TypeError):
                            raise ValueError(f"Invalid port value: {port}. Must be an integer.")
                    
                    # Use dict format (redis-py 5.x accepts this)
                    validated_nodes.append({"host": host, "port": port})
                
                if not validated_nodes:
                    raise ValueError("No valid cluster nodes found after validation.")
                
                logger.info(f"Creating Redis cluster connection with {len(validated_nodes)} nodes")
                
                # Create cluster connection
                # Try different formats that redis-py 5.x might accept
                connection_error = None
                
                # First, try with ClusterNode objects (preferred for redis-py 5.x)
                if ClusterNode is not None:
                    try:
                        cluster_node_objects = [
                            ClusterNode(host=node["host"], port=node["port"])
                            for node in validated_nodes
                        ]
                        redis_client = AsyncRedisCluster(
                            startup_nodes=cluster_node_objects,
                            password=getattr(settings, 'redis_password', None),
                            decode_responses=True,
                            health_check_interval=30,
                            max_connections=50
                        )
                        logger.info("Redis cluster connection created successfully with ClusterNode objects")
                    except Exception as e:
                        logger.warning(f"Failed with ClusterNode objects: {e}")
                        connection_error = e
                
                # If ClusterNode failed or not available, try dict format
                if redis_client is None:
                    try:
                        redis_client = AsyncRedisCluster(
                            startup_nodes=validated_nodes,
                            password=getattr(settings, 'redis_password', None),
                            decode_responses=True,
                            health_check_interval=30,
                            max_connections=50
                        )
                        logger.info("Redis cluster connection created successfully with dict format")
                    except Exception as e:
                        logger.warning(f"Failed with dict format: {e}")
                        connection_error = e
                        
                        # Last resort: try tuple format
                        try:
                            logger.info("Attempting fallback with tuple format...")
                            tuple_nodes = [(node["host"], node["port"]) for node in validated_nodes]
                            redis_client = AsyncRedisCluster(
                                startup_nodes=tuple_nodes,
                                password=getattr(settings, 'redis_password', None),
                                decode_responses=True,
                                health_check_interval=30,
                                max_connections=50
                            )
                            logger.info("Redis cluster connection created successfully with tuple format")
                        except Exception as e2:
                            logger.error(f"All connection attempts failed. Last error: {e2}")
                            logger.error(f"Cluster nodes that were attempted: {validated_nodes}")
                            logger.error(f"Original cluster_nodes value: {cluster_nodes}")
                            logger.error(f"Cluster nodes type: {type(cluster_nodes)}")
                            raise e2  # Raise the last error
                
                if redis_client is None and connection_error:
                    raise connection_error
        
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

