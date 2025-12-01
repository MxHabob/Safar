"""
Device management routes.
"""
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User, UserDevice
from app.modules.users.device_service import DeviceService
from app.core.id import ID

router = APIRouter(prefix="/users/devices", tags=["Devices"])


@router.post("/register", response_model=Dict[str, Any])
async def register_device(
    platform: str = Body(..., description="Device platform: ios, android, web, desktop"),
    fingerprint: str = Body(..., description="Device fingerprint/hash"),
    push_token: str = Body(None, description="Push notification token"),
    device_metadata: Dict[str, Any] = Body(None, description="Device metadata"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register or update a device for the current user.
    """
    if platform not in ["ios", "android", "web", "desktop"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid platform. Must be: ios, android, web, or desktop"
        )
    
    device = await DeviceService.register_device(
        db,
        user_id=current_user.id,
        platform=platform,
        fingerprint=fingerprint,
        push_token=push_token,
        device_metadata=device_metadata
    )
    
    return {
        "id": device.id,
        "platform": device.platform,
        "fingerprint": device.fingerprint,
        "is_trusted": device.is_trusted,
        "last_seen_at": device.last_seen_at.isoformat(),
        "message": "Device registered successfully"
    }


@router.get("", response_model=List[Dict[str, Any]])
async def list_devices(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get all devices for the current user.
    """
    devices = await DeviceService.get_user_devices(db, user_id=current_user.id)
    
    return [
        {
            "id": device.id,
            "platform": device.platform,
            "fingerprint": device.fingerprint,
            "is_trusted": device.is_trusted,
            "last_seen_at": device.last_seen_at.isoformat(),
            "device_metadata": device.device_metadata or {}
        }
        for device in devices
    ]


@router.delete("/{device_id}")
async def remove_device(
    device_id: ID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Remove a device from the user's account.
    """
    await DeviceService.remove_device(db, user_id=current_user.id, device_id=device_id)
    return {"message": "Device removed successfully"}


@router.patch("/{device_id}/trust", response_model=Dict[str, Any])
async def mark_device_trusted(
    device_id: ID,
    trusted: bool = Body(True, description="Mark device as trusted"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Mark a device as trusted or untrusted.
    """
    device = await DeviceService.mark_device_trusted(
        db, user_id=current_user.id, device_id=device_id, trusted=trusted
    )
    
    return {
        "id": device.id,
        "is_trusted": device.is_trusted,
        "message": f"Device marked as {'trusted' if trusted else 'untrusted'}"
    }

