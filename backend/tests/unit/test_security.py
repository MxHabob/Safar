"""
Unit tests للأمان - Security unit tests
"""
import pytest
from app.core.security import (
    verify_password, get_password_hash, generate_otp,
    validate_password_strength, create_access_token, decode_token
)
from app.core.config import get_settings
from datetime import timedelta

settings = get_settings()


def test_password_hashing():
    """Test password hashing"""
    password = "TestPassword123!"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_password_validation():
    """Test password validation"""
    # Valid password
    is_valid, error = validate_password_strength("StrongPass123!")
    assert is_valid
    assert error is None
    
    # Too short
    is_valid, error = validate_password_strength("Short1!")
    assert not is_valid
    assert "8 characters" in error
    
    # No uppercase
    is_valid, error = validate_password_strength("lowercase123!")
    assert not is_valid
    assert "uppercase" in error
    
    # No lowercase
    is_valid, error = validate_password_strength("UPPERCASE123!")
    assert not is_valid
    assert "lowercase" in error
    
    # No digit
    is_valid, error = validate_password_strength("NoDigit!")
    assert not is_valid
    assert "digit" in error
    
    # No special character
    is_valid, error = validate_password_strength("NoSpecial123")
    assert not is_valid
    assert "special character" in error


def test_otp_generation():
    """Test OTP generation"""
    otp1 = generate_otp()
    otp2 = generate_otp()
    
    assert len(otp1) == 6
    assert otp1.isdigit()
    assert otp1 != otp2  # Should be different


def test_jwt_token():
    """Test JWT token creation and decoding"""
    data = {"sub": 1, "email": "test@example.com"}
    token = create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    
    decoded = decode_token(token)
    assert decoded["sub"] == 1
    assert decoded["email"] == "test@example.com"

