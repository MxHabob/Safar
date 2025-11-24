"""
مسارات مخطط السفر بالذكاء الاصطناعي - AI Travel Planner Routes
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.config import get_settings
from app.modules.users.models import User
from app.modules.ai_trip_planner.schemas import (
    TravelPlanRequest, TravelPlanResponse, TravelPlanCreate
)
from app.modules.ai_trip_planner.services import AITravelPlannerService

router = APIRouter(prefix="/ai/travel-planner", tags=["AI Travel Planner"])
settings = get_settings()


@router.post("", response_model=TravelPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_travel_plan(
    plan_request: TravelPlanRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    إنشاء خطة سفر ذكية باستخدام الذكاء الاصطناعي
    Create AI-powered travel plan
    
    المستخدم يكتب وصف طبيعي مثل:
    "سفر عائلي إلى باريس 5 أيام بميزانية 3000 دولار"
    """
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured"
        )
    
    # Calculate duration
    duration = (plan_request.end_date - plan_request.start_date).days
    if duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Generate travel plan using AI
    travel_plan = await AITravelPlannerService.generate_travel_plan(
        db=db,
        user_id=current_user.id,
        destination=plan_request.destination,
        start_date=plan_request.start_date,
        end_date=plan_request.end_date,
        duration_days=duration,
        budget=plan_request.budget,
        currency=plan_request.currency,
        travelers_count=plan_request.travelers_count,
        travel_style=plan_request.travel_style,
        user_preferences=plan_request.preferences,
        natural_language_request=plan_request.natural_language_request
    )
    
    return travel_plan


@router.get("/{plan_id}", response_model=TravelPlanResponse)
async def get_travel_plan(
    plan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    الحصول على خطة سفر
    Get travel plan
    """
    from app.modules.ai_trip_planner.models import TravelPlan
    from sqlalchemy import select
    
    result = await db.execute(
        select(TravelPlan).where(
            TravelPlan.id == plan_id,
            TravelPlan.user_id == current_user.id
        )
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel plan not found"
        )
    
    return plan


@router.get("", response_model=list[TravelPlanResponse])
async def list_travel_plans(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    قائمة خطط السفر للمستخدم
    List user's travel plans
    """
    from app.modules.ai_trip_planner.models import TravelPlan
    from sqlalchemy import select
    
    result = await db.execute(
        select(TravelPlan)
        .where(TravelPlan.user_id == current_user.id)
        .order_by(TravelPlan.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    plans = result.scalars().all()
    
    return plans

