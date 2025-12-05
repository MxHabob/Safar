"""
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import RequestValidationError, HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import logging

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.middleware import (
    RateLimitMiddleware,
    EnhancedRateLimitMiddleware,
    BotDetectionMiddleware,
    SecurityHeadersMiddleware,
    RequestMonitoringMiddleware,
    CORSPreflightMiddleware
)
from app.api.v1.router import api_router

from app.core.logging_config import setup_logging, get_uvicorn_log_config
from app.core.tracing import setup_tracing, instrument_app
from app.core import models

# Setup logging (will be idempotent if already configured)
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Safar API...")
    
    # Initialize OpenTelemetry distributed tracing
    setup_tracing()
    
    # Initialize Sentry for error tracking (if configured)
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            from sentry_sdk.integrations.asyncio import AsyncioIntegration
            
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                environment=settings.sentry_environment,
                integrations=[
                    FastApiIntegration(transaction_style="endpoint"),
                    SqlalchemyIntegration(),
                    AsyncioIntegration(),
                ],
                traces_sample_rate=1.0 if settings.environment == "production" else 0.1,
                profiles_sample_rate=1.0 if settings.environment == "production" else 0.1,
                send_default_pii=False,  # Don't send PII by default
                before_send=lambda event, hint: event,  # Can add filtering here
            )
            logger.info(f"Sentry initialized for environment: {settings.sentry_environment}")
        except ImportError:
            logger.warning("Sentry SDK not installed. Install with: pip install sentry-sdk[fastapi]")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}", exc_info=True)
    else:
        logger.info("Sentry DSN not configured - error tracking disabled")
    
    await init_db()
    logger.info("Database initialized")
    
    # CRITICAL: Run startup validation (fails hard if critical requirements not met)
    try:
        from app.core.startup_validation import StartupValidator
        await StartupValidator.validate_all()
        logger.info("✓ All startup validations passed - service ready")
    except Exception as e:
        logger.critical(f"CRITICAL: Startup validation failed: {e}")
        # In production, we should fail hard
        if settings.environment == "production":
            raise
        else:
            logger.warning("⚠️  Startup validation failed but continuing in non-production mode")
    
    yield
    logger.info("Shutting down Safar API...")
    await close_db()
    logger.info("Database connections closed")


# Create FastAPI app (disable docs in production for security)
docs_enabled = settings.environment.lower() != "production"
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Instrument app with OpenTelemetry (after app creation)
instrument_app(app)

# CORS Middleware - CRITICAL: Must be added FIRST (executes LAST in reverse order)
# FastAPI's CORSMiddleware automatically handles OPTIONS preflight requests
# Security: Only allow explicit origins, never wildcards in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Explicit list only - no wildcards
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods_list,  # Must include OPTIONS
    allow_headers=settings.cors_allow_headers_list,
    max_age=3600,  # Cache preflight requests for 1 hour (reduces server load)
)

# Security Middleware Stack (order matters - executes in REVERSE order of addition)
# Execution order (innermost to outermost):
#   1. Rate Limiting (if enabled) - First to execute, protects against abuse
#   2. Bot Detection - Blocks automated requests
#   3. Security Headers - Adds security headers to responses
#   4. Request Monitoring - Logs all requests for analysis
#   5. CORS Preflight - Handles OPTIONS requests before route handlers
#   6. CORS Middleware - Last to execute, handles CORS headers
#
# Note: All security middlewares skip OPTIONS requests to allow CORS preflight
# This maintains security while enabling cross-origin requests from allowed origins

# 1. Request Monitoring (outermost - logs all requests, executes last)
app.add_middleware(RequestMonitoringMiddleware)

# 2. Security Headers (adds security headers to all responses)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Bot Detection (blocks automated/scraper requests, before rate limiting)
app.add_middleware(BotDetectionMiddleware)

# 4. CORS Preflight (handles OPTIONS requests before route handlers)
app.add_middleware(CORSPreflightMiddleware)

# 5. Rate Limiting (innermost - first to execute, protects against abuse)
if settings.rate_limit_enabled:
    app.add_middleware(EnhancedRateLimitMiddleware)


# Request logging is now handled by RequestMonitoringMiddleware
# Removed duplicate logging middleware


# Exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    response_content = {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code
    }
    
    # Add Retry-After header for rate limit errors
    headers = {}
    if exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        headers["Retry-After"] = "60"  # Retry after 60 seconds
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_content,
        headers=headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": "Validation error",
            "details": exc.errors(),
            "status_code": 422
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Re-raise HTTPException so it can be handled by the specific handler
    # FastAPI's HTTPException is a subclass of StarletteHTTPException
    if isinstance(exc, (StarletteHTTPException, FastAPIHTTPException)):
        # For 429 errors, don't log as errors - they're expected behavior
        if hasattr(exc, 'status_code') and exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            # Rate limiting is working as intended, no need to log as error
            raise exc
        raise exc
    
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Send to Sentry if configured
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except Exception:
            pass  # Don't fail if Sentry is unavailable
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500
        }
    )


# Health check - CRITICAL: Returns 200 only if all services are healthy
@app.get("/health")
async def health_check():
    from app.core.monitoring import HealthChecker
    import json
    health = await HealthChecker.get_health_status()
    
    # Return 503 if any critical service is unhealthy
    if health["status"] != "healthy":
        return JSONResponse(
            content=health,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    return health


@app.get("/health/ready")
async def readiness_check():
    from app.core.monitoring import HealthChecker
    health = await HealthChecker.get_health_status()
    
    if health["status"] == "healthy":
        return health
    else:
        from fastapi import Response
        return Response(
            content=health,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@app.get("/health/live")
async def liveness_check():
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


# Apple Pay Domain Association (required for Apple Pay)
@app.get("/.well-known/apple-developer-merchantid-domain-association")
async def apple_pay_domain_association():
    """
    Apple Pay domain association file.
    
    CRITICAL: This endpoint serves the domain association file required by Apple Pay.
    The file content should be configured via APPLE_PAY_DOMAIN_ASSOCIATION environment variable.
    """
    from app.core.config import get_settings
    from fastapi.responses import PlainTextResponse
    
    settings = get_settings()
    
    if not settings.apple_pay_domain_association:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apple Pay domain association not configured"
        )
    
    # Return the domain association file content
    # Content-Type should be text/plain
    return PlainTextResponse(
        content=settings.apple_pay_domain_association,
        media_type="text/plain"
    )


# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Safar API",
        "version": settings.app_version,
        "openapi": "/openapi.json",
        "docs": "/docs" if docs_enabled else None,
        "health": "/health" if docs_enabled else None,
        "ready": "/health/ready" if docs_enabled else None,
        "live": "/health/live" if docs_enabled else None,
        "redoc": "/redoc" if docs_enabled else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        use_colors=False,  # Disable colors in Docker/containers
        log_level="info",  # Set log level explicitly
        access_log=True,  # Enable access logs
    )

