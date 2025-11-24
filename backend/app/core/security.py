"""
نظام الأمان والمصادقة - Security & Authentication
JWT, Password Hashing, OAuth2
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import re
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق من كلمة المرور - Verify password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """تشفير كلمة المرور - Hash password"""
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    إنشاء JWT Access Token
    Create JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    إنشاء JWT Refresh Token
    Create JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """
    فك تشفير JWT Token
    Decode JWT token
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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
    """إنشاء رمز OTP آمن - Generate secure OTP code"""
    import secrets
    return str(secrets.randbelow(900000) + 100000)  # 100000-999999


def verify_otp(stored_otp: str, provided_otp: str) -> bool:
    """التحقق من رمز OTP - Verify OTP code"""
    return stored_otp == provided_otp


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    التحقق من قوة كلمة المرور - Validate password strength
    Returns: (is_valid, error_message)
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

