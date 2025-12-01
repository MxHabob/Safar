"""
Travel planner schemas.
"""
from datetime import date
from typing import Optional, Dict, Any, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class TravelPlanRequest(BaseModel):
    """Travel plan request schema."""
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
        description=(
            "Natural language description of the trip, for example: "
            "'Family trip to Paris for 5 days with a budget of 3000 USD'."
        ),
    )


class DailyItineraryItem(BaseModel):
    """Daily itinerary item."""
    day: int
    date: date
    activities: List[Dict[str, Any]]
    restaurants: List[Dict[str, Any]]
    notes: Optional[str] = None


class TravelPlanResponse(BaseModel):
    """Travel plan response schema."""
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

