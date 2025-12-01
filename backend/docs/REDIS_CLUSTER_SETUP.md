# Redis Cluster Setup Guide

This guide explains how to set up and use Redis Cluster mode for high availability in the Safar backend.

## Overview

Redis Cluster provides:
- **High Availability**: Automatic failover if a master node fails
- **Horizontal Scaling**: Distribute data across multiple nodes
- **Fault Tolerance**: Can survive up to 1 master node failure (with 3 masters)
- **Performance**: Parallel operations across multiple nodes

## Architecture

The cluster consists of:
- **3 Master Nodes**: Handle read/write operations
- **3 Replica Nodes**: One replica per master for redundancy

## Setup

### Option 1: Docker Compose (Recommended for Development/Testing)

1. **Start the cluster:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.redis-cluster.yml up -d
   ```

2. **Initialize the cluster:**
   ```bash
   docker-compose -f docker-compose.redis-cluster.yml exec redis-cluster-init sh -c "redis-cli --cluster create redis-cluster-1:6379 redis-cluster-2:6379 redis-cluster-3:6379 redis-cluster-4:6379 redis-cluster-5:6379 redis-cluster-6:6379 --cluster-replicas 1 --cluster-yes -a ${REDIS_PASSWORD:-}"
   ```

3. **Verify cluster status:**
   ```bash
   docker-compose -f docker-compose.redis-cluster.yml exec redis-cluster-1 redis-cli -a ${REDIS_PASSWORD:-} cluster nodes
   ```

### Option 2: Production Setup

For production, use managed Redis Cluster services:
- **AWS ElastiCache for Redis** (Cluster mode enabled)
- **Azure Cache for Redis** (Premium tier with clustering)
- **Google Cloud Memorystore** (with HA)
- **Redis Cloud** (managed Redis Cluster)

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable Redis Cluster mode
REDIS_CLUSTER_ENABLED=True

# Cluster nodes (comma-separated)
REDIS_CLUSTER_NODES=redis-cluster-1:6379,redis-cluster-2:6379,redis-cluster-3:6379

# Redis password (required for cluster)
REDIS_PASSWORD=your_strong_password_here
```

### Application Configuration

The application automatically detects cluster mode and uses the appropriate connection:

```python
# Single instance mode (default)
REDIS_CLUSTER_ENABLED=False
REDIS_URL=redis://localhost:6379/0

# Cluster mode
REDIS_CLUSTER_ENABLED=True
REDIS_CLUSTER_NODES=node1:6379,node2:6379,node3:6379
```

## Usage

The Redis client automatically handles:
- **Slot-based routing**: Keys are automatically routed to the correct node
- **Automatic failover**: If a master fails, replica takes over
- **Reconnection**: Automatic reconnection to healthy nodes
- **Health checks**: Periodic health checks every 30 seconds

### Code Example

```python
from app.infrastructure.cache.redis import get_redis

# Get Redis client (works with both single instance and cluster)
redis = await get_redis()

# Operations work the same way
await redis.set("key", "value")
value = await redis.get("key")
```

## Monitoring

### Check Cluster Status

```bash
# Using redis-cli
redis-cli -h redis-cluster-1 -p 6379 -a $REDIS_PASSWORD cluster nodes

# Using Docker
docker-compose -f docker-compose.redis-cluster.yml exec redis-cluster-1 \
  redis-cli -a $REDIS_PASSWORD cluster nodes
```

### Health Checks

The cluster includes health checks:
- Each node checks every 10 seconds
- Application checks cluster health every 30 seconds
- Automatic failover if master node fails

## Migration from Single Instance

1. **Backup existing data:**
   ```bash
   redis-cli --rdb /backup/redis-dump.rdb
   ```

2. **Set up cluster** (see Setup section above)

3. **Migrate data** (if needed):
   ```bash
   # Use redis-migrate-tool or similar
   redis-migrate-tool --from redis://old-host:6379 --to redis://cluster-node:6379
   ```

4. **Update configuration:**
   - Set `REDIS_CLUSTER_ENABLED=True`
   - Set `REDIS_CLUSTER_NODES`
   - Restart application

5. **Verify:**
   - Check application logs for cluster connection
   - Test cache operations
   - Monitor cluster status

## Troubleshooting

### Cluster Not Forming

- Ensure all nodes are healthy: `docker-compose ps`
- Check network connectivity between nodes
- Verify password is set correctly on all nodes
- Check logs: `docker-compose logs redis-cluster-1`

### Connection Errors

- Verify `REDIS_CLUSTER_ENABLED=True` is set
- Check `REDIS_CLUSTER_NODES` format (comma-separated, host:port)
- Ensure password matches on all nodes
- Check firewall rules allow inter-node communication

### Performance Issues

- Monitor cluster slot distribution: `redis-cli cluster slots`
- Check for hot spots (keys concentrated on one node)
- Consider adding more nodes for better distribution
- Monitor network latency between nodes

## Best Practices

1. **Always use passwords** in production
2. **Monitor cluster health** regularly
3. **Set up alerts** for node failures
4. **Backup cluster data** regularly
5. **Test failover scenarios** in staging
6. **Use connection pooling** (already implemented)
7. **Handle MOVED/ASK redirects** (handled automatically by client)

## Limitations

- **Multi-key operations** require keys to be in the same slot (use hash tags: `{user}:123`)
- **Transactions** are limited to single nodes
- **Pub/Sub** works but messages are node-specific
- **Lua scripts** must use keys from the same slot

## References

- [Redis Cluster Specification](https://redis.io/docs/reference/cluster-spec/)
- [Redis Cluster Tutorial](https://redis.io/docs/manual/scaling/)
- [redis-py Cluster Documentation](https://redis-py.readthedocs.io/en/stable/cluster.html)

