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
    """Middleware للحد من الطلبات - Rate limiting middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Check rate limit
        key = f"rate_limit:{client_ip}"
        try:
            redis = await get_redis()
            current = await redis.get(key)
            
            if current and int(current) >= settings.RATE_LIMIT_PER_MINUTE:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
            
            # Increment counter
            pipe = redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)  # 1 minute window
            await pipe.execute()
            
        except Exception:
            # If Redis fails, allow request (fail open)
            pass
        
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

