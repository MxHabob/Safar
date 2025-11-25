"""
Alembic Environment Configuration
"""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config, create_async_engine

from alembic import context

# Import settings and base
from app.core.config import get_settings
from app.core.database import Base
from app.core.models import *  # Import all models

# this is the Alembic Config object
config = context.config

# Get database URL from settings
settings = get_settings()
# Keep async driver for async migrations
config.set_main_option("sqlalchemy.url", str(settings.database_url))

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    # For offline mode, use sync driver (psycopg2)
    sync_url = url.replace("+asyncpg", "+psycopg2") if "+asyncpg" in url else url
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    # Ensure we have async driver in the URL
    # Pydantic's PostgresDsn might normalize the scheme, so we need to ensure +asyncpg is present
    db_url = str(settings.database_url)
    
    # If URL already has +asyncpg, use it as-is
    if "+asyncpg" in db_url:
        pass  # Already has async driver
    # If URL has a different driver (like +psycopg2), replace it
    elif "+" in db_url and "://" in db_url:
        # Extract scheme and rest of URL
        scheme_part, rest = db_url.split("://", 1)
        # Remove any existing driver
        base_scheme = scheme_part.split("+")[0]
        db_url = f"{base_scheme}+asyncpg://{rest}"
    # If URL has no driver, add +asyncpg
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    # Use create_async_engine directly for better control
    connectable = create_async_engine(
        db_url,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

