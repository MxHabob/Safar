"""
User routes.
All authentication, profile, OTP, OAuth, and session-related endpoints.
"""
from datetime import timedelta, datetime
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user, get_unit_of_work
from app.repositories.unit_of_work import IUnitOfWork
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.token_blacklist import add_token_to_blacklist, revoke_user_tokens, is_token_blacklisted, get_user_revocation_time
from app.core.config import get_settings
from app.modules.users.models import User, UserRole, UserStatus, UserVerification
from app.domain.entities.user import UserEntity
from app.modules.users.schemas import (
    UserCreate, UserResponse, UserUpdate, UserLogin,
    TokenResponse, AuthResponse, RefreshTokenRequest, OAuthLogin, OTPRequest, OTPVerify,
    HostProfileResponse, HostProfileCreate, HostProfileUpdate,
    PasswordResetRequest, PasswordReset, PasswordChange, EmailVerificationRequest,
    TwoFactorLoginVerify, TwoFactorSetupResponse, TwoFactorStatusResponse,
    TwoFactorVerifyRequest, AccountDeletionRequest, DataExportResponse
)
from app.modules.users.services import UserService
from app.modules.users.two_factor_service import TwoFactorService
from app.modules.users.gdpr_service import GDPRService
from app.modules.users.auth_helper import AuthHelper
from app.modules.users.session_service import SessionService

router = APIRouter(prefix="/users", tags=["Users"])
security = HTTPBearer()
settings = get_settings()

