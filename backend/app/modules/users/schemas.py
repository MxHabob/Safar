"""
Schemas للمستخدمين - User Schemas
Enhanced with new security features
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.modules.users.models import UserRole, UserStatus, AccountProvider
from app.core.id import ID


class UserBase(BaseModel):
    """Base schema للمستخدم - Base user schema"""
    email: EmailStr
    phone_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema لإنشاء مستخدم جديد - Create user schema"""
    password: str = Field(..., min_length=8)
    language: str = "ar"
    locale: str = "en"
    currency: str = "USD"


class UserUpdate(BaseModel):
    """Schema لتحديث المستخدم - Update user schema"""
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
    """Schema لاستجابة المستخدم - User response schema"""
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
    """Schema لاستجابة الحساب - Account response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    provider: AccountProvider
    provider_id: str
    scopes: List[str] = []
    expires_at: Optional[datetime] = None
    created_at: datetime


class UserDeviceResponse(BaseModel):
    """Schema لاستجابة جهاز المستخدم - User device response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    platform: str
    fingerprint: str
    last_seen_at: datetime
    is_trusted: bool
    created_at: datetime


class HostProfileResponse(BaseModel):
    """Schema لاستجابة ملف المضيف - Host profile response"""
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
    """Schema لإنشاء ملف مضيف - Create host profile schema"""
    legal_name: str = Field(..., min_length=2)
    bio: Optional[str] = None


class HostProfileUpdate(BaseModel):
    """Schema لتحديث ملف مضيف - Update host profile schema"""
    legal_name: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None


class UserLogin(BaseModel):
    """Schema لتسجيل الدخول - Login schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema لاستجابة Token - Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Schema لطلب Refresh Token - Refresh token request"""
    refresh_token: str


class OAuthLogin(BaseModel):
    """Schema لتسجيل الدخول عبر OAuth - OAuth login schema"""
    provider: AccountProvider
    token: str
    provider_id: Optional[str] = None


class OTPRequest(BaseModel):
    """Schema لطلب OTP - OTP request schema"""
    phone_number: str


class OTPVerify(BaseModel):
    """Schema للتحقق من OTP - OTP verification schema"""
    phone_number: str
    code: str


class PasskeyRegisterRequest(BaseModel):
    """Schema لتسجيل Passkey - Passkey registration request"""
    credential_id: str
    public_key: str
    transports: List[str] = []


class TwoFactorSetupRequest(BaseModel):
    """Schema لإعداد المصادقة الثنائية - 2FA setup request"""
    method: str = Field(..., pattern="^(totp|sms|email)$")


class TwoFactorVerifyRequest(BaseModel):
    """Schema للتحقق من المصادقة الثنائية - 2FA verification request"""
    code: str
    method: str
