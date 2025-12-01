"""
AI travel planner services.
"""
from datetime import date, datetime
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.config import get_settings
from app.modules.ai_trip_planner.models import TravelPlan
from app.modules.ai_trip_planner.prompts import get_travel_plan_prompt

settings = get_settings()


class AITravelPlannerService:
    """AI travel planner service."""
    
    @staticmethod
    async def generate_travel_plan(
        db: AsyncSession,
        user_id: int,
        destination: str,
        start_date: date,
        end_date: date,
        duration_days: int,
        budget: Decimal,
        currency: str,
        travelers_count: int,
        travel_style: Optional[str] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
        natural_language_request: Optional[str] = None
    ) -> TravelPlan:
        """Generate a travel plan using AI."""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key is not configured")
        
        try:
            from openai import AsyncOpenAI
            
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            
            # Build prompt
            prompt = get_travel_plan_prompt(
                destination=destination,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
                duration_days=duration_days,
                budget=float(budget),
                currency=currency,
                travelers_count=travelers_count,
                travel_style=travel_style,
                preferences=user_preferences or {},
                natural_language_request=natural_language_request
            )
            
            # Call OpenAI API
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert travel planner. Generate detailed, practical travel plans in JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            ai_response = json.loads(response.choices[0].message.content)
            
            # Create travel plan
            travel_plan = TravelPlan(
                user_id=user_id,
                destination=destination,
                start_date=start_date,
                end_date=end_date,
                duration_days=duration_days,
                budget=budget,
                currency=currency,
                travelers_count=travelers_count,
                travel_style=travel_style,
                preferences=user_preferences or {},
                plan_title=ai_response.get("title"),
                plan_summary=ai_response.get("summary"),
                daily_itinerary=ai_response.get("daily_itinerary", []),
                recommended_listings=ai_response.get("recommended_listing_ids", []),
                recommended_activities=ai_response.get("activities", []),
                recommended_restaurants=ai_response.get("restaurants", []),
                transportation_suggestions=ai_response.get("transportation", []),
                estimated_accommodation_cost=Decimal(str(ai_response.get("costs", {}).get("accommodation", 0))),
                estimated_activities_cost=Decimal(str(ai_response.get("costs", {}).get("activities", 0))),
                estimated_food_cost=Decimal(str(ai_response.get("costs", {}).get("food", 0))),
                estimated_transportation_cost=Decimal(str(ai_response.get("costs", {}).get("transportation", 0))),
                total_estimated_cost=Decimal(str(ai_response.get("costs", {}).get("total", 0))),
                ai_model_used=settings.openai_model,
                ai_prompt=prompt,
                ai_response=ai_response,
                is_saved=False,
                is_booked=False
            )
            
            db.add(travel_plan)
            await db.commit()
            await db.refresh(travel_plan)
            
            return travel_plan
            
        except Exception as e:
            # Fallback: Create a basic plan without AI
            travel_plan = TravelPlan(
                user_id=user_id,
                destination=destination,
                start_date=start_date,
                end_date=end_date,
                duration_days=duration_days,
                budget=budget,
                currency=currency,
                travelers_count=travelers_count,
                travel_style=travel_style,
                preferences=user_preferences or {},
                plan_title=f"Trip to {destination}",
                plan_summary=f"A {duration_days}-day trip to {destination}",
                daily_itinerary=[],
                recommended_properties=[],
                recommended_activities=[],
                recommended_restaurants=[],
                transportation_suggestions=[],
                ai_model_used=None,
                ai_prompt=None,
                ai_response={"error": str(e)},
                is_saved=False,
                is_booked=False
            )
            
            db.add(travel_plan)
            await db.commit()
            await db.refresh(travel_plan)
            
            return travel_plan

