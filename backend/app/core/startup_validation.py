"""
Production Startup Validation
CRITICAL: Validates all production requirements before allowing service to start
"""
import logging
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.core.database import AsyncSessionLocal, engine
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class StartupValidationError(Exception):
    """Raised when startup validation fails - prevents service from starting"""
    pass


class StartupValidator:
    """Validates critical production requirements at startup"""
    
    @staticmethod
    async def validate_all() -> None:
        """Run all startup validations. Raises StartupValidationError if any fail."""
        errors: List[str] = []
        warnings: List[str] = []
        
        # Critical validations (must pass)
        logger.info("Starting production startup validation...")
        
        # 1. Database connection
        try:
            await StartupValidator._validate_database_connection()
            logger.info("✓ Database connection validated")
        except Exception as e:
            errors.append(f"Database connection failed: {str(e)}")
        
        # 2. Exclusion constraint (CRITICAL for double-booking prevention)
        if settings.environment == "production":
            try:
                await StartupValidator._validate_exclusion_constraint()
                logger.info("✓ Booking exclusion constraint validated")
            except Exception as e:
                errors.append(f"CRITICAL: Exclusion constraint validation failed: {str(e)}")
        
        # 3. btree_gist extension (required for exclusion constraint)
        if settings.environment == "production":
            try:
                await StartupValidator._validate_btree_gist_extension()
                logger.info("✓ btree_gist extension validated")
            except Exception as e:
                errors.append(f"CRITICAL: btree_gist extension validation failed: {str(e)}")
        
        # 4. SECRET_KEY strength
        try:
            StartupValidator._validate_secret_key()
            logger.info("✓ SECRET_KEY validated")
        except Exception as e:
            if settings.environment == "production":
                errors.append(f"CRITICAL: SECRET_KEY validation failed: {str(e)}")
            else:
                warnings.append(f"SECRET_KEY validation warning: {str(e)}")
        
        # 5. Required environment variables
        try:
            StartupValidator._validate_environment_variables()
            logger.info("✓ Environment variables validated")
        except Exception as e:
            if settings.environment == "production":
                errors.append(f"CRITICAL: Environment validation failed: {str(e)}")
            else:
                warnings.append(f"Environment validation warning: {str(e)}")
        
        # 6. Webhook events table (for idempotency)
        if settings.environment == "production":
            try:
                await StartupValidator._validate_webhook_events_table()
                logger.info("✓ Webhook events table validated")
            except Exception as e:
                warnings.append(f"Webhook events table validation warning: {str(e)}")
        
        # Log warnings
        for warning in warnings:
            logger.warning(f"⚠️  {warning}")
        
        # Fail if any critical errors
        if errors:
            error_msg = "CRITICAL: Startup validation failed. Service cannot start.\n" + "\n".join(f"  - {e}" for e in errors)
            logger.error(error_msg)
            raise StartupValidationError(error_msg)
        
        logger.info("✓ All startup validations passed")
    
    @staticmethod
    async def _validate_database_connection() -> None:
        """Validate database connection"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
    
    @staticmethod
    async def _validate_exclusion_constraint() -> None:
        """Validate that exclusion constraint exists (CRITICAL for double-booking prevention)"""
        async with AsyncSessionLocal() as session:
            # Check if constraint exists
            query = text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'bookings' 
                AND constraint_name = 'excl_booking_overlap'
                AND constraint_type = 'EXCLUDE'
            """)
            result = await session.execute(query)
            constraint = result.scalar_one_or_none()
            
            if not constraint:
                raise StartupValidationError(
                    "CRITICAL: Exclusion constraint 'excl_booking_overlap' not found on bookings table. "
                    "This constraint is REQUIRED to prevent double-booking. "
                    "Run migration: alembic upgrade head"
                )
    
    @staticmethod
    async def _validate_btree_gist_extension() -> None:
        """Validate that btree_gist extension is installed (required for exclusion constraint)"""
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT EXISTS(
                    SELECT 1 
                    FROM pg_extension 
                    WHERE extname = 'btree_gist'
                )
            """)
            result = await session.execute(query)
            exists = result.scalar()
            
            if not exists:
                raise StartupValidationError(
                    "CRITICAL: PostgreSQL extension 'btree_gist' is not installed. "
                    "This extension is REQUIRED for the booking exclusion constraint. "
                    "Install with: CREATE EXTENSION IF NOT EXISTS btree_gist;"
                )
    
    @staticmethod
    def _validate_secret_key() -> None:
        """Validate SECRET_KEY strength"""
        weak_keys = [
            "your-secret-key-change-in-production-use-openssl-rand-hex-32",
            "secret",
            "changeme",
            "default",
            "change-this-secret-key-in-production",
            "change-this-secret-key-generate-using-openssl-rand-hex-32",
        ]
        
        if settings.secret_key in weak_keys or len(settings.secret_key) < 32:
            if settings.environment == "production":
                raise StartupValidationError(
                    "CRITICAL: SECRET_KEY is weak or default. This is a CRITICAL security risk in production. "
                    "SECRET_KEY must be at least 32 characters long and not use default values. "
                    "Generate a strong key using: openssl rand -hex 32"
                )
            else:
                logger.warning(
                    "⚠️  WARNING: Using weak SECRET_KEY. This is unsafe for production! "
                    "Generate a strong key using: openssl rand -hex 32"
                )
    
    @staticmethod
    def _validate_environment_variables() -> None:
        """Validate required environment variables"""
        required_vars = []
        
        # Production-specific requirements
        if settings.environment == "production":
            if not settings.stripe_secret_key:
                required_vars.append("STRIPE_SECRET_KEY")
            if not settings.stripe_webhook_secret:
                required_vars.append("STRIPE_WEBHOOK_SECRET")
            if not settings.database_url:
                required_vars.append("DATABASE_URL")
        
        if required_vars:
            raise StartupValidationError(
                f"CRITICAL: Required environment variables not set: {', '.join(required_vars)}"
            )
    
    @staticmethod
    async def _validate_webhook_events_table() -> None:
        """Validate webhook_events table exists (for idempotency)"""
        async with AsyncSessionLocal() as session:
            query = text("""
                SELECT EXISTS(
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_name = 'webhook_events'
                )
            """)
            result = await session.execute(query)
            exists = result.scalar()
            
            if not exists:
                logger.warning(
                    "⚠️  Webhook events table not found. Webhook idempotency may not work correctly. "
                    "Run migration: alembic upgrade head"
                )