# Include device routes
from app.modules.users.device_routes import router as device_router
router.include_router(device_router)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Register a new user.
    """
    # Create user using service
    user_entity = await UserService.create_user(uow, user_data)
    
    # Create email verification code
    verification = await UserService.create_verification_code(uow, user_entity.id, "email")
    
    # Send verification email
    from app.infrastructure.email.service import EmailService
    from app.core.config import get_settings
    settings = get_settings()
    
    verify_url = f"{settings.app_name}/verify-email?code={verification.code}"
    
    await EmailService.send_template_email(
        to_email=user_entity.email,
        subject="Verify Your Email",
        template_name="verification",
        template_data={
            "name": user_entity.first_name or user_entity.email.split("@")[0],
            "code": verification.code,
            "verification_url": verify_url
        }
    )
    
    # Get full user model for response
    from app.modules.users.models import User as UserModel
    from sqlalchemy import select
    
    result = await uow.db.execute(
        select(UserModel).where(UserModel.id == user_entity.id)
    )
    user = result.scalar_one_or_none()
    
    return user


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    request: Request,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Login with email and password.
    Enhanced with IP blocking, session management, and 2FA support.
    """
    # Validate login request (IP blocking check)
    client_ip, _ = await AuthHelper.validate_login_request(request, credentials.email, uow.db)
    
    # Authenticate user
    user_entity = await UserService.authenticate_user(
        uow, credentials.email, credentials.password
    )
    
    if not user_entity:
        # Handle failed login
        is_locked, lockout_reason = await AuthHelper.handle_failed_login(
            uow.db, credentials.email, client_ip
        )
        
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=lockout_reason or "Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes."
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Get user model
    user_model = await AuthHelper.get_user_by_id(uow.db, user_entity.id)
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate user for login (locked, active, etc.)
    await AuthHelper.validate_user_for_login(uow.db, user_model, client_ip)
    
    # Check 2FA requirement
    requires_2fa, is_2fa_enabled = await AuthHelper.check_2fa_requirement(
        uow.db, user_entity.id
    )
    
    # If 2FA is required but not enabled, block login
    if requires_2fa and not is_2fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Two-factor authentication is required for your role. Please set up 2FA first."
        )
    
    # If 2FA is enabled, require verification before issuing tokens
    if is_2fa_enabled:
        await AuthHelper.prepare_2fa_verification(user_entity.id)
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="2FA verification required. Please verify with your authenticator app.",
            headers={"X-Requires-2FA": "true", "X-User-ID": str(user_entity.id)}
        )
    
    # Complete authentication (create session, tokens, update user)
    remember_me = getattr(credentials, 'remember_me', False)
    return await AuthHelper.complete_authentication(
        db=uow.db,
        user_entity=user_entity,
        user_model=user_model,
        request=request,
        remember_me=remember_me,
        mfa_verified=False,
        client_ip=client_ip
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    request: Request,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Refresh an access token using a valid refresh token.
    Enhanced with session validation and activity update.
    
    Security improvements:
    - Implements refresh token rotation (old token is blacklisted)
    - Checks user revocation timestamp
    - Prevents token reuse attacks
    - Validates and updates session activity
    """
    try:
        payload = decode_token(token_data.refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        token_iat = payload.get("iat")  # Issued at timestamp
        session_id = payload.get("session_id")  # Session ID from token
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Check if refresh token is blacklisted
        if await is_token_blacklisted(token_data.refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )
        
        # Validate session if session_id exists
        if session_id:
            session = await SessionService.validate_session(uow.db, session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session has been revoked or expired"
                )
            # Update session activity
            await SessionService.update_session_activity(uow.db, session_id)
        
        # Check user revocation timestamp (for logout-all or password change)
        revocation_time = await get_user_revocation_time(user_id)
        if revocation_time and token_iat:
            token_issued_at = datetime.utcfromtimestamp(token_iat)
            if token_issued_at < revocation_time:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
        
        user_entity = await UserService.get_user_by_id(uow, user_id)
        if not user_entity or not user_entity.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # SECURITY: Blacklist the old refresh token (token rotation)
        # This prevents token reuse if the old token was stolen
        refresh_token_expire_seconds = settings.refresh_token_expire_days * 24 * 60 * 60
        await add_token_to_blacklist(
            token_data.refresh_token,
            expires_in=refresh_token_expire_seconds
        )
        
        # Get mfa_verified from token payload
        mfa_verified = payload.get("mfa_verified", False)
        
        # Create new tokens
        access_token = create_access_token(
            data={
                "sub": str(user_entity.id),
                "email": user_entity.email,
                "role": user_entity.role,
                "mfa_verified": mfa_verified,
                "session_id": session_id  # Include session_id in new token
            },
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        refresh_token = create_refresh_token(
            data={
                "sub": str(user_entity.id),
                "email": user_entity.email,
                "mfa_verified": mfa_verified,
                "session_id": session_id  # Include session_id in refresh token
            }
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
    Get the currently authenticated user profile.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Update the currently authenticated user profile.
    """
    from app.core.id import ID
    updated_user = await UserService.update_user(uow, ID(current_user.id), user_data)
    
    # Get full user model for response
    from app.modules.users.models import User as UserModel
    from sqlalchemy import select
    
    result = await uow.db.execute(
        select(UserModel).where(UserModel.id == current_user.id)
    )
    user = result.scalar_one_or_none()
    
    return user


@router.post("/otp/request")
async def request_otp(
    otp_data: OTPRequest,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Request an OTP code for phone verification.
    """
    from app.modules.users.models import User as UserModel
    from sqlalchemy import select
    
    # Find user by phone number
    result = await uow.db.execute(
        select(UserModel).where(UserModel.phone_number == otp_data.phone_number)
    )
    user_model = result.scalar_one_or_none()
    
    if not user_model:
        # For security, don't reveal if user exists
        return {"message": "If the phone number exists, an OTP has been sent"}
    
    # Get user entity
    user_entity = await uow.users.get_by_id(user_model.id)
    if not user_entity:
        return {"message": "If the phone number exists, an OTP has been sent"}
    
    # Create verification code
    verification = await UserService.create_verification_code(uow, user_entity.id, "phone")
    
    # Send SMS via Twilio
    from app.core.config import get_settings
    settings = get_settings()
    
    if settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number:
        try:
            from twilio.rest import Client
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            message = client.messages.create(
                body=f"Your Safar verification code is: {verification.code}. Valid for 10 minutes.",
                from_=settings.twilio_phone_number,
                to=otp_data.phone_number
            )
            if message.sid:
                return {"message": "OTP sent successfully"}
        except Exception as e:
            # Log error but don't reveal to user
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending SMS: {str(e)}")
            # Still return success for security
            return {"message": "If the phone number exists, an OTP has been sent"}
    else:
        # In development, log the code
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"OTP code for {otp_data.phone_number}: {verification.code} (Twilio not configured)")
    
    return {"message": "If the phone number exists, an OTP has been sent"}


@router.post("/otp/verify")
async def verify_otp(
    otp_data: OTPVerify,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Verify an OTP code for phone verification.
    """
    from app.modules.users.models import User as UserModel
    from sqlalchemy import select
    
    # Find user by phone number
    result = await uow.db.execute(
        select(UserModel).where(UserModel.phone_number == otp_data.phone_number)
    )
    user_model = result.scalar_one_or_none()
    
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user entity
    user_entity = await uow.users.get_by_id(user_model.id)
    if not user_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify code
    is_valid = await UserService.verify_code(uow, user_entity.id, otp_data.code, "phone")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Mark phone as verified
    await UserService.verify_user(uow, user_entity.id, "phone")
    
    return {"message": "Phone number verified successfully"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Logout the current user and revoke the current token and session.
    Enhanced with session management.
    """
    token = credentials.credentials
    
    # Revoke token
    await add_token_to_blacklist(token)
    
    # Try to revoke session if session_id is in token payload
    try:
        payload = decode_token(token, token_type="access")
        session_id = payload.get("session_id")
        if session_id:
            await SessionService.revoke_session(db, session_id, current_user.id)
    except Exception:
        # If session revocation fails, continue (token is already revoked)
        pass
    
    return {"message": "Successfully logged out"}


@router.get("/sessions", response_model=List[Dict[str, Any]])
async def get_sessions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get all active sessions for the current user.
    """
    sessions = await SessionService.get_active_sessions(db, current_user.id)
    
    return [
        {
            "session_id": session.session_id,
            "device_info": session.device_info,
            "ip_address": str(session.ip_address) if session.ip_address else None,
            "user_agent": session.user_agent,
            "is_secure": session.is_secure,
            "is_remember_me": session.is_remember_me,
            "mfa_verified": session.mfa_verified,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "expires_at": session.expires_at.isoformat(),
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Revoke a specific session.
    """
    success = await SessionService.revoke_session(db, session_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return {"message": "Session revoked successfully"}


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Logout the current user from all devices (revoke all tokens and sessions).
    """
    # Revoke all sessions
    count = await SessionService.revoke_all_sessions(db, current_user.id)
    
    # Revoke all tokens for the user
    await revoke_user_tokens(current_user.id)
    
    return {
        "message": "Successfully logged out from all devices",
        "sessions_revoked": count
    }


@router.post("/oauth/login", response_model=AuthResponse)
async def oauth_login(
    oauth_data: OAuthLogin,
    request: Request,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Login via OAuth (Google, Apple).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    from app.infrastructure.oauth.service import OAuthService
    from app.modules.users.models import UserRole, UserStatus
    
    logger.info(f"OAuth login attempt for provider: {oauth_data.provider}")
    logger.debug(f"Token length: {len(oauth_data.token) if oauth_data.token else 0} characters")
    
    # Verify token with provider
    try:
        if oauth_data.provider == "google":
            user_info = await OAuthService.verify_google_token(oauth_data.token)
            oauth_id_field = "google_id"
        elif oauth_data.provider == "apple":
            user_info = await OAuthService.verify_apple_token(oauth_data.token)
            oauth_id_field = "apple_id"
        elif oauth_data.provider == "facebook":
            user_info = await OAuthService.verify_facebook_token(oauth_data.token)
            oauth_id_field = "facebook_id"
        elif oauth_data.provider == "github":
            user_info = await OAuthService.verify_github_token(oauth_data.token)
            oauth_id_field = "github_id"
        else:
            logger.error(f"Invalid OAuth provider: {oauth_data.provider}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth provider. Supported: google, apple, facebook, github"
            )
    except HTTPException as e:
        logger.error(
            f"OAuth token verification failed for provider {oauth_data.provider}: "
            f"status={e.status_code}, detail={e.detail}"
        )
        raise
    except Exception as e:
        logger.exception(
            f"Unexpected error during OAuth verification for provider {oauth_data.provider}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during OAuth verification: {str(e)}"
        )
    
    if not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by OAuth provider"
        )
    
    # Check if user exists
    user_entity = await UserService.get_user_by_email(uow, user_info["email"])
    
    if not user_entity:
        # Create new user via service
        from app.modules.users.schemas import UserCreate
        from app.core.id import generate_typed_id
        from app.core.utils.images import get_cdn_url
        
        # Create user entity
        user_entity = UserEntity(
            id=generate_typed_id(prefix="USR"),
            email=user_info["email"],
            first_name=user_info.get("given_name") or (user_info.get("name", "").split()[0] if user_info.get("name") else None),
            last_name=user_info.get("family_name") or (" ".join(user_info.get("name", "").split()[1:]) if user_info.get("name") and len(user_info.get("name", "").split()) > 1 else None),
            role="guest",
            roles=[],
            status="active" if user_info.get("email_verified") else "pending_verification",
            is_active=True,
            is_email_verified=user_info.get("email_verified", False),
            is_phone_verified=False
        )
        
        # Create user model
        user_model = User(
            id=user_entity.id,
            email=user_entity.email,
            first_name=user_entity.first_name,
            last_name=user_entity.last_name,
            avatar_url=get_cdn_url(user_info.get("picture")) if user_info.get("picture") else None,
            is_email_verified=user_entity.is_email_verified,
            role=UserRole.GUEST,
            status=UserStatus.ACTIVE if user_entity.is_email_verified else UserStatus.PENDING_VERIFICATION,
            is_active=True,
        )
        
        uow.db.add(user_model)
        await uow.commit()
        await uow.db.refresh(user_model)
        
        # Create OAuth account link
        from app.modules.users.models import Account, AccountProvider
        account = Account(
            user_id=user_entity.id,
            provider=AccountProvider(oauth_data.provider.value),
            provider_id=user_info["sub"],
        )
        uow.db.add(account)
        await uow.commit()
    else:
        # Update OAuth account if needed
        from app.modules.users.models import Account, AccountProvider
        from sqlalchemy import select
        
        result = await uow.db.execute(
            select(Account).where(
                Account.user_id == user_entity.id,
                Account.provider == AccountProvider(oauth_data.provider.value)
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            account = Account(
                user_id=user_entity.id,
                provider=AccountProvider(oauth_data.provider.value),
                provider_id=user_info["sub"],
            )
            uow.db.add(account)
        
        # Update avatar if available
        result = await uow.db.execute(
            select(User).where(User.id == user_entity.id)
        )
        user_model = result.scalar_one_or_none()
        if user_model and user_info.get("picture") and not user_model.avatar_url:
            # Convert OAuth picture URL to CDN URL
            from app.core.utils.images import get_cdn_url
            user_model.avatar_url = get_cdn_url(user_info.get("picture"))
        
        await uow.commit()
    
    # Get the user model for response
    from sqlalchemy import select
    result = await uow.db.execute(
        select(User).where(User.id == user_entity.id)
    )
    user_model = result.scalar_one_or_none()
    
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User not found after creation"
        )
    
    # Validate user for login (OAuth users skip IP blocking and account lockout)
    # But still check if account is active
    from app.modules.users.models import UserStatus
    if not user_model.is_active or user_model.status not in {UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    # Complete authentication (OAuth login - mfa_verified=False, user will need to verify 2FA separately if enabled)
    return await AuthHelper.complete_authentication(
        db=uow.db,
        user_entity=user_entity,
        user_model=user_model,
        request=request,
        remember_me=False,
        mfa_verified=False,
        client_ip=SessionService.get_client_ip(request)
    )


@router.post("/password/reset/request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Request a password reset code.
    """
    verification = await UserService.request_password_reset(uow, reset_request.email)
    
    if verification:
        # Send email with reset code
        from app.infrastructure.email.service import EmailService
        from app.core.config import get_settings
        settings = get_settings()
        
        reset_url = f"{settings.app_name}/reset-password?code={verification.code}&email={reset_request.email}"
        
        await EmailService.send_template_email(
            to_email=reset_request.email,
            subject="Password Reset Request",
            template_name="verification",
            template_data={
                "name": reset_request.email.split("@")[0],
                "code": verification.code,
                "verification_url": reset_url
            }
        )
    
    # Always return success message (security: don't reveal if email exists)
    return {"message": "If the email exists, a password reset code has been sent"}


@router.post("/password/reset")
async def reset_password(
    reset_data: PasswordReset,
    request: Request,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Reset password using verification code.
    Enhanced with session management - revokes all existing sessions for security.
    """
    success = await UserService.reset_password(
        uow, reset_data.email, reset_data.code, reset_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password"
        )
    
    # Get user and revoke all sessions for security
    user = await AuthHelper.get_user_by_email(uow.db, reset_data.email)
    if user:
        # Revoke all sessions (password reset is a security event)
        revoked_count = await SessionService.revoke_all_sessions(uow.db, user.id)
        
        # Revoke all tokens
        await revoke_user_tokens(user.id)
        
        return {
            "message": "Password reset successfully. All sessions have been logged out for security.",
            "sessions_revoked": revoked_count
        }
    
    return {"message": "Password reset successfully"}


@router.post("/password/change")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    uow: IUnitOfWork = Depends(get_unit_of_work),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Change password for authenticated user.
    Enhanced with session management - revokes all sessions except current.
    """
    success = await UserService.change_password(
        uow, current_user.id, password_data.current_password, password_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to change password"
        )
    
    # Get current session_id from token to preserve it
    current_session_id = None
    try:
        token = credentials.credentials
        payload = decode_token(token, token_type="access")
        current_session_id = payload.get("session_id")
    except Exception:
        pass
    
    # Revoke all sessions except current
    revoked_count = await SessionService.revoke_all_sessions(
        db, current_user.id, exclude_session_id=current_session_id
    )
    
    # Revoke all tokens (will be recreated on next request)
    await revoke_user_tokens(current_user.id)
    
    return {
        "message": "Password changed successfully. All other sessions have been logged out.",
        "sessions_revoked": revoked_count
    }


@router.post("/email/verify")
async def verify_email(
    verification_data: EmailVerificationRequest,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Verify email address with verification code.

    This endpoint does not require authentication because users typically
    open the verification link from their email while not logged in.
    """
    # Find latest unused, non-expired verification entry by code
    result = await uow.db.execute(
        select(UserVerification).where(
            and_(
                UserVerification.code == verification_data.code,
                UserVerification.verification_type == "email",
                UserVerification.is_used == False,
                UserVerification.expires_at > datetime.utcnow(),
            )
        ).order_by(UserVerification.created_at.desc())
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # Mark the code as used
    verification.is_used = True
    verification.attempts += 1
    await uow.commit()

    # Mark email as verified for the associated user
    await UserService.verify_user(uow, verification.user_id, "email")

    return {"message": "Email verified successfully"}


class ResendEmailVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/email/resend-verification")
async def resend_email_verification(
    payload: ResendEmailVerificationRequest,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Resend email verification code.

    Made unauthenticated to allow users to resend after registering
    but before logging in. Requires the email in the request body.
    """
    # Find user by email
    result = await uow.db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    # Create new verification code
    verification = await UserService.create_verification_code(uow, user.id, "email")
    
    # Send email
    from app.infrastructure.email.service import EmailService
    from app.core.config import get_settings
    settings = get_settings()
    
    verify_url = f"{settings.app_name}/verify-email?code={verification.code}"


# ============================================================================
# Two-Factor Authentication (2FA) Routes
# ============================================================================

@router.post("/login/2fa/verify", response_model=AuthResponse)
async def verify_2fa_login(
    verify_data: TwoFactorLoginVerify,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verify 2FA code during login and complete authentication.
    Enhanced with session management and IP blocking.
    """
    # Get user
    user = await AuthHelper.get_user_by_email(db, verify_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate user for login
    from app.modules.users.session_service import SessionService
    client_ip = SessionService.get_client_ip(request)
    await AuthHelper.validate_user_for_login(db, user, client_ip)
    
    # Check if 2FA verification is pending (from login)
    from app.infrastructure.cache.redis import get_redis
    try:
        redis = await get_redis()
        pending = await redis.get(f"2fa_pending:{user.id}")
        if not pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending 2FA verification. Please login first."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify 2FA status"
        )
    
    # Verify 2FA code
    is_valid = await TwoFactorService.verify_2fa(
        db, user.id, verify_data.code, verify_data.is_backup_code
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # Clear pending 2FA
    try:
        await redis.delete(f"2fa_pending:{user.id}")
    except Exception:
        pass
    
    # Get user entity
    from app.domain.entities.user import UserEntity
    user_entity = UserEntity.from_model(user)
    
    # Complete authentication with MFA verified
    remember_me = getattr(verify_data, 'remember_me', False)
    return await AuthHelper.complete_authentication(
        db=db,
        user_entity=user_entity,
        user_model=user,
        request=request,
        remember_me=remember_me,
        mfa_verified=True,
        client_ip=client_ip
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Set up two-factor authentication (TOTP).
    Returns QR code and backup codes.
    """
    setup_data = await TwoFactorService.setup_totp(db, current_user.id)
    return setup_data


@router.post("/2fa/verify", status_code=status.HTTP_200_OK)
async def verify_2fa_setup(
    verify_data: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verify TOTP code to enable 2FA.
    """
    if verify_data.method != "totp":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only TOTP method is currently supported"
        )
    
    await TwoFactorService.verify_and_enable_totp(db, current_user.id, verify_data.code)
    
    return {"message": "2FA enabled successfully"}


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get 2FA status for current user.
    """
    requires, enabled = await TwoFactorService.check_2fa_requirement(db, current_user.id)
    backup_codes_count = len(current_user.backup_codes) if current_user.backup_codes else 0
    
    return {
        "enabled": enabled,
        "required": requires,
        "backup_codes_count": backup_codes_count
    }


@router.post("/2fa/disable", status_code=status.HTTP_200_OK)
async def disable_2fa(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Disable 2FA for current user (requires password verification).
    Enhanced with session management - preserves current session.
    """
    from app.core.security import verify_password
    if not current_user.hashed_password or not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    await TwoFactorService.disable_2fa(db, current_user.id, password_data.current_password)
    
    # Get current session_id to preserve it
    current_session_id = None
    try:
        token = credentials.credentials
        payload = decode_token(token, token_type="access")
        current_session_id = payload.get("session_id")
    except Exception:
        pass
    
    # Revoke all sessions except current (security measure when disabling 2FA)
    revoked_count = await SessionService.revoke_all_sessions(
        db, current_user.id, exclude_session_id=current_session_id
    )
    
    # Revoke all tokens (user will need to re-authenticate)
    await revoke_user_tokens(current_user.id)
    
    return {
        "message": "2FA disabled successfully. All other sessions have been logged out for security.",
        "sessions_revoked": revoked_count
    }


@router.post("/2fa/backup-codes/regenerate", status_code=status.HTTP_200_OK)
async def regenerate_backup_codes(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Regenerate backup codes for 2FA recovery.
    """
    codes = await TwoFactorService.regenerate_backup_codes(db, current_user.id)
    return {
        "backup_codes": codes,
        "message": "Backup codes regenerated. Please save these codes securely."
    }
    
    await EmailService.send_template_email(
        to_email=current_user.email,
        subject="Verify Your Email",
        template_name="verification",
        template_data={
            "name": current_user.first_name or current_user.email.split("@")[0],
            "code": verification.code,
            "verification_url": verify_url
        }
    )
    
    return {"message": "Verification code sent successfully"}


# ============================================================================
# GDPR Compliance Routes
# ============================================================================

@router.get("/data-export", response_model=DataExportResponse)
async def export_user_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Export all user data in JSON format (GDPR Article 15 - Right of Access).
    
    Returns comprehensive JSON export of all user data including:
    - Profile information
    - Bookings, reviews, messages
    - Preferences and settings
    - Activity logs
    """
    export_data = await GDPRService.export_user_data(db, current_user.id)
    return export_data


@router.post("/account/delete", status_code=status.HTTP_200_OK)
async def delete_account(
    deletion_request: AccountDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Permanently delete user account and all associated data (GDPR Article 17 - Right to Erasure).
    
    WARNING: This action is irreversible. All user data will be permanently deleted.
    
    Some data may be anonymized rather than deleted to preserve business records:
    - Reviews: Anonymized (user identity removed, ratings preserved)
    - Completed bookings: Guest ID anonymized for historical records
    - Listings: Deactivated if user is host
    
    Requires password verification and explicit confirmation.
    """
    if not deletion_request.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion requires explicit confirmation"
        )
    
    success = await GDPRService.delete_user_account(
        db, current_user.id, deletion_request.password
    )
    
    if success:
        return {
            "message": "Account and all associated data have been permanently deleted",
            "deleted_at": datetime.utcnow().isoformat()
        }
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to delete account"
    )

