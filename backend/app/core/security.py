"""
Security and authentication utilities.

Includes JWT handling, password hashing, and related helpers.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import re
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bcrypt has a 72-byte limit on password length
BCRYPT_MAX_PASSWORD_LENGTH = 72


def _normalize_password_for_bcrypt(password: str) -> str:
    """
    Normalize password for bcrypt compatibility.
    
    Bcrypt has a 72-byte limit. If the password exceeds this limit,
    we pre-hash it with SHA-256 to ensure it fits within bcrypt's constraints.
    This maintains security while working around bcrypt's limitation.
    """
    password_bytes = password.encode('utf-8')
    
    if len(password_bytes) <= BCRYPT_MAX_PASSWORD_LENGTH:
        # Password fits within bcrypt's limit, use as-is
        return password
    else:
        # Password exceeds bcrypt's limit, pre-hash with SHA-256
        # SHA-256 produces 32 bytes (64 hex chars), which fits within the limit
        sha256_hash = hashlib.sha256(password_bytes).hexdigest()
        return sha256_hash


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hashed value."""
    normalized_password = _normalize_password_for_bcrypt(plain_password)
    return pwd_context.verify(normalized_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for secure storage."""
    normalized_password = _normalize_password_for_bcrypt(password)
    return pwd_context.hash(normalized_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """Decode and validate a JWT token for the given token type."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def generate_otp() -> str:
    """Generate a secure one-time password (OTP) code."""
    import secrets
    return str(secrets.randbelow(900000) + 100000)  # 100000-999999


def verify_otp(stored_otp: str, provided_otp: str) -> bool:
    """Verify that the provided OTP matches the stored value."""
    return stored_otp == provided_otp


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.

    Returns:
        tuple[bool, Optional[str]]: ``(is_valid, error_message)``.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    common_passwords = [
        "password", "12345678", "qwerty", "abc123", "password123",
        "admin", "letmein", "welcome", "monkey", "1234567890"
    ]
    if password.lower() in common_passwords:
        return False, "Password is too common. Please choose a stronger password"
    
    return True, None

