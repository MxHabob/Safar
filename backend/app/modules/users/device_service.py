"""
Device and session management service.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.modules.users.models import UserDevice, User
from app.core.id import ID
from app.infrastructure.notifications.push import PushNotificationService


class DeviceService:
    """Service for managing user devices and sessions."""
    
    @staticmethod
    async def register_device(
        db: AsyncSession,
        user_id: ID,
        platform: str,
        fingerprint: str,
        device_metadata: Optional[Dict[str, Any]] = None,
        push_token: Optional[str] = None
    ) -> UserDevice:
        """
        Register or update a user device.
        
        Args:
            user_id: User ID
            platform: Device platform (ios, android, web, desktop)
            fingerprint: Device fingerprint/hash
            device_metadata: Optional device metadata
            push_token: Optional push notification token
        
        Returns:
            UserDevice model
        """
        # Check if device already exists
        result = await db.execute(
            select(UserDevice).where(
                and_(
                    UserDevice.user_id == user_id,
                    UserDevice.fingerprint == fingerprint
                )
            )
        )
        device = result.scalar_one_or_none()
        
        if device:
            # Update existing device
            device.last_seen_at = datetime.now(timezone.utc)
            device.platform = platform
            if device_metadata:
                device.device_metadata = {**(device.device_metadata or {}), **device_metadata}
            if push_token:
                device.device_metadata = device.device_metadata or {}
                device.device_metadata["push_token"] = push_token
        else:
            # Create new device
            metadata = device_metadata or {}
            if push_token:
                metadata["push_token"] = push_token
            
            device = UserDevice(
                user_id=user_id,
                platform=platform,
                fingerprint=fingerprint,
                last_seen_at=datetime.now(timezone.utc),
                device_metadata=metadata
            )
            db.add(device)
        
        await db.commit()
        await db.refresh(device)
        return device
    
    @staticmethod
    async def get_user_devices(
        db: AsyncSession,
        user_id: ID
    ) -> List[UserDevice]:
        """Get all devices for a user."""
        result = await db.execute(
            select(UserDevice).where(UserDevice.user_id == user_id)
            .order_by(UserDevice.last_seen_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def remove_device(
        db: AsyncSession,
        user_id: ID,
        device_id: ID
    ) -> bool:
        """Remove a device from user's account."""
        result = await db.execute(
            select(UserDevice).where(
                and_(
                    UserDevice.id == device_id,
                    UserDevice.user_id == user_id
                )
            )
        )
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        await db.delete(device)
        await db.commit()
        return True
    
    @staticmethod
    async def mark_device_trusted(
        db: AsyncSession,
        user_id: ID,
        device_id: ID,
        trusted: bool = True
    ) -> UserDevice:
        """Mark a device as trusted or untrusted."""
        result = await db.execute(
            select(UserDevice).where(
                and_(
                    UserDevice.id == device_id,
                    UserDevice.user_id == user_id
                )
            )
        )
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        device.is_trusted = trusted
        await db.commit()
        await db.refresh(device)
        return device
    
    @staticmethod
    async def send_notification_to_user_devices(
        db: AsyncSession,
        user_id: ID,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, bool]:
        """
        Send push notification to all user's devices.
        
        Returns:
            dict mapping device_id to success status
        """
        devices = await DeviceService.get_user_devices(db, user_id)
        results = {}
        
        for device in devices:
            push_token = device.device_metadata.get("push_token") if device.device_metadata else None
            if not push_token:
                results[str(device.id)] = False
                continue
            
            try:
                success = await PushNotificationService.send_fcm_notification(
                    device_token=push_token,
                    title=title,
                    body=body,
                    data=data
                )
                results[str(device.id)] = success
            except Exception:
                results[str(device.id)] = False
        
        return results

