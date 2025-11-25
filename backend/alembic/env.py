"""
Alembic Environment Configuration
"""
import asyncio
import logging
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config, create_async_engine

from alembic import context

# Import settings and base
from app.core.config import get_settings
from app.core.database import Base
from app.core.models import *  # Import all models

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# this is the Alembic Config object
config = context.config

# Get database URL from settings
settings = get_settings()
# Keep async driver for async migrations
config.set_main_option("sqlalchemy.url", str(settings.database_url))

# Log database connection info (without password)
db_url_safe = str(settings.database_url).split('@')[-1] if '@' in str(settings.database_url) else str(settings.database_url)
logger.info(f"Database host: {settings.postgres_server}")
logger.info(f"Database name: {settings.postgres_db}")
logger.info(f"Database URL (safe): postgresql://...@{db_url_safe}")

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


async def wait_for_database(db_url: str, max_retries: int = 30, retry_delay: float = 1.0) -> None:
    """Wait for database to be available with retry logic."""
    import asyncpg
    import socket
    from urllib.parse import urlparse
    
    # Parse database URL to extract connection parameters
    parsed = urlparse(db_url.replace("postgresql+asyncpg://", "postgresql://"))
    host = parsed.hostname or settings.postgres_server
    port = parsed.port or settings.postgres_port
    user = parsed.username or settings.postgres_user
    password = parsed.password or settings.postgres_password
    database = parsed.path.lstrip('/') or settings.postgres_db
    
    logger.info(f"Waiting for database at {host}:{port}...")
    
    # Check if hostname can be resolved
    try:
        socket.gethostbyname(host)
    except socket.gaierror as e:
        error_msg = (
            f"DNS resolution failed for database host '{host}'. "
            f"This usually means the hostname cannot be resolved.\n"
            f"Common causes:\n"
            f"  1. In Docker: Use the service name (e.g., 'postgres') not 'localhost'\n"
            f"  2. Check POSTGRES_SERVER environment variable is set correctly\n"
            f"  3. Ensure the database service is running and on the same network\n"
            f"Current POSTGRES_SERVER value: {settings.postgres_server}"
        )
        logger.error(error_msg)
        raise ConnectionError(error_msg) from e
    
    for attempt in range(max_retries):
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    database=database
                ),
                timeout=2.0
            )
            await conn.close()
            logger.info(f"Database is ready after {attempt + 1} attempt(s)")
            return
        except (asyncpg.exceptions.ConnectionDoesNotExistError, 
                asyncpg.exceptions.InvalidPasswordError,
                OSError,
                asyncio.TimeoutError) as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database connection attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts")
                logger.error(f"Database host: {host}")
                logger.error(f"Database port: {port}")
                logger.error(f"Database name: {database}")
                logger.error(f"User: {user}")
                error_msg = (
                    f"Could not connect to database at {host}:{port} after {max_retries} attempts.\n"
                    f"Please ensure:\n"
                    f"  1. The database service is running\n"
                    f"  2. The hostname is correct (use service name in Docker, not 'localhost')\n"
                    f"  3. Network connectivity is available\n"
                    f"  4. Credentials are correct"
                )
                raise ConnectionError(error_msg) from e


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
    
    # Wait for database to be available
    try:
        await wait_for_database(db_url)
    except ConnectionError:
        # Re-raise connection errors with better context
        raise
    
    # Use create_async_engine directly for better control
    logger.info("Creating database engine...")
    connectable = create_async_engine(
        db_url,
        poolclass=pool.NullPool,
        connect_args={
            "server_settings": {
                "application_name": "alembic"
            }
        }
    )

    try:
        logger.info("Connecting to database and running migrations...")
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        logger.info("Migrations completed successfully")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

