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
from app.core.session_middleware import SessionValidationMiddleware
from app.api.v1.router import api_router

from app.core.logging_config import setup_logging, get_uvicorn_log_config
from app.core.tracing import setup_tracing, instrument_app
from app.core import models

setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Safar API...")
    
    setup_tracing()
    
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
                send_default_pii=False,
                before_send=lambda event, hint: event,
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
    
    try:
        from app.core.startup_validation import StartupValidator
        await StartupValidator.validate_all()
        logger.info("✓ All startup validations passed - service ready")
    except Exception as e:
        logger.critical(f"CRITICAL: Startup validation failed: {e}")
        if settings.environment == "production":
            raise
        else:
            logger.warning("⚠️  Startup validation failed but continuing in non-production mode")
    
    yield
    logger.info("Shutting down Safar API...")
    await close_db()
    logger.info("Database connections closed")


docs_enabled = settings.environment.lower() != "production"
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json",
    lifespan=lifespan
)

instrument_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods_list,
    allow_headers=settings.cors_allow_headers_list,
    max_age=3600,
)


app.add_middleware(RequestMonitoringMiddleware)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(BotDetectionMiddleware)

app.add_middleware(CORSPreflightMiddleware)

# Session validation middleware (after CORS, before rate limiting)
app.add_middleware(SessionValidationMiddleware)

if settings.rate_limit_enabled:
    app.add_middleware(EnhancedRateLimitMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    response_content = {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code
    }
    
    headers = {}
    if exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        headers["Retry-After"] = "60"
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_content,
        headers=headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Safely convert errors to JSON-serializable format
    try:
        errors = exc.errors()
        # Ensure all error details are JSON serializable
        serializable_errors = []
        for error in errors:
            serializable_error = {}
            for key, value in error.items():
                # Convert any non-serializable values to strings
                try:
                    import json
                    json.dumps(value)  # Test if value is JSON serializable
                    serializable_error[key] = value
                except (TypeError, ValueError):
                    # Convert non-serializable values to strings
                    serializable_error[key] = str(value) if value is not None else None
            serializable_errors.append(serializable_error)
        
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Validation error",
                "details": serializable_errors,
                "status_code": 422
            }
        )
    except Exception as e:
        # Fallback if error serialization fails
        logger.error(f"Error in validation exception handler: {e}", exc_info=True)
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Validation error",
                "details": [{"msg": str(exc), "type": "validation_error"}],
                "status_code": 422
            }
        )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError exceptions"""
    logger.warning(f"ValueError: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={
            "error": True,
            "message": str(exc),
            "status_code": 400
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (StarletteHTTPException, FastAPIHTTPException)):
        if hasattr(exc, 'status_code') and exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            raise exc
        raise exc
    
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except Exception:
            pass
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500
        }
    )


@app.get("/health")
async def health_check():
    from app.core.monitoring import HealthChecker
    import json
    health = await HealthChecker.get_health_status()
    
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
    
    return PlainTextResponse(
        content=settings.apple_pay_domain_association,
        media_type="text/plain"
    )


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
        use_colors=False,
        log_level="info",
        access_log=True,
    )

