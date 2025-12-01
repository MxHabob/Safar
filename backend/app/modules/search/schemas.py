"""
Search schemas.
"""
from typing import Optional
from pydantic import BaseModel, Field
from app.modules.listings.schemas import ListingResponse


class SearchRequest(BaseModel):
    """Schema for search requests."""
    query: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    listing_type: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_guests: Optional[int] = Field(None, ge=1)
    min_bedrooms: Optional[int] = Field(None, ge=0)
    min_bathrooms: Optional[int] = Field(None, ge=0)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_km: Optional[float] = Field(None, ge=0, le=1000)
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)


class SearchResponse(BaseModel):
    """Schema for search responses."""
    items: list[ListingResponse]
    total: int
    skip: int
    limit: int
    query: Optional[str] = None


class SearchSuggestion(BaseModel):
    """Schema for a single search suggestion."""
    type: str
    text: str
    value: str


class SearchSuggestionsResponse(BaseModel):
    """Schema for search suggestions response."""
    suggestions: list[SearchSuggestion]

