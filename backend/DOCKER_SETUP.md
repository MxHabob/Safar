# Docker Setup Guide - دليل إعداد Docker

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env and update the values
nano .env  # or use your preferred editor
```

### 2. Start Services

```bash
# Using Makefile (recommended)
make build
make up

# Or using docker-compose directly
docker-compose build
docker-compose up -d
```

### 3. Initialize Database

```bash
# Run migrations
make migrate

# Or manually
docker-compose exec backend alembic upgrade head
```

### 4. Access Services

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower (Celery)**: http://localhost:5555 (if enabled)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Services

### Backend API
- **Container**: `safar_backend`
- **Port**: 8000
- **Health Check**: `/health`

### PostgreSQL (with PostGIS)
- **Container**: `safar_postgres`
- **Image**: `postgis/postgis:16-3.4-alpine`
- **Port**: 5432
- **Extensions**: PostGIS, PostGIS Topology, UUID

### Redis
- **Container**: `safar_redis`
- **Port**: 6379
- **Persistence**: AOF (Append Only File)

### Celery Worker
- **Container**: `safar_celery_worker`
- **Purpose**: Background task processing

### Celery Beat
- **Container**: `safar_celery_beat`
- **Purpose**: Scheduled tasks

### Flower (Optional)
- **Container**: `safar_flower`
- **Port**: 5555
- **Purpose**: Celery monitoring
- **Enable**: `docker-compose --profile monitoring up -d`

## Common Commands

### Using Makefile

```bash
make help          # Show all available commands
make build         # Build Docker images
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make logs          # View logs
make logs-backend  # View backend logs only
make shell         # Open shell in backend container
make shell-db      # Open PostgreSQL shell
make migrate       # Run database migrations
make test          # Run tests
make clean         # Remove all containers and volumes
```

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build

# Execute commands
docker-compose exec backend python manage.py <command>
docker-compose exec backend alembic upgrade head
```

## Production Deployment

### Using Production Override

```bash
# Start production services
make prod-up

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Configuration

1. Update `.env` with production values
2. Set `ENVIRONMENT=production`
3. Set `DEBUG=False`
4. Generate strong `SECRET_KEY`: `openssl rand -hex 32`
5. Configure proper `CORS_ORIGINS`
6. Set up proper database backups
7. Configure monitoring (Sentry, etc.)

## Environment Variables

See `env.example` for all available environment variables.

### Required Variables

- `POSTGRES_PASSWORD` - Database password
- `SECRET_KEY` - Application secret key (generate with `openssl rand -hex 32`)

### Important Security Notes

1. **Never commit `.env` file to version control**
2. **Use strong passwords in production**
3. **Generate unique SECRET_KEY for each environment**
4. **Restrict CORS_ORIGINS in production**
5. **Use environment-specific values**

## Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U safar_user -d safar_db
```

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Check if database is ready
docker-compose exec backend python -c "import asyncpg; print('DB OK')"
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend alembic upgrade head
```

### Volume Issues

```bash
# Remove all volumes
make clean-volumes

# Or manually
docker-compose down -v
```

## Development Tips

1. **Hot Reload**: Backend automatically reloads on code changes
2. **Database Access**: Use `make shell-db` to access PostgreSQL
3. **Logs**: Use `make logs-backend` to monitor backend logs
4. **Testing**: Use `make test` to run tests in container

## File Structure

```
backend/
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Development configuration
├── docker-compose.prod.yml # Production overrides
├── .dockerignore           # Files to exclude from build
├── env.example             # Environment variables template
├── Makefile                # Convenience commands
└── scripts/
    └── init_db.sql         # Database initialization script
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Backend**: HTTP GET `/health`

Check health status:
```bash
docker-compose ps
```

## Backup & Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U safar_user safar_db > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U safar_user safar_db < backup.sql
```

## Security Best Practices

1. ✅ Use non-root user in containers
2. ✅ Set strong passwords
3. ✅ Use secrets management in production
4. ✅ Enable Redis password
5. ✅ Restrict network access
6. ✅ Regular security updates
7. ✅ Monitor logs for suspicious activity

