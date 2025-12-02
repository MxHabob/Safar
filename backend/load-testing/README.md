# Load Testing Setup for Safar Backend

## Overview

This directory contains load testing configurations targeting **50,000 concurrent users** on booking APIs.

## Tools

### 1. k6 (Recommended)

k6 is a modern load testing tool written in Go with JavaScript test scripts.

**Installation:**
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
# Download from https://github.com/grafana/k6/releases
```

**Run Load Test:**
```bash
# Basic run (50k concurrent users)
k6 run --vus 50000 --duration 5m k6-load-test.js

# Gradual ramp-up (recommended)
k6 run k6-load-test.js

# With custom base URL
BASE_URL=https://api.safar.com k6 run k6-load-test.js

# Generate HTML report
k6 run --out json=results.json k6-load-test.js
k6 report results.json
```

**Performance Targets:**
- 95th percentile response time: < 250ms
- 99th percentile response time: < 500ms
- Error rate: < 1%
- Booking success rate: > 95%

### 2. Artillery

Artillery is a Node.js-based load testing toolkit.

**Installation:**
```bash
npm install -g artillery
```

**Run Load Test:**
```bash
# Basic run
artillery run artillery-load-test.yml

# With custom target
artillery run --target https://api.safar.com artillery-load-test.yml

# Generate HTML report
artillery run --output results.json artillery-load-test.yml
artillery report results.json
```

## Test Scenarios

### 1. Search and Browse (40% of traffic)
- Search listings
- View listing details
- Check availability

### 2. Check Availability (30% of traffic)
- Check booking availability for specific dates

### 3. Calculate Price (20% of traffic)
- Calculate booking price with fees

### 4. Create Booking (10% of traffic)
- Complete booking creation flow
- Critical path - must handle high load

## Pre-Test Setup

1. **Create Test Users:**
   ```bash
   # Create test users via API or database
   # Update TEST_USERS in k6-load-test.js or test-users.csv for Artillery
   ```

2. **Create Test Listings:**
   ```bash
   # Ensure test listings exist in database
   # Update listing IDs in test scripts if needed
   ```

3. **Configure Environment:**
   ```bash
   export BASE_URL=http://localhost:8000
   export DATABASE_URL=postgresql://...
   export REDIS_URL=redis://...
   ```

## Monitoring During Tests

### Key Metrics to Monitor:

1. **Application Metrics:**
   - Request rate (RPS)
   - Response times (p50, p95, p99)
   - Error rates
   - Database connection pool usage
   - Redis connection pool usage

2. **Infrastructure Metrics:**
   - CPU usage
   - Memory usage
   - Network I/O
   - Database CPU/Memory
   - Redis CPU/Memory

3. **Business Metrics:**
   - Bookings created per second
   - Search queries per second
   - Payment intents created per second

### Monitoring Tools:

- **Prometheus + Grafana** (if configured)
- **Application logs** (check for errors)
- **Database monitoring** (pg_stat_statements)
- **Redis monitoring** (INFO command)

## Bottleneck Identification

Common bottlenecks to check:

1. **Database:**
   - Connection pool exhaustion
   - Slow queries (check pg_stat_statements)
   - Lock contention
   - Read replica lag

2. **Redis:**
   - Connection pool exhaustion
   - Memory pressure
   - Network latency

3. **Application:**
   - CPU-bound operations
   - Memory leaks
   - GIL contention (if using Python threads)

4. **Network:**
   - Bandwidth limits
   - Connection limits
   - DNS resolution delays

## Fixing Bottlenecks

### Database:
- Increase connection pool size
- Optimize slow queries
- Add database indexes
- Use read replicas for read-heavy queries
- Enable connection pooling (PgBouncer)

### Redis:
- Increase connection pool size
- Use Redis Cluster for high availability
- Implement caching strategies
- Monitor memory usage

### Application:
- Optimize code paths
- Use async/await properly
- Implement request queuing
- Add rate limiting
- Use CDN for static assets

## CI/CD Integration

Add load testing to CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: backend/k6-load-test.js
          cloud: true
          cloud-project-id: ${{ secrets.K6_CLOUD_PROJECT_ID }}
```

## Results Analysis

After running tests, analyze:

1. **Response Time Distribution:**
   - Identify slow endpoints
   - Check for outliers
   - Compare p50, p95, p99

2. **Error Analysis:**
   - Categorize errors (4xx vs 5xx)
   - Identify error patterns
   - Check error messages

3. **Throughput Analysis:**
   - Requests per second
   - Successful requests vs failed
   - Peak vs sustained load

4. **Resource Utilization:**
   - CPU usage patterns
   - Memory usage patterns
   - Database/Redis usage

## Performance Budget

Target performance metrics:

- **Booking Creation:** < 250ms p95
- **Search Queries:** < 100ms p95
- **Availability Check:** < 50ms p95
- **Price Calculation:** < 100ms p95
- **Error Rate:** < 0.1%
- **Uptime:** > 99.9%

## Troubleshooting

### High Error Rates:
1. Check application logs
2. Check database connection pool
3. Check Redis connection pool
4. Check network connectivity
5. Check rate limiting settings

### Slow Response Times:
1. Profile application code
2. Check database query performance
3. Check Redis latency
4. Check network latency
5. Check for N+1 queries

### Test Failures:
1. Verify test users exist
2. Verify test listings exist
3. Check authentication tokens
4. Verify API endpoints are correct
5. Check test script syntax

