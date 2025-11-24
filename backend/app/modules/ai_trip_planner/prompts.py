"""
Prompts للذكاء الاصطناعي - AI Prompts
"""
import json
from typing import Dict, Any, Optional


def get_travel_plan_prompt(
    destination: str,
    start_date: str,
    end_date: str,
    duration_days: int,
    budget: float,
    currency: str,
    travelers_count: int,
    travel_style: Optional[str] = None,
    preferences: Optional[Dict[str, Any]] = None,
    natural_language_request: Optional[str] = None
) -> str:
    """
    بناء prompt لخطة السفر
    Build travel plan prompt
    """
    prompt = f"""Create a detailed travel plan in JSON format with the following structure:

{{
  "title": "Trip title",
  "summary": "Brief summary of the trip",
  "daily_itinerary": [
    {{
      "day": 1,
      "date": "{start_date}",
      "activities": [
        {{
          "name": "Activity name",
          "description": "Activity description",
          "duration": "2 hours",
          "cost": 50,
          "location": "Address or area",
          "booking_url": "Optional booking URL"
        }}
      ],
      "restaurants": [
        {{
          "name": "Restaurant name",
          "cuisine": "Type of cuisine",
          "price_range": "$$",
          "location": "Address",
          "reservation_url": "Optional reservation URL"
        }}
      ],
      "notes": "Additional notes for the day"
    }}
  ],
  "recommended_listing_ids": [1, 2, 3],
  "activities": [
    {{
      "name": "Activity name",
      "category": "sightseeing",
      "description": "Description",
      "estimated_cost": 50
    }}
  ],
  "restaurants": [
    {{
      "name": "Restaurant name",
      "cuisine": "Type",
      "price_range": "$$",
      "estimated_cost_per_person": 30
    }}
  ],
  "transportation": [
    {{
      "type": "flight/train/bus/car_rental",
      "description": "Description",
      "estimated_cost": 200
    }}
  ],
  "costs": {{
    "accommodation": 500,
    "activities": 200,
    "food": 300,
    "transportation": 200,
    "total": 1200
  }}
}}

Requirements:
- Destination: {destination}
- Dates: {start_date} to {end_date} ({duration_days} days)
- Budget: {budget} {currency}
- Travelers: {travelers_count} {"people" if travelers_count > 1 else "person"}
"""
    
    if travel_style:
        prompt += f"- Travel style: {travel_style}\n"
    
    if natural_language_request:
        prompt += f"\nUser request: {natural_language_request}\n"
    
    if preferences:
        import json
        prompt += f"\nUser preferences: {json.dumps(preferences, indent=2)}\n"
    
    prompt += """
- Create a realistic, detailed daily itinerary
- Include a mix of activities (sightseeing, cultural, entertainment)
- Recommend restaurants for each day
- Suggest transportation options
- Ensure total estimated costs are within budget
- Make the plan practical and enjoyable
- Consider the destination's highlights and local culture
"""
    
    return prompt

