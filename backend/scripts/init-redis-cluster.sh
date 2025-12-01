#!/bin/bash
# Redis Cluster Initialization Script
# This script initializes a Redis Cluster with 3 masters and 3 replicas

set -e

REDIS_PASSWORD=${REDIS_PASSWORD:-}
CLUSTER_NODES=(
  "redis-cluster-1:6379"
  "redis-cluster-2:6379"
  "redis-cluster-3:6379"
  "redis-cluster-4:6379"
  "redis-cluster-5:6379"
  "redis-cluster-6:6379"
)

echo "Waiting for Redis nodes to be ready..."
for node in "${CLUSTER_NODES[@]}"; do
  host=$(echo $node | cut -d: -f1)
  port=$(echo $node | cut -d: -f2)
  echo "Checking $host:$port..."
  until redis-cli -h $host -p $port ${REDIS_PASSWORD:+-a $REDIS_PASSWORD} ping > /dev/null 2>&1; do
    echo "Waiting for $host:$port..."
    sleep 2
  done
  echo "$host:$port is ready"
done

echo "Initializing Redis Cluster..."
if [ -z "$REDIS_PASSWORD" ]; then
  redis-cli --cluster create \
    redis-cluster-1:6379 \
    redis-cluster-2:6379 \
    redis-cluster-3:6379 \
    redis-cluster-4:6379 \
    redis-cluster-5:6379 \
    redis-cluster-6:6379 \
    --cluster-replicas 1 \
    --cluster-yes
else
  redis-cli --cluster create \
    redis-cluster-1:6379 \
    redis-cluster-2:6379 \
    redis-cluster-3:6379 \
    redis-cluster-4:6379 \
    redis-cluster-5:6379 \
    redis-cluster-6:6379 \
    --cluster-replicas 1 \
    --cluster-yes \
    -a "$REDIS_PASSWORD"
fi

echo "Redis Cluster initialized successfully!"
echo "Cluster status:"
redis-cli -h redis-cluster-1 -p 6379 ${REDIS_PASSWORD:+-a $REDIS_PASSWORD} cluster nodes

