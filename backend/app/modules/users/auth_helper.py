"""
Authentication Helper Service
Centralized authentication logic to reduce code duplication and ensure consistency.
"""
from typing import Optional, Tuple, Dict, Any
from datetime import datetime
from fastapi import Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.users.session_service import SessionService
from app.modules.users.account_security_service import AccountSecurityService
from app.domain.entities.user import UserEntity
from app.modules.users.services import UserService
from app.modules.users.two_factor_service import TwoFactorService
from app.core.config import get_settings
from app.repositories.unit_of_work import IUnitOfWork

settings = get_settings()


class AuthHelper:
    """
    Centralized authentication helper to reduce code duplication.
    Provides consistent authentication flow across all endpoints.
    """
    
    @staticmethod
    async def validate_login_request(
        request: Request,
        email: str,
        db: AsyncSession
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Validate login request with IP blocking.
        
        Returns:
            Tuple of (client_ip, error_message)
        """
        client_ip = SessionService.get_client_ip(request)
        
        # Check if IP is blocked
        is_ip_blocked, ip_block_reason = await AccountSecurityService.check_ip_blocked(client_ip)
        if is_ip_blocked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=ip_block_reason or "Too many failed login attempts from this IP address. Please try again later."
            )
        
        return client_ip, None
    
    @staticmethod
    async def handle_failed_login(
        db: AsyncSession,
        email: str,
        client_ip: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """
        Handle failed login attempt.
        
        Returns:
            Tuple of (is_locked, lockout_reason)
        """
        # Get user by email
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user_model = result.scalar_one_or_none()
        
        if user_model:
            # User exists - record failed attempt for user and IP
            is_locked, lockout_reason = await AccountSecurityService.record_failed_login(
                db, user_model.id, client_ip
            )
            await AccountSecurityService.record_failed_login_attempt_by_ip(client_ip)
            return is_locked, lockout_reason
        else:
            # User doesn't exist - record failed attempt by IP only (prevents enumeration)
            await AccountSecurityService.record_failed_login_attempt_by_ip(client_ip)
            return False, None
    
    @staticmethod
    async def validate_user_for_login(
        db: AsyncSession,
        user_model: User,
        client_ip: Optional[str]
    ) -> None:
        """
        Validate user is eligible for login (not locked, active, etc.).
        Raises HTTPException if validation fails.
        """
        # Check if account is locked
        is_locked, lockout_reason = await AccountSecurityService.check_account_locked(
            db, user_model
        )
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=lockout_reason or "Account is locked. Please try again later."
            )
        
        # Check if user is active
        from app.modules.users.models import UserStatus
        if not user_model.is_active or user_model.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not active"
            )
    
    @staticmethod
    async def check_2fa_requirement(
        db: AsyncSession,
        user_id: str
    ) -> Tuple[bool, bool]:
        """
        Check if 2FA is required and enabled for user.
        
        Returns:
            Tuple of (requires_2fa, is_2fa_enabled)
        """
        return await TwoFactorService.check_2fa_requirement(db, user_id)
    
    @staticmethod
    async def prepare_2fa_verification(
        user_id: str
    ) -> None:
        """
        Prepare 2FA verification by storing pending state in Redis.
        """
        from app.infrastructure.cache.redis import get_redis
        try:
            redis = await get_redis()
            # Store user_id for 2FA verification (5 minute TTL)
            await redis.setex(f"2fa_pending:{user_id}", 300, user_id)
        except Exception:
            pass  # If Redis fails, continue (shouldn't happen in production)
    
    @staticmethod
    async def complete_authentication(
        db: AsyncSession,
        user_entity: UserEntity,
        user_model: User,
        request: Request,
        remember_me: bool = False,
        mfa_verified: bool = False,
        client_ip: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete authentication flow: create session, tokens, and update user.
        
        Returns:
            Dictionary with tokens, user data, and session_id
        """
        # Reset failed login attempts
        if client_ip is None:
            client_ip = SessionService.get_client_ip(request)
        await AccountSecurityService.reset_failed_attempts(db, user_model.id, client_ip)
        
        # Update last login info
        user_model.last_login_at = datetime.utcnow()
        user_model.last_login_ip = client_ip
        await db.commit()
        
        # Create session
        session = await SessionService.create_session(
            db=db,
            user_id=user_entity.id,
            request=request,
            remember_me=remember_me,
            mfa_verified=mfa_verified
        )
        
        # Create tokens with session_id
        tokens = await UserService.create_access_token_for_user(
            user_entity,
            mfa_verified=mfa_verified,
            session_id=session.session_id
        )
        
        # Refresh user model
        await db.refresh(user_model)
        
        # Convert to response
        from app.modules.users.schemas import UserResponse
        user_response = UserResponse.model_validate(user_model)
        
        return {
            **tokens,
            "expires_in": settings.access_token_expire_minutes * 60,
            "user": user_response,
            "session_id": session.session_id
        }
    
    @staticmethod
    async def get_user_by_email(
        db: AsyncSession,
        email: str
    ) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: str
    ) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

