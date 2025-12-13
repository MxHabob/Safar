"""
Wishlist schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.core.id import ID


class WishlistItemBase(BaseModel):
    """Base wishlist item schema."""
    listing_id: ID


class WishlistItemCreate(WishlistItemBase):
    """Schema for adding an item to wishlist."""
    pass


class WishlistItemResponse(WishlistItemBase):
    """Schema for wishlist item response."""
    id: ID
    user_id: ID
    created_at: datetime
    updated_at: datetime
    
    # Listing details (populated from relationship)
    listing_title: Optional[str] = None
    listing_image_url: Optional[str] = None
    listing_city: Optional[str] = None
    listing_country: Optional[str] = None
    listing_price: Optional[float] = None
    listing_currency: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class WishlistListResponse(BaseModel):
    """Schema for wishlist list response."""
    items: List[WishlistItemResponse]
    total: int
    skip: int
    limit: int


class WishlistShareCreate(BaseModel):
    """Schema for creating a wishlist share."""
    shared_with_user_id: Optional[ID] = None
    shared_with_email: Optional[str] = Field(None, description="Email of user to share with")
    permission: str = Field(default="view", description="Permission level: view, edit")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date for share")


class WishlistShareResponse(BaseModel):
    """Schema for wishlist share response."""
    id: ID
    wishlist_id: ID
    shared_by_user_id: ID
    shared_with_user_id: Optional[ID] = None
    shared_with_email: Optional[str] = None
    share_token: str
    permission: str
    expires_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class WishlistShareListResponse(BaseModel):
    """Schema for list of wishlist shares."""
    items: List[WishlistShareResponse]
    total: int


class WishlistShareByTokenResponse(BaseModel):
    """Schema for accessing shared wishlist by token."""
    share: WishlistShareResponse
    wishlist_items: List[WishlistItemResponse]
    shared_by_user_name: Optional[str] = None

