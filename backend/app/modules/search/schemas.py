"""
Schemas للبحث - Search Schemas
"""
from typing import Optional
from pydantic import BaseModel, Field
from app.modules.listings.schemas import ListingResponse


class SearchRequest(BaseModel):
    """Schema لطلب البحث - Search request schema"""
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
    """Schema لاستجابة البحث - Search response schema"""
    items: list[ListingResponse]
    total: int
    skip: int
    limit: int
    query: Optional[str] = None


class SearchSuggestion(BaseModel):
    """Schema لاقتراح البحث - Search suggestion schema"""
    type: str
    text: str
    value: str


class SearchSuggestionsResponse(BaseModel):
    """Schema لاستجابة اقتراحات البحث - Search suggestions response"""
    suggestions: list[SearchSuggestion]

