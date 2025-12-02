"""
Dependencies for FastAPI
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.unit_of_work import UnitOfWork, IUnitOfWork
from app.modules.users.models import User, UserStatus, UserRole
from app.core.security import decode_token
from app.core.token_blacklist import is_token_blacklisted


security_scheme = HTTPBearer(auto_error=False)


async def get_unit_of_work(
    db: AsyncSession = Depends(get_db)
) -> AsyncGenerator[IUnitOfWork, None]:
    async with UnitOfWork(db) as uow:
        yield uow


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    token = credentials.credentials
    payload = decode_token(token, token_type="access")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    if await is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active and not suspended or inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    if current_user.status in {UserStatus.SUSPENDED, UserStatus.INACTIVE}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )

    return current_user


async def require_host(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require host role and enforce 2FA."""
    is_host = current_user.role == UserRole.HOST or UserRole.HOST.value in (current_user.roles or [])
    if not is_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host privileges required"
        )
    
    # Enforce 2FA for hosts
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="2FA required"
        )
    
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require admin or super admin role and enforce 2FA."""
    is_admin = (
        current_user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN} or
        any(role in (current_user.roles or []) for role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Enforce 2FA for admins
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="2FA required"
        )
    
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Optional authentication dependency that returns None for unregistered users.
    Use this for routes that should work for both authenticated and unauthenticated users.
    
    Returns:
        User if authenticated, None if not authenticated
    """
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token, token_type="access")
        user_id = payload.get("sub")
        
        if not user_id:
            return None
        
        if await is_token_blacklisted(token):
            return None
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        return user
    except (HTTPException, Exception):
        # If token is invalid, expired, or any error occurs, return None
        # This allows unregistered users to access the route
        return None


async def get_optional_active_user(
    optional_user: Optional[User] = Depends(get_optional_user)
) -> Optional[User]:
    """
    Optional active user - returns None if not authenticated or if user is inactive.
    Use this when you want to ensure only active users are considered authenticated,
    but still allow unregistered users to access the route.
    """
    if optional_user is None:
        return None
    
    if not optional_user.is_active:
        return None
    
    if optional_user.status in {UserStatus.SUSPENDED, UserStatus.INACTIVE}:
        return None
    
    return optional_user
