"""
Notification routes for push notifications.
"""
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.users.device_service import DeviceService
from app.infrastructure.notifications.push import PushNotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/push/send", response_model=Dict[str, Any])
async def send_push_notification(
    device_token: Optional[str] = Body(None, description="Specific device token (optional)"),
    title: str = Body(..., description="Notification title"),
    body: str = Body(..., description="Notification body"),
    data: Optional[Dict[str, Any]] = Body(None, description="Notification data payload"),
    send_to_all_devices: bool = Body(False, description="Send to all user devices"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Send a push notification to user's device(s).
    """
    if send_to_all_devices:
        # Send to all user devices
        results = await DeviceService.send_notification_to_user_devices(
            db,
            user_id=current_user.id,
            title=title,
            body=body,
            data=data
        )
        return {
            "sent": sum(1 for success in results.values() if success),
            "total": len(results),
            "results": results,
            "message": "Notifications sent to user devices"
        }
    elif device_token:
        # Send to specific device
        success = await PushNotificationService.send_fcm_notification(
            device_token=device_token,
            title=title,
            body=body,
            data=data
        )
        return {
            "sent": 1 if success else 0,
            "total": 1,
            "success": success,
            "message": "Notification sent" if success else "Notification failed"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either device_token or send_to_all_devices must be provided"
        )


@router.post("/push/bulk", response_model=Dict[str, Any])
async def send_bulk_push_notifications(
    device_tokens: List[str] = Body(..., description="List of device tokens"),
    title: str = Body(..., description="Notification title"),
    body: str = Body(..., description="Notification body"),
    data: Optional[Dict[str, Any]] = Body(None, description="Notification data payload"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Send push notifications to multiple devices.
    Requires authentication.
    """
    results = await PushNotificationService.send_bulk_notifications(
        device_tokens=device_tokens,
        title=title,
        body=body,
        data=data
    )
    
    return {
        "sent": sum(1 for success in results.values() if success),
        "total": len(results),
        "results": results,
        "message": "Bulk notifications processed"
    }

