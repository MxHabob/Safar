"""
Review schemas, enhanced with additional features.
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.core.id import ID


class ReviewCreate(BaseModel):
    """Schema for creating a review."""
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
    """Schema for creating a host response to a review."""
    comment: str = Field(..., min_length=1)


class ReviewResponseResponse(BaseModel):
    """Schema returned for a host's response to a review."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    review_id: ID
    host_profile_id: int
    comment: str
    created_at: datetime


class ReviewResponse(BaseModel):
    """Schema returned for a review, including aggregates and host response."""
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
    """Schema for a paginated list of reviews."""
    items: list[ReviewResponse]
    total: int
    skip: int
    limit: int


class ReviewHelpfulRequest(BaseModel):
    """Schema for marking a review as helpful or not helpful."""
    is_helpful: bool = True
