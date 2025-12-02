"""
Database configuration.

SQLAlchemy 2.0 async setup with read replica support.
"""
from typing import AsyncGenerator, Optional, List
import random
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app.core.config import get_settings

settings = get_settings()

# Base class for all models
Base = declarative_base()

# Primary (Write) Engine
# CRITICAL: Set explicit isolation level for booking transactions
# REPEATABLE READ prevents phantom reads and ensures consistency for concurrent bookings
# For asyncpg, we set this via connect_args which is applied per connection
engine: AsyncEngine = create_async_engine(
    str(settings.database_url),
    echo=settings.debug,
    poolclass=NullPool if settings.environment == "test" else None,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=40,
    # Set default isolation level to REPEATABLE READ for better consistency
    # This prevents phantom reads in concurrent booking scenarios
    connect_args={
        "server_settings": {
            "default_transaction_isolation": "repeatable read"
        }
    } if settings.environment != "test" else {},
)

# Read Replica Engines (for read-only queries)
read_replica_engines: List[AsyncEngine] = []
read_replica_sessions: List[async_sessionmaker] = []

if settings.postgres_read_replica_enabled and settings.postgres_read_replica_url:
    # Parse comma-separated replica URLs or use single URL
    replica_urls = str(settings.postgres_read_replica_url).split(",")
    
    for replica_url in replica_urls:
        replica_url = replica_url.strip()
        if replica_url:
            replica_engine = create_async_engine(
                replica_url,
                echo=settings.debug,
                poolclass=NullPool if settings.environment == "test" else None,
                pool_pre_ping=True,
                pool_size=10,  # Smaller pool for read replicas
                max_overflow=20,
                # Read replicas use default isolation level (READ COMMITTED)
                connect_args={} if settings.environment != "test" else {},
            )
            read_replica_engines.append(replica_engine)
            read_replica_sessions.append(
                async_sessionmaker(
                    replica_engine,
                    class_=AsyncSession,
                    expire_on_commit=False,
                    autocommit=False,
                    autoflush=False,
                )
            )

# Async Session Factory (Primary/Write)
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


def get_read_replica_session() -> Optional[async_sessionmaker]:
    """
    Get a read replica session factory.
    
    Returns a random replica session if replicas are configured,
    otherwise returns None (will fall back to primary).
    """
    if read_replica_sessions:
        # Load balance across replicas
        return random.choice(read_replica_sessions)
    return None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.
    
    Uses primary (write) database for all operations.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a read replica session for read-only queries.
    
    Falls back to primary database if no replicas are configured.
    Use this for search, analytics, and other read-heavy operations.
    """
    replica_session_factory = get_read_replica_session()
    
    if replica_session_factory:
        # Use read replica
        async with replica_session_factory() as session:
            try:
                yield session
                # Read-only: no commit needed
            finally:
                await session.close()
    else:
        # Fall back to primary database
        async with AsyncSessionLocal() as session:
            try:
                yield session
                # Read-only: no commit needed
            finally:
                await session.close()


DB_INIT_LOCK_KEY = 874512987  # Arbitrary constant for advisory lock


async def init_db() -> None:
    """Initialize the database schema in a concurrency-safe way."""
    async with engine.begin() as conn:
        lock_acquired = False
        if conn.dialect.name == "postgresql":
            await conn.execute(
                text("SELECT pg_advisory_lock(:lock_id)"),
                {"lock_id": DB_INIT_LOCK_KEY},
            )
            lock_acquired = True
        try:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        finally:
            if lock_acquired:
                await conn.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"),
                    {"lock_id": DB_INIT_LOCK_KEY},
                )


async def close_db() -> None:
    """Close all database connections and dispose the engines."""
    await engine.dispose()
    # Close read replica engines
    for replica_engine in read_replica_engines:
        await replica_engine.dispose()

