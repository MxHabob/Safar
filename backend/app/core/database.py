"""
إعداد قاعدة البيانات - Database Configuration
SQLAlchemy 2.0 Async Setup
"""
from typing import AsyncGenerator
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

# Async Engine
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

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency للحصول على جلسة قاعدة البيانات
    Database session dependency for FastAPI
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


DB_INIT_LOCK_KEY = 874512987  # Arbitrary constant for advisory lock


async def init_db() -> None:
    """تهيئة قاعدة البيانات - Initialize database"""
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
    """إغلاق اتصالات قاعدة البيانات - Close database connections"""
    await engine.dispose()

