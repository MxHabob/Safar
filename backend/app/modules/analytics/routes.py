"""
Analytics and Audit Logging Routes
"""
from typing import Any, Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.dependencies import require_admin
from app.modules.users.models import User, UserRole
from app.modules.analytics.models import AuditLog
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/audit-logs")
async def get_audit_logs(
    actor_id: Optional[str] = Query(None, description="Filter by actor (user) ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_admin),  # Only admins can view audit logs
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get audit logs with filtering options.
    Only accessible to admins.
    """
    query = select(AuditLog)
    
    # Apply filters
    filters = []
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)
    if action:
        filters.append(AuditLog.action == action)
    if resource_type:
        filters.append(AuditLog.resource == resource_type)
    if resource_id:
        filters.append(AuditLog.resource_id == resource_id)
    if start_date:
        filters.append(AuditLog.created_at >= start_date)
    if end_date:
        filters.append(AuditLog.created_at <= end_date)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    
    # Load actor relationship
    query = query.options(
        # selectinload for actor if needed
    )
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "items": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/audit-logs/{log_id}")
async def get_audit_log(
    log_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific audit log entry. Only accessible to admins."""
    result = await db.execute(
        select(AuditLog).where(AuditLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    return log


@router.get("/audit-logs/stats/summary")
async def get_audit_logs_summary(
    days: int = Query(7, ge=1, le=90, description="Number of days to summarize"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get audit logs summary statistics.
    Only accessible to admins.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total actions
    total_query = select(func.count(AuditLog.id)).where(
        AuditLog.created_at >= start_date
    )
    total_result = await db.execute(total_query)
    total_actions = total_result.scalar() or 0
    
    # Actions by type
    actions_query = select(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.created_at >= start_date
    ).group_by(AuditLog.action)
    actions_result = await db.execute(actions_query)
    actions_by_type = {row.action: row.count for row in actions_result.all()}
    
    # Resources by type
    resources_query = select(
        AuditLog.resource,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.created_at >= start_date
    ).group_by(AuditLog.resource)
    resources_result = await db.execute(resources_query)
    resources_by_type = {row.resource: row.count for row in resources_result.all()}
    
    # Top actors
    actors_query = select(
        AuditLog.actor_id,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.created_at >= start_date,
        AuditLog.actor_id.isnot(None)
    ).group_by(AuditLog.actor_id).order_by(desc('count')).limit(10)
    actors_result = await db.execute(actors_query)
    top_actors = [{"actor_id": row.actor_id, "count": row.count} for row in actors_result.all()]
    
    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "total_actions": total_actions,
        "actions_by_type": actions_by_type,
        "resources_by_type": resources_by_type,
        "top_actors": top_actors
    }
