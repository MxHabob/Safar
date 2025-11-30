"""
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import RequestValidationError
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
    RequestMonitoringMiddleware
)
from app.api.v1.router import api_router

from app.core.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Safar API...")
    
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

# CORS Middleware - CRITICAL: Use list property, never wildcard in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods_list,
    allow_headers=settings.cors_allow_headers_list,
)

# Security Middleware (order matters - apply in reverse order)
# 1. Request Monitoring (outermost - logs all requests)
app.add_middleware(RequestMonitoringMiddleware)

# 2. Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Bot Detection (before rate limiting)
app.add_middleware(BotDetectionMiddleware)

# 4. Rate Limiting (innermost - applied last)
if settings.rate_limit_enabled:
    app.add_middleware(EnhancedRateLimitMiddleware)


# Request logging is now handled by RequestMonitoringMiddleware
# Removed duplicate logging middleware


# Exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
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
        reload=settings.debug
    )

