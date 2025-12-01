"""
Audit Logging Middleware
Automatically logs all critical operations for compliance and security.
"""
import logging
from typing import Callable, Optional
from functools import wraps
from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.analytics.service import AnalyticsService
from app.modules.analytics.models import AuditLog
from app.core.id import ID

logger = logging.getLogger(__name__)


def audit_log(
    action: str,
    resource_type: str,
    get_resource_id: Optional[Callable] = None
):
    """
    Decorator to automatically log audit events for route handlers.
    
    Usage:
        @router.post("/bookings")
        @audit_log(action="create", resource_type="booking", get_resource_id=lambda r: r.json()["id"])
        async def create_booking(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user and db from dependencies
            current_user = None
            db: Optional[AsyncSession] = None
            
            for arg in args:
                if hasattr(arg, 'id') and hasattr(arg, 'email'):  # User object
                    current_user = arg
                elif isinstance(arg, AsyncSession):  # DB session
                    db = arg
            
            for key, value in kwargs.items():
                if hasattr(value, 'id') and hasattr(value, 'email'):  # User object
                    current_user = value
                elif isinstance(value, AsyncSession):  # DB session
                    db = value
            
            # Execute the function
            result = await func(*args, **kwargs)
            
            # Log audit event
            if db:
                try:
                    resource_id = None
                    if get_resource_id:
                        resource_id = get_resource_id(result)
                    elif hasattr(result, 'id'):
                        resource_id = str(result.id)
                    elif isinstance(result, dict) and 'id' in result:
                        resource_id = str(result['id'])
                    
                    await AnalyticsService.log_audit_event(
                        db=db,
                        user_id=str(current_user.id) if current_user else None,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        details={
                            "endpoint": func.__name__,
                            "module": func.__module__
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to log audit event: {e}", exc_info=True)
            
            return result
        return wrapper
    return decorator


async def log_audit_event_middleware(
    request: Request,
    call_next
):
    """
    Middleware to log all requests for audit purposes.
    Logs critical operations automatically.
    """
    # Get current user if authenticated
    current_user = None
    try:
        from app.core.dependencies import get_current_user
        # Try to get user, but don't fail if not authenticated
        try:
            current_user = await get_current_user(request)
        except Exception:
            pass
    except Exception:
        pass
    
    # Execute request
    response = await call_next(request)
    
    # Log critical operations
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        # Determine resource type from path
        path_parts = request.url.path.split("/")
        resource_type = path_parts[-2] if len(path_parts) > 2 else "unknown"
        
        # Map HTTP methods to actions
        action_map = {
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete"
        }
        action = action_map.get(request.method, "unknown")
        
        # Log to audit system (async, don't block request)
        try:
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                await AnalyticsService.log_audit_event(
                    db=db,
                    user_id=str(current_user.id) if current_user else None,
                    action=action,
                    resource_type=resource_type,
                    resource_id=None,  # Would need to extract from response
                    details={
                        "method": request.method,
                        "path": request.url.path,
                        "ip": request.client.host if request.client else None,
                        "user_agent": request.headers.get("user-agent"),
                        "status_code": response.status_code
                    }
                )
        except Exception as e:
            logger.error(f"Failed to log audit event in middleware: {e}", exc_info=True)
    
    return response

