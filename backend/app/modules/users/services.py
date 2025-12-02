"""
User Services
Using Repository Pattern and Domain Entities
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status

from app.repositories.unit_of_work import IUnitOfWork
from app.domain.entities.user import UserEntity
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.models import User, UserVerification, UserStatus, UserRole, HostProfile
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, generate_otp, validate_password_strength
)
from app.core.id import generate_typed_id, ID
from sqlalchemy import select


class UserService:
    """User service using repositories."""
    
    @staticmethod
    async def create_user(
        uow: IUnitOfWork,
        user_data: UserCreate
    ) -> UserEntity:
        """Create a new user."""
        # Validate password strength
        is_valid, error_message = validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Check if email exists
        existing = await uow.users.get_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(user_data.password)
        
        # Create domain entity
        user = UserEntity(
            id=generate_typed_id(prefix="USR"),
            email=user_data.email,
            phone_number=user_data.phone_number,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            language=user_data.language,
            currency=user_data.currency,
            role="guest",
            roles=[],
            status="pending_verification",
            is_active=True,
            is_email_verified=False,
            is_phone_verified=False
        )
        
        # Save through repository
        created = await uow.users.create(user)
        
        # Create User model for password storage (since domain entity doesn't store password)
        user_model = User(
            id=created.id,
            email=created.email,
            phone_number=created.phone_number,
            username=created.username,
            hashed_password=hashed_password,
            first_name=created.first_name,
            last_name=created.last_name,
            language=created.language,
            currency=created.currency,
            role=UserRole.GUEST,
            status=UserStatus.PENDING_VERIFICATION,
            is_active=True
        )
        
        uow.db.add(user_model)
        await uow.commit()
        
        return created
    
    @staticmethod
    async def get_user_by_id(
        uow: IUnitOfWork,
        user_id: ID
    ) -> Optional[UserEntity]:
        """Get user by ID."""
        return await uow.users.get_by_id(user_id)
    
    @staticmethod
    async def get_user_by_email(
        uow: IUnitOfWork,
        email: str
    ) -> Optional[UserEntity]:
        """Get user by email address."""
        return await uow.users.get_by_email(email)
    
    @staticmethod
    async def get_user_by_username(
        uow: IUnitOfWork,
        username: str
    ) -> Optional[UserEntity]:
        """Get user by username."""
        return await uow.users.get_by_username(username)
    
    @staticmethod
    async def authenticate_user(
        uow: IUnitOfWork,
        email: str,
        password: str
    ) -> Optional[UserEntity]:
        """Authenticate user credentials and return the user entity if valid."""
        user_entity = await uow.users.get_by_email(email)
        if not user_entity:
            return None
        
        # Get User model for password verification
        result = await uow.db.execute(
            select(User).where(User.id == user_entity.id)
        )
        user_model = result.scalar_one_or_none()
        
        if not user_model or not user_model.hashed_password:
            return None
        
        if not verify_password(password, user_model.hashed_password):
            return None
        
        # Use domain logic
        if not user_entity.is_active:
            return None
        
        return user_entity
    
    @staticmethod
    async def update_user(
        uow: IUnitOfWork,
        user_id: ID,
        user_data: UserUpdate
    ) -> UserEntity:
        """Update user data."""
        user = await uow.users.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        updated = await uow.users.update(user)
        await uow.commit()
        return updated
    
    @staticmethod
    async def create_verification_code(
        uow: IUnitOfWork,
        user_id: ID,
        verification_type: str
    ) -> UserVerification:
        """Create a verification code for the given user and type."""
        code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        verification = UserVerification(
            user_id=user_id,
            verification_type=verification_type,
            code=code,
            expires_at=expires_at,
            is_used=False
        )
        
        uow.db.add(verification)
        await uow.commit()
        await uow.db.refresh(verification)
        return verification
    
    @staticmethod
    async def verify_user(
        uow: IUnitOfWork,
        user_id: ID,
        verification_type: str
    ) -> UserEntity:
        """Mark user as verified for the given verification type."""
        user = await uow.users.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update verification status using domain logic
        if verification_type == "email":
            user.is_email_verified = True
        elif verification_type == "phone":
            user.is_phone_verified = True
        
        # Use domain logic to check if fully verified
        if user.is_verified():
            user.status = "active"
        
        updated = await uow.users.update(user)
        await uow.commit()
        return updated
    
    @staticmethod
    async def create_access_token_for_user(
        user: UserEntity,
        mfa_verified: bool = False
    ) -> dict:
        """Create access and refresh tokens for the given user.
        
        Args:
            user: User entity
            mfa_verified: Whether 2FA was verified (default: False)
        """
        from app.core.id import ID
        
        # Get user model to check 2FA status
        from app.modules.users.models import User
        from sqlalchemy import select
        
        # Note: If user is from entity, we need to fetch from DB to get totp_enabled
        # For now, we'll pass mfa_verified as parameter (set to True after 2FA verification)
        
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "mfa_verified": mfa_verified  # Include 2FA verification status in JWT
        }
        
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    async def verify_code(
        uow: IUnitOfWork,
        user_id: ID,
        code: str,
        verification_type: str
    ) -> bool:
        """Verify a verification code for the given user and type."""
        from sqlalchemy import and_
        
        result = await uow.db.execute(
            select(UserVerification).where(
                and_(
                    UserVerification.user_id == user_id,
                    UserVerification.verification_type == verification_type,
                    UserVerification.is_used == False,
                    UserVerification.expires_at > datetime.utcnow()
                )
            ).order_by(UserVerification.created_at.desc())
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            return False
        
        # Increment attempts
        verification.attempts += 1
        
        # Check if code matches
        if verification.code != code:
            # Mark as used if too many attempts
            if verification.attempts >= 5:
                verification.is_used = True
            await uow.commit()
            return False
        
        # Mark as used
        verification.is_used = True
        await uow.commit()
        return True
    
    @staticmethod
    async def track_failed_login(
        uow: IUnitOfWork,
        email: str,
        client_ip: Optional[str] = None
    ) -> tuple[bool, Optional[int]]:
        """
        Track failed login attempt and check if account should be locked.
        
        Returns:
            tuple[bool, Optional[int]]: (is_locked, remaining_attempts)
        """
        from app.infrastructure.cache.redis import get_redis
        
        try:
            redis = await get_redis()
            key = f"failed_login:{email}"
            
            # Get current count
            count = await redis.get(key)
            count = int(count) if count else 0
            
            # Increment
            count += 1
            await redis.setex(key, 900, count)  # 15 minutes window
            
            # Lock after 5 failed attempts
            max_attempts = 5
            if count >= max_attempts:
                # Lock account for 15 minutes
                lock_key = f"account_locked:{email}"
                await redis.setex(lock_key, 900, "1")  # 15 minutes
                return True, 0
            
            return False, max_attempts - count
        except Exception:
            # If Redis fails, don't block login but log error
            return False, None
    
    @staticmethod
    async def is_account_locked(
        email: str
    ) -> bool:
        """Check if account is locked due to failed login attempts."""
        from app.infrastructure.cache.redis import get_redis
        
        try:
            redis = await get_redis()
            lock_key = f"account_locked:{email}"
            locked = await redis.get(lock_key)
            return locked is not None
        except Exception:
            return False
    
    @staticmethod
    async def clear_failed_login_attempts(
        email: str
    ) -> bool:
        """Clear failed login attempts after successful login."""
        from app.infrastructure.cache.redis import get_redis
        
        try:
            redis = await get_redis()
            key = f"failed_login:{email}"
            lock_key = f"account_locked:{email}"
            await redis.delete(key)
            await redis.delete(lock_key)
            return True
        except Exception:
            return False
    
    @staticmethod
    async def request_password_reset(
        uow: IUnitOfWork,
        email: str
    ) -> Optional[UserVerification]:
        """Request a password reset code for the given email."""
        user = await uow.users.get_by_email(email)
        if not user:
            # Don't reveal if user exists (security)
            return None
        
        # Create password reset verification code
        verification = await UserService.create_verification_code(
            uow, user.id, "password_reset"
        )
        
        return verification
    
    @staticmethod
    async def reset_password(
        uow: IUnitOfWork,
        email: str,
        code: str,
        new_password: str
    ) -> bool:
        """Reset password using verification code."""
        # Validate password strength
        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        user = await uow.users.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify code
        is_valid_code = await UserService.verify_code(
            uow, user.id, code, "password_reset"
        )
        if not is_valid_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code"
            )
        
        # Update password
        result = await uow.db.execute(
            select(User).where(User.id == user.id)
        )
        user_model = result.scalar_one_or_none()
        if user_model:
            user_model.hashed_password = get_password_hash(new_password)
            await uow.commit()
            return True
        
        return False
    
    @staticmethod
    async def change_password(
        uow: IUnitOfWork,
        user_id: ID,
        current_password: str,
        new_password: str
    ) -> bool:
        """Change password for authenticated user."""
        # Validate new password strength
        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Get user model
        result = await uow.db.execute(
            select(User).where(User.id == user_id)
        )
        user_model = result.scalar_one_or_none()
        
        if not user_model or not user_model.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password authentication not available for this account"
            )
        
        # Verify current password
        if not verify_password(current_password, user_model.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Update password
        user_model.hashed_password = get_password_hash(new_password)
        await uow.commit()
        return True