"""
Database configuration.

SQLAlchemy 2.0 async setup with read replica support.
"""
from typing import AsyncGenerator, Optional, List
import random
import logging
from urllib.parse import urlparse
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

logger = logging.getLogger(__name__)
settings = get_settings()

# Base class for all models
Base = declarative_base()

# Parse database URL for better error messages
def parse_db_url(db_url: str) -> dict:
    """Parse database URL to extract connection details."""
    try:
        parsed = urlparse(str(db_url))
        return {
            "host": parsed.hostname or "unknown",
            "port": parsed.port or 5432,
            "database": parsed.path.lstrip("/") if parsed.path else "unknown",
            "user": parsed.username or "unknown"
        }
    except Exception as e:
        logger.warning(f"Failed to parse database URL: {e}")
        return {"host": "unknown", "port": 5432, "database": "unknown", "user": "unknown"}

# Database connection configuration
# Add timeouts to prevent hanging on DNS resolution failures
db_info = parse_db_url(settings.database_url)
connect_args = {
    "command_timeout": 30,  # 30 seconds for query execution
    "server_settings": {
        "default_transaction_isolation": "repeatable read"
    }
} if settings.environment != "test" else {
    "command_timeout": 30
}

# Primary (Write) Engine
# CRITICAL: Set explicit isolation level for booking transactions
# REPEATABLE READ prevents phantom reads and ensures consistency for concurrent bookings
# For asyncpg, we set this via connect_args which is applied per connection
try:
    engine: AsyncEngine = create_async_engine(
        str(settings.database_url),
        echo=settings.debug,
        poolclass=NullPool if settings.environment == "test" else None,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=40,
        connect_args=connect_args,
    )
    logger.info(f"Database engine created for host: {db_info['host']}:{db_info['port']}")
except Exception as e:
    error_msg = str(e)
    if "name resolution" in error_msg.lower() or "gaierror" in error_msg.lower() or "temporary failure" in error_msg.lower():
        logger.error(
            f"DNS resolution failed for database host '{db_info['host']}'.\n"
            f"Common causes:\n"
            f"  1. In Docker: Ensure you're using the service name (e.g., 'postgres') not 'localhost'\n"
            f"  2. Check POSTGRES_SERVER or DATABASE_URL environment variable is set correctly\n"
            f"  3. Ensure the database service is running\n"
            f"  4. Ensure containers are on the same network\n"
            f"  5. Try restarting the database service\n"
            f"Current database host: {db_info['host']}"
        )
    raise

# Read Replica Engines (for read-only queries)
read_replica_engines: List[AsyncEngine] = []
read_replica_sessions: List[async_sessionmaker] = []

if settings.postgres_read_replica_enabled and settings.postgres_read_replica_url:
    # Parse comma-separated replica URLs or use single URL
    replica_urls = str(settings.postgres_read_replica_url).split(",")
    
    for replica_url in replica_urls:
        replica_url = replica_url.strip()
        if replica_url:
            replica_info = parse_db_url(replica_url)
            replica_connect_args = {
                "command_timeout": 30,
            } if settings.environment != "test" else {
                "command_timeout": 30
            }
            try:
                replica_engine = create_async_engine(
                    replica_url,
                    echo=settings.debug,
                    poolclass=NullPool if settings.environment == "test" else None,
                    pool_pre_ping=True,
                    pool_size=10,  # Smaller pool for read replicas
                    max_overflow=20,
                    # Read replicas use default isolation level (READ COMMITTED)
                    connect_args=replica_connect_args,
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
                logger.info(f"Read replica engine created for host: {replica_info['host']}:{replica_info['port']}")
            except Exception as e:
                error_msg = str(e)
                if "name resolution" in error_msg.lower() or "gaierror" in error_msg.lower():
                    logger.error(
                        f"DNS resolution failed for read replica host '{replica_info['host']}'. "
                        f"Skipping this replica. Error: {error_msg}"
                    )
                else:
                    logger.error(f"Failed to create read replica engine for {replica_info['host']}: {error_msg}")
                    raise

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
    
    Raises:
        ConnectionError: If database connection fails with DNS resolution error
    """
    try:
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                # Check for DNS resolution errors and provide helpful error message
                error_msg = str(e)
                if "name resolution" in error_msg.lower() or "gaierror" in error_msg.lower() or "temporary failure" in error_msg.lower():
                    db_info = parse_db_url(settings.database_url)
                    raise ConnectionError(
                        f"Database connection failed: DNS resolution error for host '{db_info['host']}'.\n"
                        f"Please check:\n"
                        f"  1. POSTGRES_SERVER or DATABASE_URL environment variable\n"
                        f"  2. Database service is running and accessible\n"
                        f"  3. Network connectivity to database host\n"
                        f"  4. In Docker: use service name, not 'localhost'\n"
                        f"Original error: {error_msg}"
                    ) from e
                raise
            finally:
                await session.close()
    except ConnectionError:
        # Re-raise connection errors as-is
        raise
    except Exception as e:
        # Wrap other exceptions that might be connection-related
        error_msg = str(e)
        if "name resolution" in error_msg.lower() or "gaierror" in error_msg.lower():
            db_info = parse_db_url(settings.database_url)
            raise ConnectionError(
                f"Database connection failed: DNS resolution error for host '{db_info['host']}'.\n"
                f"Please check your database configuration and network connectivity.\n"
                f"Original error: {error_msg}"
            ) from e
        raise


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a read replica session for read-only queries.
    
    Falls back to primary database if no replicas are configured.
    Use this for search, analytics, and other read-heavy operations.
    
    Raises:
        ConnectionError: If database connection fails with DNS resolution error
    """
    replica_session_factory = get_read_replica_session()
    
    try:
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
    except Exception as e:
        # Check for DNS resolution errors and provide helpful error message
        error_msg = str(e)
        if "name resolution" in error_msg.lower() or "gaierror" in error_msg.lower() or "temporary failure" in error_msg.lower():
            db_info = parse_db_url(settings.database_url)
            raise ConnectionError(
                f"Database connection failed: DNS resolution error for host '{db_info['host']}'.\n"
                f"Please check your database configuration and network connectivity.\n"
                f"Original error: {error_msg}"
            ) from e
        raise


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

