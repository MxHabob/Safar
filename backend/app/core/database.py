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

from app.core.config import get_settings

settings = get_settings()

# Base class for all models
Base = declarative_base()

# Async Engine
engine: AsyncEngine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    poolclass=NullPool if settings.ENVIRONMENT == "test" else None,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=40,
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


async def init_db() -> None:
    """تهيئة قاعدة البيانات - Initialize database"""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """إغلاق اتصالات قاعدة البيانات - Close database connections"""
    await engine.dispose()

