"""
Push notification service for FCM (Android) and APNS (iOS).
"""
import httpx
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()


class PushNotificationService:
    """Service for sending push notifications via FCM and APNS."""
    
    # FCM endpoint
    FCM_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    
    @staticmethod
    async def send_fcm_notification(
        device_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        project_id: Optional[str] = None
    ) -> bool:
        """
        Send push notification via Firebase Cloud Messaging (FCM).
        
        Args:
            device_token: FCM device token
            title: Notification title
            body: Notification body
            data: Optional data payload
            project_id: FCM project ID (from settings if not provided)
        
        Returns:
            bool: True if successful
        """
        if not settings.fcm_server_key and not settings.fcm_project_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="FCM is not configured"
            )
        
        project_id = project_id or settings.fcm_project_id
        
        # Get FCM access token (OAuth2)
        access_token = await PushNotificationService._get_fcm_access_token()
        
        url = PushNotificationService.FCM_URL.format(project_id=project_id)
        
        message = {
            "message": {
                "token": device_token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "data": {str(k): str(v) for k, v in (data or {}).items()},
                "android": {
                    "priority": "high"
                },
                "apns": {
                    "headers": {
                        "apns-priority": "10"
                    },
                    "payload": {
                        "aps": {
                            "alert": {
                                "title": title,
                                "body": body
                            },
                            "sound": "default"
                        }
                    }
                }
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=message,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return True
    
    @staticmethod
    async def _get_fcm_access_token() -> str:
        """Get FCM OAuth2 access token."""
        if not settings.fcm_service_account_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="FCM service account key not configured"
            )
        
        # For FCM v1, we need to use service account credentials
        # This is a simplified version - in production, use google-auth library
        import json
        from datetime import datetime, timedelta
        import jwt
        
        try:
            service_account = json.loads(settings.fcm_service_account_key)
            
            # Create JWT for OAuth2
            now = datetime.utcnow()
            claims = {
                "iss": service_account["client_email"],
                "sub": service_account["client_email"],
                "aud": "https://oauth2.googleapis.com/token",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(hours=1)).timestamp()),
                "scope": "https://www.googleapis.com/auth/firebase.messaging"
            }
            
            # Sign JWT (simplified - use proper library in production)
            # For now, use httpx to get token
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                        "assertion": jwt.encode(claims, service_account["private_key"], algorithm="RS256")
                    }
                )
                response.raise_for_status()
                return response.json()["access_token"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get FCM access token: {str(e)}"
            )
    
    @staticmethod
    async def send_bulk_notifications(
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, bool]:
        """
        Send push notifications to multiple devices.
        
        Returns:
            dict mapping device_token to success status
        """
        results = {}
        for token in device_tokens:
            try:
                success = await PushNotificationService.send_fcm_notification(
                    device_token=token,
                    title=title,
                    body=body,
                    data=data
                )
                results[token] = success
            except Exception:
                results[token] = False
        return results

