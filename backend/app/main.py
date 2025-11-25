"""
تطبيق FastAPI الرئيسي - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import logging

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.api.v1.router import api_router

# Configure logging
from app.core.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """إدارة دورة حياة التطبيق - Application lifespan management"""
    # Startup
    logger.info("Starting Safar API...")
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Safar API...")
    await close_db()
    logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Safar API - منصة سفر متكاملة متقدمة
    
    Safar is a comprehensive travel platform with advanced features:
    - Property listings and bookings
    - AI-powered travel planning
    - Smart promotions and discounts
    - Multi-language and multi-currency support
    - Real-time messaging
    - Advanced reviews and ratings
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting Middleware
if settings.rate_limit_enabled:
    app.add_middleware(RateLimitMiddleware)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """إضافة وقت المعالجة - Add processing time header"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """معالج أخطاء HTTP - HTTP exception handler"""
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
    """معالج أخطاء التحقق - Validation exception handler"""
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
    """معالج الأخطاء العامة - General exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500
        }
    )


# Health check
@app.get("/health")
async def health_check():
    """فحص صحة التطبيق - Health check endpoint"""
    from app.core.monitoring import HealthChecker
    return await HealthChecker.get_health_status()


@app.get("/health/ready")
async def readiness_check():
    """فحص جاهزية التطبيق - Readiness check endpoint"""
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
    """فحص حياة التطبيق - Liveness check endpoint"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    """الصفحة الرئيسية - Root endpoint"""
    return {
        "message": "Welcome to Safar API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

