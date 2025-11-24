"""
نماذج مخطط السفر بالذكاء الاصطناعي - AI Travel Planner Models
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime,
    Text, Index, ForeignKey, Numeric, Date, ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class TravelPlan(BaseModel):
    """
    جدول خطط السفر
    Travel plans table
    """
    __tablename__ = "travel_plans"
    
    # User
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Request Details
    destination = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False)
    budget = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    travelers_count = Column(Integer, default=1, nullable=False)
    travel_style = Column(String(50), nullable=True)  # family, solo, couple, business, etc.
    preferences = Column(JSONB, default=dict, nullable=True)  # User preferences
    
    # Generated Plan
    plan_title = Column(String(200), nullable=True)
    plan_summary = Column(Text, nullable=True)
    daily_itinerary = Column(JSONB, default=list, nullable=True)  # Array of daily plans
    recommended_listings = Column(JSONB, default=list, nullable=True)  # Array of listing IDs
    recommended_properties = Column(JSONB, default=list, nullable=True)  # Legacy alias
    recommended_activities = Column(JSONB, default=list, nullable=True)
    recommended_restaurants = Column(JSONB, default=list, nullable=True)
    transportation_suggestions = Column(JSONB, default=list, nullable=True)
    
    # Estimated Costs
    estimated_accommodation_cost = Column(Numeric(10, 2), nullable=True)
    estimated_activities_cost = Column(Numeric(10, 2), nullable=True)
    estimated_food_cost = Column(Numeric(10, 2), nullable=True)
    estimated_transportation_cost = Column(Numeric(10, 2), nullable=True)
    total_estimated_cost = Column(Numeric(10, 2), nullable=True)
    
    # Status
    is_saved = Column(Boolean, default=False, nullable=False, index=True)
    is_booked = Column(Boolean, default=False, nullable=False, index=True)
    
    # AI Metadata
    ai_model_used = Column(String(50), nullable=True)
    ai_prompt = Column(Text, nullable=True)
    ai_response = Column(JSONB, nullable=True)
    
    # Metadata
    metadata = Column(JSONB, default=dict, nullable=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    bookings = relationship("TravelPlanBooking", back_populates="travel_plan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_travel_plan_user_saved", "user_id", "is_saved"),
        Index("idx_travel_plan_dates", "start_date", "end_date"),
    )


class TravelPlanBooking(BaseModel):
    """
    جدول حجوزات مرتبطة بخطة سفر
    Travel plan bookings table
    """
    __tablename__ = "travel_plan_bookings"
    
    travel_plan_id = Column(String(40), ForeignKey("travel_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(String(40), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=True)  # Which day of the plan
    
    # Relationships
    travel_plan = relationship("TravelPlan", back_populates="bookings", lazy="selectin")
    booking = relationship("Booking", lazy="selectin")
    
    __table_args__ = (
        Index("idx_travel_plan_booking", "travel_plan_id", "booking_id", unique=True),
    )

