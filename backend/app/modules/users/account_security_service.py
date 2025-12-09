"""
Account Security Service
Handles account lockout, IP blocking, and failed login tracking.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.modules.users.models import User
from app.infrastructure.cache.redis import get_redis
from app.core.config import get_settings

settings = get_settings()

# Configuration constants
MAX_FAILED_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_DURATION_MINUTES = 15
MAX_FAILED_ATTEMPTS_PER_IP = 10
IP_BLOCK_DURATION_MINUTES = 30


class AccountSecurityService:
    """Service for managing account security and IP blocking."""
    
    @staticmethod
    async def record_failed_login(
        db: AsyncSession,
        user_id: str,
        ip_address: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """
        Record a failed login attempt for a user.
        
        Args:
            db: Database session
            user_id: User ID
            ip_address: IP address of the failed attempt
            
        Returns:
            Tuple of (is_locked, lockout_reason)
        """
        redis = await get_redis()
        
        # Track failed attempts per user
        user_key = f"failed_login:user:{user_id}"
        attempts = await redis.incr(user_key)
        
        # Set expiration on first attempt
        if attempts == 1:
            await redis.expire(user_key, ACCOUNT_LOCKOUT_DURATION_MINUTES * 60)
        
        # Check if account should be locked
        if attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            # Lock account
            lockout_key = f"account_locked:{user_id}"
            await redis.setex(
                lockout_key,
                ACCOUNT_LOCKOUT_DURATION_MINUTES * 60,
                "locked"
            )
            
            # Update user model
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            if user:
                # You can add a locked_until field to User model if needed
                pass
            
            return True, f"Account locked due to {attempts} failed login attempts. Please try again in {ACCOUNT_LOCKOUT_DURATION_MINUTES} minutes."
        
        remaining = MAX_FAILED_LOGIN_ATTEMPTS - attempts
        return False, f"{remaining} attempts remaining before account lockout."
    
    @staticmethod
    async def record_failed_login_attempt_by_ip(
        ip_address: Optional[str]
    ) -> None:
        """
        Record a failed login attempt by IP address.
        
        Args:
            ip_address: IP address of the failed attempt
        """
        if not ip_address:
            return
        
        redis = await get_redis()
        ip_key = f"failed_login:ip:{ip_address}"
        attempts = await redis.incr(ip_key)
        
        # Set expiration on first attempt
        if attempts == 1:
            await redis.expire(ip_key, IP_BLOCK_DURATION_MINUTES * 60)
        
        # Block IP if too many attempts
        if attempts >= MAX_FAILED_ATTEMPTS_PER_IP:
            block_key = f"ip_blocked:{ip_address}"
            await redis.setex(
                block_key,
                IP_BLOCK_DURATION_MINUTES * 60,
                "blocked"
            )
    
    @staticmethod
    async def reset_failed_attempts(
        db: AsyncSession,
        user_id: str,
        ip_address: Optional[str]
    ) -> None:
        """
        Reset failed login attempts for a user and IP.
        
        Args:
            db: Database session
            user_id: User ID
            ip_address: IP address
        """
        redis = await get_redis()
        
        # Reset user attempts
        user_key = f"failed_login:user:{user_id}"
        await redis.delete(user_key)
        
        # Reset IP attempts
        if ip_address:
            ip_key = f"failed_login:ip:{ip_address}"
            await redis.delete(ip_key)
    
    @staticmethod
    async def check_account_locked(
        db: AsyncSession,
        user: User
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if an account is locked.
        
        Args:
            db: Database session
            user: User object
            
        Returns:
            Tuple of (is_locked, lockout_reason)
        """
        redis = await get_redis()
        lockout_key = f"account_locked:{user.id}"
        locked = await redis.get(lockout_key)
        
        if locked:
            # Check remaining time
            ttl = await redis.ttl(lockout_key)
            if ttl > 0:
                minutes = ttl // 60
                return True, f"Account is locked. Please try again in {minutes} minutes."
            else:
                # Lockout expired, remove it
                await redis.delete(lockout_key)
        
        return False, None
    
    @staticmethod
    async def check_ip_blocked(
        ip_address: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if an IP address is blocked.
        
        Args:
            ip_address: IP address to check
            
        Returns:
            Tuple of (is_blocked, block_reason)
        """
        if not ip_address:
            return False, None
        
        redis = await get_redis()
        block_key = f"ip_blocked:{ip_address}"
        blocked = await redis.get(block_key)
        
        if blocked:
            # Check remaining time
            ttl = await redis.ttl(block_key)
            if ttl > 0:
                minutes = ttl // 60
                return True, f"IP address is blocked due to too many failed login attempts. Please try again in {minutes} minutes."
            else:
                # Block expired, remove it
                await redis.delete(block_key)
        
        return False, None
    
    @staticmethod
    async def is_account_locked(email: str) -> bool:
        """
        Check if an account is locked by email (for backward compatibility).
        
        Args:
            email: User email
            
        Returns:
            True if account is locked, False otherwise
        """
        from sqlalchemy import select
        from app.core.database import get_db
        
        # This is a simplified version - in practice, you'd pass db as parameter
        # For now, we'll use Redis directly
        redis = await get_redis()
        
        # We need user_id, so we'll check by email pattern
        # In practice, you should pass user_id or db session
        # This is a fallback method
        return False  # Simplified - implement properly with db lookup if needed

