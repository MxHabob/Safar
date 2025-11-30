"""
Middleware مخصص - Custom Middleware
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from typing import Callable

from app.infrastructure.cache.redis import get_redis, CacheService
from app.core.config import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware للحد من الطلبات - Rate limiting middleware
    
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
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Check circuit breaker
        import time
        import logging
        logger = logging.getLogger(__name__)
        
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
        
        # Check rate limit
        key = f"rate_limit:{client_ip}"
        try:
            redis = await get_redis()
            current = await redis.get(key)
            
            if current and int(current) >= settings.rate_limit_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
            
            # Increment counter
            pipe = redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)  # 1 minute window
            await pipe.execute()
            
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
    """Middleware لرؤوس الأمان - Security headers middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

