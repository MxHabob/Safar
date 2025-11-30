"""
Security utilities for authentication and request validation
"""
import re
import time
import logging
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from app.infrastructure.cache.redis import get_redis
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Blocked user agents for bot detection
BLOCKED_USER_AGENTS = [
    "scrapy", "requests", "curl", "wget", 
    "python-requests", "urllib", "go-http-client",
    "java/", "okhttp", "apache-httpclient", "postman"
]

SUSPICIOUS_PATTERNS = [
    r"bot", r"crawler", r"spider", r"scraper",
    r"^$",  # Empty user agent
]

# Public routes that should have different rate limits
PUBLIC_ROUTES = [
    "/api/v1/listings",
    "/api/v1/search",
    "/api/v1/reviews/listings",
]


def is_bot_request(request: Request) -> bool:
    """Check if request is from a bot/scraper"""
    user_agent = request.headers.get("user-agent", "").lower()
    
    # Check blocked user agents
    if any(blocked in user_agent for blocked in BLOCKED_USER_AGENTS):
        return True
    
    # Check suspicious patterns
    if any(re.search(pattern, user_agent, re.IGNORECASE) for pattern in SUSPICIOUS_PATTERNS):
        return True
    
    # Check for empty or very short user agent
    if not user_agent or len(user_agent) < 10:
        return True
    
    return False


def is_public_route(path: str) -> bool:
    """Check if route is a public route"""
    return any(path.startswith(route) for route in PUBLIC_ROUTES)


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies"""
    # Check for forwarded IP (from reverse proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to client host
    return request.client.host if request.client else "unknown"


async def get_request_count(client_ip: str, window_seconds: int = 3600) -> int:
    """Get number of requests from IP in the last window"""
    try:
        redis = await get_redis()
        key = f"request_count:{client_ip}:{window_seconds}"
        count = await redis.get(key)
        return int(count) if count else 0
    except Exception as e:
        logger.error(f"Error getting request count: {e}")
        return 0


async def increment_request_count(client_ip: str, window_seconds: int = 3600) -> None:
    """Increment request count for IP"""
    try:
        redis = await get_redis()
        key = f"request_count:{client_ip}:{window_seconds}"
        pipe = redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        await pipe.execute()
    except Exception as e:
        logger.error(f"Error incrementing request count: {e}")


async def check_suspicious_activity(client_ip: str) -> bool:
    """Check for suspicious activity patterns"""
    try:
        redis = await get_redis()
        
        # Check requests in last hour
        hour_count = await get_request_count(client_ip, 3600)
        if hour_count > 200:  # More than 200 requests per hour
            return True
        
        # Check for scraping pattern (many different endpoints)
        endpoints_key = f"endpoints:{client_ip}:3600"
        endpoints = await redis.smembers(endpoints_key)
        if len(endpoints) > 50:  # More than 50 different endpoints
            return True
        
        # Check request frequency (too many requests in short time)
        recent_key = f"recent_requests:{client_ip}"
        recent_count = await redis.get(recent_key)
        if recent_count and int(recent_count) > 10:  # More than 10 requests in last minute
            return True
        
        return False
    except Exception as e:
        logger.error(f"Error checking suspicious activity: {e}")
        return False


async def log_request(
    endpoint: str,
    client_ip: str,
    user_agent: str,
    is_authenticated: bool,
    status_code: int,
    response_time: float,
    method: str = "GET"
) -> None:
    """Log request for monitoring and analysis"""
    try:
        redis = await get_redis()
        
        log_entry = {
            "endpoint": endpoint,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "is_authenticated": is_authenticated,
            "status_code": status_code,
            "response_time": response_time,
            "method": method,
            "timestamp": str(time.time()),
        }
        
        # Store in Redis list (keep last 10000 requests)
        await redis.lpush("request_logs", str(log_entry))
        await redis.ltrim("request_logs", 0, 10000)
        
        # Track endpoints per IP
        endpoints_key = f"endpoints:{client_ip}:3600"
        await redis.sadd(endpoints_key, endpoint)
        await redis.expire(endpoints_key, 3600)
        
        # Track recent requests
        recent_key = f"recent_requests:{client_ip}"
        pipe = redis.pipeline()
        pipe.incr(recent_key)
        pipe.expire(recent_key, 60)
        await pipe.execute()
        
    except Exception as e:
        logger.error(f"Error logging request: {e}")


async def verify_captcha(token: str, client_ip: str) -> bool:
    """Verify CAPTCHA token (hCaptcha or reCAPTCHA)"""
    # Check if CAPTCHA is configured (optional setting)
    captcha_secret = getattr(settings, 'hcaptcha_secret_key', None)
    if not captcha_secret:
        # If no CAPTCHA configured, allow (for development)
        logger.warning("CAPTCHA not configured, allowing request")
        return True
    
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://hcaptcha.com/siteverify",
                data={
                    "secret": captcha_secret,
                    "response": token,
                    "remoteip": client_ip,
                },
                timeout=5.0
            )
            result = response.json()
            return result.get("success", False)
    except Exception as e:
        logger.error(f"Error verifying CAPTCHA: {e}")
        return False


def get_rate_limit_for_request(request: Request, is_authenticated: bool) -> int:
    """Get appropriate rate limit based on route and authentication status"""
    path = request.url.path
    
    if is_authenticated:
        # Authenticated users get higher limits
        if is_public_route(path):
            return 100  # 100 requests/minute for authenticated on public routes
        return 200  # 200 requests/minute for authenticated on other routes
    else:
        # Unauthenticated users get stricter limits
        if is_public_route(path):
            return 30  # 30 requests/minute for unauthenticated on public routes
        return 10  # 10 requests/minute for unauthenticated on other routes

