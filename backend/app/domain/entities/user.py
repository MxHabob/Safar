"""
User Domain Entity
"""
from typing import Optional, List
from datetime import datetime
from app.domain.base import DomainEntity
from app.core.id import ID


class UserEntity(DomainEntity):
    """User domain entity"""
    
    def __init__(
        self,
        id: Optional[ID] = None,
        email: str = "",
        phone_number: Optional[str] = None,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
        role: str = "guest",
        roles: List[str] = None,
        status: str = "pending_verification",
        is_active: bool = True,
        is_email_verified: bool = False,
        is_phone_verified: bool = False,
        language: str = "ar",
        locale: str = "en",
        currency: str = "USD",
        country: Optional[str] = None,
        city: Optional[str] = None,
        agency_id: Optional[ID] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        **kwargs
    ):
        super().__init__(id, created_at, updated_at)
        self.email = email
        self.phone_number = phone_number
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.full_name = full_name
        self.avatar_url = avatar_url
        self.bio = bio
        self.role = role
        self.roles = roles or []
        self.status = status
        self.is_active = is_active
        self.is_email_verified = is_email_verified
        self.is_phone_verified = is_phone_verified
        self.language = language
        self.locale = locale
        self.currency = currency
        self.country = country
        self.city = city
        self.agency_id = agency_id
    
    def is_host(self) -> bool:
        """Check if user is a host"""
        return "host" in self.roles or self.role == "host"
    
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return "admin" in self.roles or self.role in ["admin", "super_admin"]
    
    def is_verified(self) -> bool:
        """Check if user is verified"""
        return self.is_email_verified and (self.is_phone_verified or not self.phone_number)
    
    def get_display_name(self) -> str:
        """Get display name"""
        if self.full_name:
            return self.full_name
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username or self.email

