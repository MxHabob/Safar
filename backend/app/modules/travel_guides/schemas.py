"""
Travel Guides schemas.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class TravelGuideCreate(BaseModel):
    """Schema for creating a travel guide."""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1, max_length=200)
    country: str = Field(..., min_length=1, max_length=100)
    summary: Optional[str] = Field(None, max_length=1000)
    city: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = Field(default_factory=list)
    categories: Optional[List[str]] = Field(default_factory=list)
    cover_image_url: Optional[str] = None
    image_urls: Optional[List[str]] = Field(default_factory=list)
    is_official: bool = False


class TravelGuideResponse(BaseModel):
    """Schema for travel guide response."""
    id: str
    title: str
    slug: str
    summary: Optional[str]
    content: str
    author_id: Optional[str]
    is_official: bool
    destination: str
    city: Optional[str]
    country: str
    cover_image_url: Optional[str]
    image_urls: List[str]
    tags: List[str]
    categories: List[str]
    reading_time_minutes: Optional[int]
    view_count: int
    like_count: int
    bookmark_count: int
    status: str
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserStoryCreate(BaseModel):
    """Schema for creating a user story."""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1, max_length=200)
    country: str = Field(..., min_length=1, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    travel_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    travel_style: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    cover_image_url: Optional[str] = None
    image_urls: Optional[List[str]] = Field(default_factory=list)
    video_urls: Optional[List[str]] = Field(default_factory=list)
    guide_id: Optional[str] = None


class UserStoryResponse(BaseModel):
    """Schema for user story response."""
    id: str
    author_id: str
    title: str
    content: str
    summary: Optional[str]
    destination: str
    city: Optional[str]
    country: str
    cover_image_url: Optional[str]
    image_urls: List[str]
    video_urls: List[str]
    travel_date: Optional[datetime]
    duration_days: Optional[int]
    travel_style: Optional[str]
    tags: List[str]
    view_count: int
    like_count: int
    comment_count: int
    share_count: int
    guide_id: Optional[str]
    status: str
    published_at: Optional[datetime]
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

