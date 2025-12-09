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

_pwd_context: Optional[CryptContext] = None

BCRYPT_MAX_PASSWORD_LENGTH = 72


def _get_pwd_context() -> CryptContext:
    """Get password context with lazy initialization."""
    global _pwd_context
    if _pwd_context is None:
        _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return _pwd_context


def _normalize_password_for_bcrypt(password: str) -> bytes:
    """
    Normalize password for bcrypt compatibility.
    
    Bcrypt has a 72-byte limit. If the password exceeds this limit,
    we pre-hash it with SHA-256 to ensure it fits within bcrypt's constraints.
    This is a standard, secure practice recommended by security experts.
    
    Returns bytes that are guaranteed to be <= 72 bytes.
    Uses SHA-256 binary digest (32 bytes) for consistency and security.
    """
    password_bytes = password.encode('utf-8')
    
    if len(password_bytes) <= BCRYPT_MAX_PASSWORD_LENGTH:
        # Password fits within bcrypt's limit, use as-is
        return password_bytes
    else:
        # Password exceeds bcrypt's limit, pre-hash with SHA-256
        # SHA-256 produces exactly 32 bytes, well within the 72-byte limit
        sha256_hash = hashlib.sha256(password_bytes).digest()
        return sha256_hash


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against its hashed value.
    
    Uses bcrypt directly to avoid passlib initialization issues.
    Maintains compatibility with both passlib and direct bcrypt hashes.
    """
    try:
        import bcrypt
        normalized_bytes = _normalize_password_for_bcrypt(plain_password)
        hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(normalized_bytes, hashed_bytes)
    except ImportError:
        # Fallback to passlib if bcrypt is not available
        try:
            normalized_bytes = _normalize_password_for_bcrypt(plain_password)
            password_bytes = plain_password.encode('utf-8')
            if len(password_bytes) <= BCRYPT_MAX_PASSWORD_LENGTH:
                # Use original password for backward compatibility
                pwd_context = _get_pwd_context()
                return pwd_context.verify(plain_password, hashed_password)
            else:
                # For pre-hashed, convert bytes to hex string for passlib
                normalized_str = hashlib.sha256(password_bytes).hexdigest()
                pwd_context = _get_pwd_context()
                return pwd_context.verify(normalized_str, hashed_password)
        except Exception:
            return False
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password for secure storage.
    
    Uses bcrypt directly to avoid passlib initialization issues while maintaining
    security. Pre-hashes passwords > 72 bytes with SHA-256 (standard practice).
    
    This approach:
    1. Avoids passlib's initialization wrap bug detection issue
    2. Maintains cryptographic security (SHA-256 + bcrypt)
    3. Produces standard bcrypt hashes compatible with both bcrypt and passlib verification
    """
    try:
        import bcrypt
        normalized_bytes = _normalize_password_for_bcrypt(password)
        # Generate salt and hash using bcrypt directly
        # Using 12 rounds (default) for good security/performance balance
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(normalized_bytes, salt)
        return hashed.decode('utf-8')
    except ImportError:
        # Fallback to passlib if bcrypt is not available (shouldn't happen in production)
        normalized_bytes = _normalize_password_for_bcrypt(password)
        password_bytes = password.encode('utf-8')
        if len(password_bytes) <= BCRYPT_MAX_PASSWORD_LENGTH:
            normalized_str = password
        else:
            # Use hexdigest for passlib (it expects strings)
            normalized_str = hashlib.sha256(password_bytes).hexdigest()
        
        pwd_context = _get_pwd_context()
        return pwd_context.hash(normalized_str)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.
    
    Uses the configured algorithm and secret key.
    """
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


# ============================================================================
# MFA Encryption (Fernet)
# ============================================================================

_fernet_instance: Optional[Any] = None


def _get_fernet() -> Any:
    """
    Get Fernet encryption instance with lazy initialization.
    
    Uses PBKDF2 to derive key from SECRET_KEY if ENCRYPTION_KEY is not set.
    """
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance
    
    try:
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        import base64
        
        encryption_key = settings.encryption_key
        
        if encryption_key:
            # Use provided encryption key
            try:
                _fernet_instance = Fernet(encryption_key.encode())
                return _fernet_instance
            except Exception:
                # If key is invalid, fall back to derived key
                pass
        
        # Derive key from SECRET_KEY using PBKDF2
        # This ensures we always have a valid key even if ENCRYPTION_KEY is not set
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'safar_mfa_encryption_salt',  # Fixed salt for consistency
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.secret_key.encode()))
        _fernet_instance = Fernet(key)
        return _fernet_instance
    except ImportError:
        raise ImportError(
            "cryptography package is required for MFA encryption. "
            "Install it with: pip install cryptography"
        )


def encrypt_secret(secret: str) -> str:
    """
    Encrypt a secret value (e.g., TOTP secret, backup codes) using Fernet.
    
    Args:
        secret: Plain text secret to encrypt
        
    Returns:
        Encrypted secret as base64-encoded string
    """
    fernet = _get_fernet()
    encrypted = fernet.encrypt(secret.encode())
    return encrypted.decode()


def decrypt_secret(encrypted_secret: str) -> str:
    """
    Decrypt an encrypted secret value.
    
    Args:
        encrypted_secret: Encrypted secret as base64-encoded string
        
    Returns:
        Decrypted plain text secret
    """
    fernet = _get_fernet()
    try:
        decrypted = fernet.decrypt(encrypted_secret.encode())
        return decrypted.decode()
    except Exception:
        # If decryption fails, return original (for backward compatibility)
        # This allows migration from unencrypted to encrypted secrets
        return encrypted_secret


def encrypt_backup_codes(codes: list[str]) -> str:
    """
    Encrypt a list of backup codes.
    
    Args:
        codes: List of backup code strings
        
    Returns:
        Encrypted JSON string
    """
    import json
    codes_json = json.dumps(codes)
    return encrypt_secret(codes_json)


def decrypt_backup_codes(encrypted_codes: str) -> list[str]:
    """
    Decrypt a list of backup codes.
    
    Args:
        encrypted_codes: Encrypted JSON string
        
    Returns:
        List of backup code strings
    """
    import json
    try:
        decrypted_json = decrypt_secret(encrypted_codes)
        return json.loads(decrypted_json)
    except (json.JSONDecodeError, ValueError):
        # If decryption/parsing fails, try to parse as plain JSON (backward compatibility)
        try:
            return json.loads(encrypted_codes)
        except json.JSONDecodeError:
            return []
