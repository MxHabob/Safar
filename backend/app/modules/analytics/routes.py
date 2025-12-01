"""
Analytics API routes.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_optional_user
from app.modules.users.models import User
from app.modules.analytics.service import AnalyticsService
from app.modules.analytics.models import AnalyticsEvent
from app.core.id import ID

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class AnalyticsEventRequest(BaseModel):
    """Request schema for tracking analytics events."""
    event_name: str
    source: str = "web"
    payload: Optional[Dict[str, Any]] = None


@router.post("/events", response_model=AnalyticsEvent)
async def track_event(
    event_data: AnalyticsEventRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Track an analytics event.
    """
    event = await AnalyticsService.track_event(
        db,
        user_id=current_user.id if current_user else None,
        event_name=event_data.event_name,
        source=event_data.source,
        payload=event_data.payload
    )
    return event


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_metrics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get dashboard metrics for the current user.
    """
    metrics = await AnalyticsService.get_dashboard_metrics(
        db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    return metrics


@router.get("/trends", response_model=List[Dict[str, Any]])
async def get_booking_trends(
    days: int = Query(30, ge=1, le=365),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get booking trends over time.
    """
    trends = await AnalyticsService.get_booking_trends(
        db,
        days=days,
        user_id=current_user.id if current_user else None
    )
    return trends


@router.get("/destinations", response_model=List[Dict[str, Any]])
async def get_popular_destinations(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get most popular destinations.
    Public endpoint.
    """
    destinations = await AnalyticsService.get_popular_destinations(
        db, limit=limit, days=days
    )
    return destinations


@router.get("/insights", response_model=Dict[str, Any])
async def get_user_insights(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get user behavior insights.
    """
    insights = await AnalyticsService.get_user_behavior_insights(
        db, user_id=current_user.id
    )
    return insights

