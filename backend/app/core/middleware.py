"""
Custom middleware for bot detection, rate limiting, security headers, and request monitoring.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
from typing import Callable

from app.infrastructure.cache.redis import get_redis, CacheService
from app.core.config import get_settings
from app.core.security_utils import (
    is_bot_request,
    get_client_ip,
    get_rate_limit_for_request,
    check_suspicious_activity,
    log_request,
    increment_request_count,
    is_public_route,
)

settings = get_settings()
logger = logging.getLogger(__name__)


class CORSPreflightMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle OPTIONS preflight requests.
    This ensures OPTIONS requests return 200 OK before reaching route handlers.
    CORSMiddleware will add the appropriate CORS headers.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Handle OPTIONS requests immediately
        if request.method == "OPTIONS":
            # Return 200 OK - CORSMiddleware will add CORS headers
            return Response(status_code=200)
        
        return await call_next(request)


class BotDetectionMiddleware(BaseHTTPMiddleware):
    """
    Bot detection middleware.
    
    Security: Blocks automated requests from bots/scrapers.
    CORS: Skips OPTIONS preflight requests to allow CORS middleware to handle them.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Allow health check endpoints (required for monitoring/load balancers)
        if request.url.path in ["/health", "/health/live", "/health/ready"]:
            return await call_next(request)
        
        # Skip bot detection for OPTIONS requests (CORS preflight)
        # FastAPI's CORSMiddleware handles OPTIONS automatically
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if request is from a bot
        if is_bot_request(request):
            client_ip = get_client_ip(request)
            user_agent = request.headers.get("user-agent", "unknown")
            logger.warning(
                f"Bot detected and blocked: user_agent={user_agent}, "
                f"client_ip={client_ip}, path={request.url.path}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automated access not allowed. Please use a web browser."
            )
        
        return await call_next(request)


class EnhancedRateLimitMiddleware(BaseHTTPMiddleware):
    """Enhanced rate limiting middleware with different limits for authenticated/unauthenticated users
    
    CRITICAL: Implements circuit breaker pattern - fails closed in production when Redis is unavailable.
    In production, rate limiting is critical for security. Service should not operate without it.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self._circuit_open = False
        self._circuit_failure_count = 0
        self._circuit_last_failure = None
        self._circuit_reset_timeout = 60  # Reset circuit after 60 seconds
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.rate_limit_enabled:
            return await call_next(request)
        
        # Skip rate limiting for OPTIONS requests (CORS preflight)
        # FastAPI's CORSMiddleware handles OPTIONS automatically
        # This prevents preflight requests from consuming rate limit quota
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Get client IP (handles proxies)
        client_ip = get_client_ip(request)
        
        # Check if user is authenticated
        auth_header = request.headers.get("authorization", "")
        is_authenticated = auth_header.startswith("Bearer ")
        
        # Get appropriate rate limit
        rate_limit = get_rate_limit_for_request(request, is_authenticated)
        
        # Check circuit breaker
        if self._circuit_open:
            # Check if we should reset circuit
            if self._circuit_last_failure and \
               (time.time() - self._circuit_last_failure) > self._circuit_reset_timeout:
                logger.info("Rate limiting circuit breaker: Attempting reset")
                self._circuit_open = False
                self._circuit_failure_count = 0
            else:
                # Circuit is open - fail closed in production
                if settings.environment == "production":
                    logger.error(
                        f"Rate limiting circuit breaker is OPEN. Rejecting request. "
                        f"client_ip={client_ip}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Rate limiting service unavailable. Please try again later."
                    )
                else:
                    # In non-production, allow requests but log warning
                    logger.warning(
                        f"Rate limiting circuit breaker is OPEN (non-production mode). "
                        f"Allowing request. client_ip={client_ip}"
                    )
                    return await call_next(request)
        
        # Check rate limit with route-specific key
        path = request.url.path
        key = f"rate_limit:{client_ip}:{path}"
        try:
            redis = await get_redis()
            current = await redis.get(key)
            
            if current and int(current) >= rate_limit:
                logger.warning(
                    f"Rate limit exceeded: client_ip={client_ip}, "
                    f"path={path}, limit={rate_limit}, current={int(current)}"
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Limit: {rate_limit} requests per minute. Please try again later."
                )
            
            # Increment counter
            pipe = redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)  # 1 minute window
            await pipe.execute()
            
            # Track request count for monitoring
            await increment_request_count(client_ip)
            
            # Reset circuit breaker on success
            if self._circuit_failure_count > 0:
                self._circuit_failure_count = 0
                logger.info("Rate limiting circuit breaker: Reset after successful operation")
            
        except HTTPException:
            # Re-raise rate limit exceptions
            raise
        except Exception as e:
            # CRITICAL: Circuit breaker pattern - fail closed in production
            self._circuit_failure_count += 1
            self._circuit_last_failure = time.time()
            
            logger.error(
                f"Rate limiting Redis connection failed. "
                f"client_ip={client_ip}, error={str(e)}, "
                f"failure_count={self._circuit_failure_count}"
            )
            
            # Open circuit after 3 consecutive failures
            if self._circuit_failure_count >= 3:
                self._circuit_open = True
                logger.critical(
                    f"Rate limiting circuit breaker OPENED after {self._circuit_failure_count} failures. "
                    f"Redis appears to be unavailable."
                )
            
            # In production, fail closed - rate limiting is critical for security
            if settings.environment == "production":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Rate limiting service unavailable. Please try again later."
                )
            else:
                # In non-production, allow requests but log warning
                logger.warning(
                    f"Rate limiting unavailable (non-production mode). Allowing request. "
                    f"client_ip={client_ip}"
                )
        
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Security headers middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response


class RequestMonitoringMiddleware(BaseHTTPMiddleware):
    """Request logging and monitoring middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        status_code = 500  # Default in case of error
        
        # Get request info
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        auth_header = request.headers.get("authorization", "")
        is_authenticated = auth_header.startswith("Bearer ")
        
        # Check for suspicious activity
        if await check_suspicious_activity(client_ip):
            logger.warning(
                f"Suspicious activity detected: client_ip={client_ip}, "
                f"path={request.url.path}"
            )
            # Don't block, but log for monitoring
        
        # Process request
        try:
            response = await call_next(request)
            status_code = response.status_code
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Add response headers
            response.headers["X-Process-Time"] = f"{response_time:.2f}ms"
            
            # Log request (non-blocking)
            try:
                await log_request(
                    endpoint=request.url.path,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    is_authenticated=is_authenticated,
                    status_code=status_code,
                    response_time=response_time,
                    method=request.method
                )
            except Exception as log_error:
                # Don't fail request if logging fails
                logger.error(f"Error logging request: {log_error}")
            
            return response
            
        except HTTPException as e:
            status_code = e.status_code
            response_time = (time.time() - start_time) * 1000
            
            # For 429 errors, log at info level (rate limiting is expected behavior)
            # For other HTTP errors, log normally
            if status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                logger.debug(
                    f"Rate limit response: client_ip={client_ip}, "
                    f"path={request.url.path}, status={status_code}"
                )
            else:
                logger.warning(
                    f"HTTP error: client_ip={client_ip}, "
                    f"path={request.url.path}, status={status_code}"
                )
            
            # Log error request
            try:
                await log_request(
                    endpoint=request.url.path,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    is_authenticated=is_authenticated,
                    status_code=status_code,
                    response_time=response_time,
                    method=request.method
                )
            except Exception:
                pass  # Ignore logging errors
            
            raise


# Keep old RateLimitMiddleware for backward compatibility
RateLimitMiddleware = EnhancedRateLimitMiddleware

