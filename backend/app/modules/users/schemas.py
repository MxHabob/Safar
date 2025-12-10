"""
User schemas, enhanced with additional security-related structures.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.modules.users.models import UserRole, UserStatus, AccountProvider
from app.core.id import ID


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    phone_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8)
    language: str = "ar"
    locale: str = "en"
    currency: str = "USD"


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None
    locale: Optional[str] = None
    currency: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class UserResponse(UserBase):
    """Schema returned in user responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    is_email_verified: bool
    is_phone_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole
    roles: List[str] = []
    status: UserStatus
    is_active: bool
    locale: str
    language: str
    currency: str
    created_at: datetime
    country: Optional[str] = None
    city: Optional[str] = None


class AccountResponse(BaseModel):
    """Schema returned in account responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    provider: AccountProvider
    provider_id: str
    scopes: List[str] = []
    expires_at: Optional[datetime] = None
    created_at: datetime


class UserDeviceResponse(BaseModel):
    """Schema returned in user device responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    platform: str
    fingerprint: str
    last_seen_at: datetime
    is_trusted: bool
    created_at: datetime


class HostProfileResponse(BaseModel):
    """Schema returned in host profile responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    user_id: ID
    legal_name: str
    status: str
    badges: List[str] = []
    bio: Optional[str] = None
    onboarding_step: str
    created_at: datetime
    updated_at: datetime


class HostProfileCreate(BaseModel):
    """Schema for creating a host profile."""
    legal_name: str = Field(..., min_length=2)
    bio: Optional[str] = None


class HostProfileUpdate(BaseModel):
    """Schema for updating a host profile."""
    legal_name: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login requests."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema returned when issuing access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(BaseModel):
    """Schema returned when logging in - includes tokens and user data."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    session_id: str


class RefreshTokenRequest(BaseModel):
    """Schema for refresh-token requests."""
    refresh_token: str


class OAuthLogin(BaseModel):
    """Schema for OAuth-based login requests."""
    provider: AccountProvider
    token: str
    provider_id: Optional[str] = None


class OTPRequest(BaseModel):
    """Schema for requesting a one-time password (OTP)."""
    phone_number: str


class OTPVerify(BaseModel):
    """Schema for verifying a one-time password (OTP)."""
    phone_number: str
    code: str


class PasskeyRegisterRequest(BaseModel):
    """Schema for registering a passkey credential."""
    credential_id: str
    public_key: str
    transports: List[str] = []


class TwoFactorSetupRequest(BaseModel):
    """Schema for configuring two-factor authentication (2FA)."""
    method: str = Field(..., pattern="^(totp|sms|email)$")


class TwoFactorVerifyRequest(BaseModel):
    """Schema for verifying two-factor authentication (2FA)."""
    code: str
    method: str


class TwoFactorLoginVerify(BaseModel):
    """Schema for verifying 2FA during login."""
    email: EmailStr
    code: str
    is_backup_code: bool = False


class TwoFactorSetupResponse(BaseModel):
    """Schema for 2FA setup response."""
    secret: str
    qr_code: str
    backup_codes: List[str]
    message: str


class TwoFactorStatusResponse(BaseModel):
    """Schema for 2FA status response."""
    enabled: bool
    required: bool
    backup_codes_count: int


class AccountDeletionRequest(BaseModel):
    """Schema for account deletion request."""
    password: str = Field(..., description="Password verification required for account deletion")
    confirm: bool = Field(..., description="Must be true to confirm deletion")


class DataExportResponse(BaseModel):
    """Schema for GDPR data export response."""
    export_date: str
    user_id: str
    data: Dict[str, Any]


class PasswordResetRequest(BaseModel):
    """Schema for requesting a password reset."""
    email: EmailStr


class PasswordReset(BaseModel):
    """Schema for resetting password with verification code."""
    email: EmailStr
    code: str
    new_password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    """Schema for changing password (authenticated user)."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class EmailVerificationRequest(BaseModel):
    """Schema for verifying email with code."""
    code: str