"""
Schemas للقوائم - Listing Schemas
Enhanced with new features from database restructure
"""
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.modules.listings.models import ListingType, ListingStatus, BookingType
from app.core.id import ID


class ListingBase(BaseModel):
    """Base schema للقائمة - Base listing schema"""
    title: str = Field(..., min_length=5, max_length=500)
    summary: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    listing_type: ListingType
    address_line1: str = Field(..., min_length=5)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2)
    state: Optional[str] = None
    country: str = Field(..., min_length=2)
    postal_code: Optional[str] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    capacity: int = Field(default=1, ge=1)
    bedrooms: int = Field(default=0, ge=0)
    beds: int = Field(default=0, ge=0)
    bathrooms: Decimal = Field(default=0, ge=0)
    max_guests: int = Field(default=1, ge=1)
    square_meters: Optional[int] = None
    base_price: Decimal = Field(..., gt=0)
    currency: str = "USD"
    cleaning_fee: Optional[Decimal] = 0
    service_fee: Optional[Decimal] = 0
    security_deposit: Optional[Decimal] = 0
    booking_type: BookingType = BookingType.REQUEST
    min_stay_nights: Optional[int] = 1
    max_stay_nights: Optional[int] = None
    check_in_time: Optional[str] = "15:00"
    check_out_time: Optional[str] = "11:00"


class ListingCreate(ListingBase):
    """Schema لإنشاء قائمة - Create listing schema"""
    pass


class ListingUpdate(BaseModel):
    """Schema لتحديث قائمة - Update listing schema"""
    title: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    listing_type: Optional[ListingType] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    capacity: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[Decimal] = None
    max_guests: Optional[int] = None
    square_meters: Optional[int] = None
    base_price: Optional[Decimal] = None
    cleaning_fee: Optional[Decimal] = None
    service_fee: Optional[Decimal] = None
    security_deposit: Optional[Decimal] = None
    min_stay_nights: Optional[int] = None
    max_stay_nights: Optional[int] = None
    status: Optional[ListingStatus] = None


class ListingPhotoResponse(BaseModel):
    """Schema لصورة قائمة - Listing photo response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    position: int
    is_primary: bool


class ListingImageResponse(BaseModel):
    """Schema لصورة قائمة (من Prisma) - Listing image response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    url: str
    caption: Optional[str] = None
    position: int


class ListingLocationResponse(BaseModel):
    """Schema لموقع القائمة - Listing location response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    timezone: str
    neighborhood: Optional[str] = None
    # coordinates will be handled separately for PostGIS


class ListingResponse(ListingBase):
    """Schema لاستجابة القائمة - Listing response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    slug: str
    status: ListingStatus
    rating: Decimal
    review_count: int
    host_profile_id: Optional[ID] = None
    host_id: Optional[ID] = None
    photos: List[ListingPhotoResponse] = []
    images: List[ListingImageResponse] = []
    location: Optional[ListingLocationResponse] = None
    created_at: datetime
    updated_at: datetime


class ListingListResponse(BaseModel):
    """Schema لقائمة القوائم - Listing list response"""
    items: List[ListingResponse]
    total: int
    skip: int
    limit: int


class ListingLocationCreate(BaseModel):
    """Schema لإنشاء موقع قائمة - Create listing location schema"""
    timezone: str = "UTC"
    neighborhood: Optional[str] = None
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)


class ListingLocationUpdate(BaseModel):
    """Schema لتحديث موقع قائمة - Update listing location schema"""
    timezone: Optional[str] = None
    neighborhood: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

