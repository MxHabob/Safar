"""
مسارات المستخدمين - User Routes
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user, get_unit_of_work
from app.repositories.unit_of_work import IUnitOfWork
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.token_blacklist import add_token_to_blacklist, revoke_user_tokens
from app.core.config import get_settings
from app.modules.users.models import User, UserRole, UserStatus
from app.modules.users.schemas import (
    UserCreate, UserResponse, UserUpdate, UserLogin,
    TokenResponse, RefreshTokenRequest, OAuthLogin, OTPRequest, OTPVerify,
    HostProfileResponse, HostProfileCreate, HostProfileUpdate
)
from app.modules.users.services import UserService

router = APIRouter(prefix="/users", tags=["Users"])
security = HTTPBearer()
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    تسجيل مستخدم جديد
    Register new user
    """
    # Create user using service
    user_entity = await UserService.create_user(uow, user_data)
    
    # Create email verification code
    await UserService.create_verification_code(uow, user_entity.id, "email")
    
    # Get full user model for response
    from app.modules.users.models import User as UserModel
    from sqlalchemy import select
    
    result = await uow.db.execute(
        select(UserModel).where(UserModel.id == user_entity.id)
    )
    user = result.scalar_one_or_none()
    
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    تسجيل الدخول
    Login
    """
    user_entity = await UserService.authenticate_user(
        uow, credentials.email, credentials.password
    )
    if not user_entity:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Use domain logic
    if not user_entity.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens using service
    tokens = await UserService.create_access_token_for_user(user_entity)
    
    return {
        **tokens,
        "expires_in": settings.access_token_expire_minutes * 60
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    تحديث Access Token
    Refresh access token
    """
    try:
        payload = decode_token(token_data.refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = await UserService.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role.value},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    الحصول على معلومات المستخدم الحالي
    Get current user info
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    تحديث بيانات المستخدم الحالي
    Update current user
    """
    updated_user = await UserService.update_user(db, current_user, user_data)
    return updated_user


@router.post("/otp/request")
async def request_otp(
    otp_data: OTPRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    طلب رمز OTP
    Request OTP code
    """
    # In production, send SMS via Twilio or similar
    user = await UserService.get_user_by_email(db, otp_data.phone_number)
    if not user:
        # For security, don't reveal if user exists
        return {"message": "If the phone number exists, an OTP has been sent"}
    
    verification = await UserService.create_verification_code(db, user.id, "phone")
    
    # TODO: Send SMS with verification.code
    
    return {"message": "OTP sent successfully"}


@router.post("/otp/verify")
async def verify_otp(
    otp_data: OTPVerify,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    التحقق من رمز OTP
    Verify OTP code
    """
    user = await UserService.get_user_by_email(db, otp_data.phone_number)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    is_valid = await UserService.verify_code(db, user.id, otp_data.code, "phone")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    user.is_phone_verified = True
    await db.commit()
    
    return {"message": "Phone number verified successfully"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Any:
    """
    تسجيل الخروج وإلغاء Token
    Logout and revoke token
    """
    token = credentials.credentials
    await add_token_to_blacklist(token)
    
    return {"message": "Successfully logged out"}


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    تسجيل الخروج من جميع الأجهزة
    Logout from all devices
    """
    await revoke_user_tokens(current_user.id)
    
    return {"message": "Successfully logged out from all devices"}


@router.post("/oauth/login", response_model=TokenResponse)
async def oauth_login(
    oauth_data: OAuthLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    تسجيل الدخول عبر OAuth (Google, Apple)
    OAuth login
    """
    from app.infrastructure.oauth.service import OAuthService
    from app.modules.users.models import UserRole, UserStatus
    
    # Verify token with provider
    if oauth_data.provider == "google":
        user_info = await OAuthService.verify_google_token(oauth_data.token)
        oauth_id_field = "google_id"
    elif oauth_data.provider == "apple":
        user_info = await OAuthService.verify_apple_token(oauth_data.token)
        oauth_id_field = "apple_id"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth provider"
        )
    
    if not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by OAuth provider"
        )
    
    # Check if user exists
    user = await UserService.get_user_by_email(db, user_info["email"])
    
    if not user:
        # Create new user
        user = User(
            email=user_info["email"],
            first_name=user_info.get("given_name") or user_info.get("name", "").split()[0] if user_info.get("name") else None,
            last_name=user_info.get("family_name") or " ".join(user_info.get("name", "").split()[1:]) if user_info.get("name") and len(user_info.get("name", "").split()) > 1 else None,
            avatar_url=user_info.get("picture"),
            is_email_verified=user_info.get("email_verified", False),
            role=UserRole.GUEST,
            status=UserStatus.ACTIVE if user_info.get("email_verified") else UserStatus.PENDING_VERIFICATION,
            is_active=True,
        )
        setattr(user, oauth_id_field, user_info["sub"])
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update OAuth ID if not set
        if not getattr(user, oauth_id_field):
            setattr(user, oauth_id_field, user_info["sub"])
            if user_info.get("picture") and not user.avatar_url:
                user.avatar_url = user_info.get("picture")
            await db.commit()
            await db.refresh(user)
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "email": user.email}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60
    }

