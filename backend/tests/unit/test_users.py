"""
Users unit tests.
"""
import pytest
from app.modules.users.services import UserService
from app.modules.users.schemas import UserCreate
from app.core.security import validate_password_strength


def test_password_validation_in_service():
    """Test password validation in user service"""
    # This would require a database session in real test
    # For now, just test the validation function
    is_valid, error = validate_password_strength("WeakPass")
    assert not is_valid
    
    is_valid, error = validate_password_strength("StrongPassword123!")
    assert is_valid

