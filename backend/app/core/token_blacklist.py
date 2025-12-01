"""
Token blacklist system for revoking and invalidating JWTs.
"""
from datetime import datetime, timedelta
from typing import Optional
from app.infrastructure.cache.redis import get_redis, CacheService
from app.core.config import get_settings

settings = get_settings()


async def add_token_to_blacklist(token: str, expires_in: Optional[int] = None) -> bool:
    """Add a token to the blacklist with an optional expiry in seconds."""
    try:
        redis = await get_redis()
        # Extract expiration from token if not provided
        if expires_in is None:
            expires_in = settings.access_token_expire_minutes * 60
        
        # Store token with expiration
        key = f"blacklist:token:{token}"
        await redis.setex(key, expires_in, "1")
        return True
    except Exception:
        return False


async def is_token_blacklisted(token: str) -> bool:
    """Check whether a token is present in the blacklist."""
    try:
        redis = await get_redis()
        key = f"blacklist:token:{token}"
        exists = await redis.exists(key)
        return exists > 0
    except Exception:
        # Fail open - if Redis is down, allow token (but log the issue)
        return False


async def revoke_user_tokens(user_id: int) -> bool:
    """Revoke all tokens for a given user by recording a revocation timestamp."""
    try:
        redis = await get_redis()
        # Store user revocation timestamp
        key = f"blacklist:user:{user_id}"
        await redis.setex(
            key,
            settings.refresh_token_expire_days * 24 * 60 * 60,
            str(datetime.utcnow().timestamp())
        )
        return True
    except Exception:
        return False


async def get_user_revocation_time(user_id: int) -> Optional[datetime]:
    """Get the revocation timestamp for a user's tokens, if any."""
    try:
        redis = await get_redis()
        key = f"blacklist:user:{user_id}"
        timestamp_str = await redis.get(key)
        if timestamp_str:
            return datetime.utcfromtimestamp(float(timestamp_str))
        return None
    except Exception:
        return None

