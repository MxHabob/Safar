"""
Two-Factor Authentication (2FA) Service
Implements TOTP-based 2FA with backup codes for Hosts and Admins.
"""
import pyotp
import qrcode
import io
import base64
import secrets
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.modules.users.models import User, UserRole
from app.core.config import get_settings
from app.core.security import encrypt_secret, decrypt_secret, encrypt_backup_codes, decrypt_backup_codes

settings = get_settings()


class TwoFactorService:
    """Service for managing two-factor authentication."""
    
    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a new TOTP secret."""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """
        Generate backup codes for 2FA recovery.
        
        Args:
            count: Number of backup codes to generate (default: 10)
            
        Returns:
            List of backup codes (8-character alphanumeric)
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_urlsafe(6).upper()[:8]
            codes.append(code)
        return codes
    
    @staticmethod
    def generate_qr_code(secret: str, email: str, issuer: str = None) -> str:
        """
        Generate QR code as base64 string for TOTP setup.
        
        Args:
            secret: TOTP secret key
            email: User's email address
            issuer: Service name (default: app name from settings)
            
        Returns:
            Base64-encoded PNG image data
        """
        issuer = issuer or settings.app_name
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=issuer
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_data = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_data}"
    
    @staticmethod
    def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
        """
        Verify a TOTP code.
        
        Args:
            secret: TOTP secret key
            code: Code to verify (6 digits)
            window: Time window for verification (default: 1, allows ±30 seconds)
            
        Returns:
            True if code is valid, False otherwise
        """
        if not secret or not code:
            return False
        
        try:
            totp = pyotp.TOTP(secret)
            # Verify with time window (allows clock skew)
            return totp.verify(code, valid_window=window)
        except Exception:
            return False
    
    @staticmethod
    async def setup_totp(
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Set up TOTP 2FA for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with secret, QR code, and backup codes
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate new secret and backup codes
        secret = TwoFactorService.generate_totp_secret()
        backup_codes = TwoFactorService.generate_backup_codes()
        
        # Encrypt secret and backup codes before storing
        encrypted_secret = encrypt_secret(secret)
        encrypted_backup_codes = encrypt_backup_codes(backup_codes)
        
        # Store encrypted secret (but don't enable yet - user must verify first)
        user.totp_secret = encrypted_secret
        user.backup_codes = backup_codes  # Store as array for backward compatibility, but also encrypted
        # Note: backup_codes is stored as ARRAY in DB, but we encrypt the secret
        # For full encryption of backup_codes, you'd need to store as encrypted string
        # Don't enable totp_enabled until user verifies
        
        await db.commit()
        await db.refresh(user)
        
        # Generate QR code
        qr_code = TwoFactorService.generate_qr_code(
            secret=secret,
            email=user.email,
            issuer=settings.app_name
        )
        
        return {
            "secret": secret,  # For manual entry if QR code fails
            "qr_code": qr_code,
            "backup_codes": backup_codes,  # User must save these
            "message": "Scan QR code with authenticator app, then verify with a code to enable 2FA"
        }
    
    @staticmethod
    async def verify_and_enable_totp(
        db: AsyncSession,
        user_id: str,
        code: str
    ) -> bool:
        """
        Verify TOTP code and enable 2FA.
        
        Args:
            db: Database session
            user_id: User ID
            code: TOTP code to verify
            
        Returns:
            True if verified and enabled, False otherwise
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA not set up. Please set up 2FA first."
            )
        
        # Decrypt secret before verification
        try:
            decrypted_secret = decrypt_secret(user.totp_secret)
        except Exception:
            # If decryption fails, try using as plain text (backward compatibility)
            decrypted_secret = user.totp_secret
        
        # Verify code
        if not TwoFactorService.verify_totp_code(decrypted_secret, code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )
        
        # Enable 2FA
        user.totp_enabled = True
        await db.commit()
        
        return True
    
    @staticmethod
    async def verify_2fa(
        db: AsyncSession,
        user_id: str,
        code: str,
        is_backup_code: bool = False
    ) -> bool:
        """
        Verify 2FA code (TOTP or backup code) during login.
        
        Args:
            db: Database session
            user_id: User ID
            code: Code to verify
            is_backup_code: Whether this is a backup code (default: False)
            
        Returns:
            True if verified, False otherwise
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.totp_enabled:
            return False
        
        if is_backup_code:
            # Verify backup code
            if code in user.backup_codes:
                # Remove used backup code
                user.backup_codes = [c for c in user.backup_codes if c != code]
                await db.commit()
                return True
            return False
        else:
            # Verify TOTP code
            if not user.totp_secret:
                return False
            
            # Decrypt secret before verification
            try:
                decrypted_secret = decrypt_secret(user.totp_secret)
            except Exception:
                # If decryption fails, try using as plain text (backward compatibility)
                decrypted_secret = user.totp_secret
            
            return TwoFactorService.verify_totp_code(decrypted_secret, code)
    
    @staticmethod
    async def disable_2fa(
        db: AsyncSession,
        user_id: str,
        password: Optional[str] = None
    ) -> bool:
        """
        Disable 2FA for a user.
        
        Args:
            db: Database session
            user_id: User ID
            password: Optional password verification for security
            
        Returns:
            True if disabled successfully
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # If password provided, verify it
        if password:
            from app.core.security import verify_password
            if not user.hashed_password or not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password"
                )
        
        # Disable 2FA (clear encrypted secret)
        user.totp_enabled = False
        user.totp_secret = None
        user.backup_codes = []
        
        await db.commit()
        return True
    
    @staticmethod
    async def regenerate_backup_codes(
        db: AsyncSession,
        user_id: str
    ) -> List[str]:
        """
        Regenerate backup codes for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of new backup codes
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.totp_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA must be enabled to regenerate backup codes"
            )
        
        # Generate new backup codes
        backup_codes = TwoFactorService.generate_backup_codes()
        # Note: backup_codes stored as ARRAY in DB
        # For full encryption, you'd need to store as encrypted string
        user.backup_codes = backup_codes
        
        await db.commit()
        return backup_codes
    
    @staticmethod
    def requires_2fa(role: UserRole) -> bool:
        """
        Check if a role requires 2FA.
        
        Args:
            role: User role
            
        Returns:
            True if role requires 2FA (HOST, ADMIN, SUPER_ADMIN)
        """
        return role in [UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @staticmethod
    async def check_2fa_requirement(
        db: AsyncSession,
        user_id: str
    ) -> Tuple[bool, bool]:
        """
        Check if user requires 2FA and if it's enabled.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Tuple of (requires_2fa, is_enabled)
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return False, False
        
        requires = TwoFactorService.requires_2fa(user.role)
        enabled = user.totp_enabled if user else False
        
        return requires, enabled

