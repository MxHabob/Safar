"""
Schemas لمخطط السفر - Travel Planner Schemas
"""
from datetime import date
from typing import Optional, Dict, Any, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class TravelPlanRequest(BaseModel):
    """Schema لطلب خطة سفر - Travel plan request"""
    destination: str = Field(..., min_length=2, max_length=200)
    start_date: date
    end_date: date
    budget: Decimal = Field(..., gt=0)
    currency: str = "USD"
    travelers_count: int = Field(default=1, ge=1)
    travel_style: Optional[str] = None  # family, solo, couple, business, etc.
    preferences: Optional[Dict[str, Any]] = None
    natural_language_request: Optional[str] = Field(
        None,
        description="وصف طبيعي للرحلة مثل: 'سفر عائلي إلى باريس 5 أيام بميزانية 3000 دولار'"
    )


class DailyItineraryItem(BaseModel):
    """عنصر في الجدولة اليومية - Daily itinerary item"""
    day: int
    date: date
    activities: List[Dict[str, Any]]
    restaurants: List[Dict[str, Any]]
    notes: Optional[str] = None


class TravelPlanResponse(BaseModel):
    """Schema لاستجابة خطة السفر - Travel plan response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    destination: str
    start_date: date
    end_date: date
    duration_days: int
    budget: Decimal
    currency: str
    travelers_count: int
    travel_style: Optional[str] = None
    plan_title: Optional[str] = None
    plan_summary: Optional[str] = None
    daily_itinerary: List[Dict[str, Any]] = []
    recommended_properties: List[int] = []
    recommended_activities: List[Dict[str, Any]] = []
    recommended_restaurants: List[Dict[str, Any]] = []
    transportation_suggestions: List[Dict[str, Any]] = []
    estimated_accommodation_cost: Optional[Decimal] = None
    estimated_activities_cost: Optional[Decimal] = None
    estimated_food_cost: Optional[Decimal] = None
    estimated_transportation_cost: Optional[Decimal] = None
    total_estimated_cost: Optional[Decimal] = None
    is_saved: bool
    is_booked: bool
    created_at: date

