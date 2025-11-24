"""
Schemas للتقييمات - Review Schemas
Enhanced with new features
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.core.id import ID


class ReviewCreate(BaseModel):
    """Schema لإنشاء تقييم - Create review schema"""
    listing_id: ID
    booking_id: Optional[ID] = None
    overall_rating: float = Field(..., ge=1, le=5)
    cleanliness_rating: Optional[float] = Field(None, ge=1, le=5)
    communication_rating: Optional[float] = Field(None, ge=1, le=5)
    check_in_rating: Optional[float] = Field(None, ge=1, le=5)
    accuracy_rating: Optional[float] = Field(None, ge=1, le=5)
    location_rating: Optional[float] = Field(None, ge=1, le=5)
    value_rating: Optional[float] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = None


class ReviewResponseCreate(BaseModel):
    """Schema لإنشاء رد المضيف - Create host response schema"""
    comment: str = Field(..., min_length=1)


class ReviewResponseResponse(BaseModel):
    """Schema لاستجابة رد المضيف - Host response response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    review_id: ID
    host_profile_id: int
    comment: str
    created_at: datetime


class ReviewResponse(BaseModel):
    """Schema لاستجابة التقييم - Review response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    listing_id: ID
    booking_id: Optional[ID] = None
    guest_id: ID
    host_id: ID
    overall_rating: float
    cleanliness_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    check_in_rating: Optional[float] = None
    accuracy_rating: Optional[float] = None
    location_rating: Optional[float] = None
    value_rating: Optional[float] = None
    title: Optional[str] = None
    comment: Optional[str] = None
    is_verified: bool
    is_public: bool
    visibility: str
    moderation_status: str
    helpful_count: int
    response: Optional[ReviewResponseResponse] = None
    created_at: datetime


class ReviewListResponse(BaseModel):
    """Schema لقائمة التقييمات - Review list response"""
    items: list[ReviewResponse]
    total: int
    skip: int
    limit: int


class ReviewHelpfulRequest(BaseModel):
    """Schema لتقييم "مفيد" - Review helpful request"""
    is_helpful: bool = True
