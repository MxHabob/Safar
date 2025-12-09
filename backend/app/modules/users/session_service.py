"""
Session Management Service
Handles user session creation, tracking, and management.
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status, Request

from app.modules.users.models import UserSession, SessionStatus, User
from app.core.config import get_settings

settings = get_settings()


class SessionService:
    """Service for managing user sessions."""
    
    @staticmethod
    def generate_session_id() -> str:
        """Generate a secure session ID."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def extract_device_info(user_agent: Optional[str]) -> Dict[str, Any]:
        """
        Extract device information from User-Agent header.
        
        Args:
            user_agent: User-Agent string from request
            
        Returns:
            Dictionary with device information
        """
        if not user_agent:
            return {}
        
        device_info = {
            "user_agent": user_agent,
        }
        
        # Simple device detection (can be enhanced with user-agents library)
        user_agent_lower = user_agent.lower()
        
        # Browser detection
        if "chrome" in user_agent_lower and "edg" not in user_agent_lower:
            device_info["browser"] = "Chrome"
        elif "firefox" in user_agent_lower:
            device_info["browser"] = "Firefox"
        elif "safari" in user_agent_lower and "chrome" not in user_agent_lower:
            device_info["browser"] = "Safari"
        elif "edg" in user_agent_lower:
            device_info["browser"] = "Edge"
        else:
            device_info["browser"] = "Unknown"
        
        # OS detection
        if "windows" in user_agent_lower:
            device_info["os"] = "Windows"
        elif "mac" in user_agent_lower or "darwin" in user_agent_lower:
            device_info["os"] = "macOS"
        elif "linux" in user_agent_lower:
            device_info["os"] = "Linux"
        elif "android" in user_agent_lower:
            device_info["os"] = "Android"
        elif "ios" in user_agent_lower or "iphone" in user_agent_lower or "ipad" in user_agent_lower:
            device_info["os"] = "iOS"
        else:
            device_info["os"] = "Unknown"
        
        # Device type
        if "mobile" in user_agent_lower or "android" in user_agent_lower or "iphone" in user_agent_lower:
            device_info["device_type"] = "mobile"
        elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
            device_info["device_type"] = "tablet"
        else:
            device_info["device_type"] = "desktop"
        
        return device_info
    
    @staticmethod
    def get_client_ip(request: Request) -> Optional[str]:
        """
        Get client IP address from request.
        
        Args:
            request: FastAPI Request object
            
        Returns:
            IP address string or None
        """
        # Check for forwarded IP (from proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP (original client)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        if request.client:
            return request.client.host
        
        return None
    
    @staticmethod
    async def create_session(
        db: AsyncSession,
        user_id: str,
        request: Request,
        remember_me: bool = False,
        mfa_verified: bool = False
    ) -> UserSession:
        """
        Create a new user session.
        
        Args:
            db: Database session
            user_id: User ID
            request: FastAPI Request object
            remember_me: Whether this is a "remember me" session
            mfa_verified: Whether MFA was verified for this session
            
        Returns:
            Created UserSession object
        """
        session_id = SessionService.generate_session_id()
        user_agent = request.headers.get("User-Agent")
        ip_address = SessionService.get_client_ip(request)
        device_info = SessionService.extract_device_info(user_agent)
        
        # Determine session expiration
        if remember_me:
            expires_at = datetime.utcnow() + timedelta(days=30)
        else:
            expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Check if HTTPS
        is_secure = request.url.scheme == "https" or request.headers.get("X-Forwarded-Proto") == "https"
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            device_info=device_info,
            user_agent=user_agent,
            ip_address=ip_address,
            is_secure=is_secure,
            is_remember_me=remember_me,
            mfa_verified=mfa_verified,
            status=SessionStatus.ACTIVE,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            expires_at=expires_at,
        )
        
        db.add(session)
        await db.flush()
        
        return session
    
    @staticmethod
    async def get_session(
        db: AsyncSession,
        session_id: str
    ) -> Optional[UserSession]:
        """
        Get a session by ID.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            UserSession object or None
        """
        result = await db.execute(
            select(UserSession).where(UserSession.session_id == session_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_active_sessions(
        db: AsyncSession,
        user_id: str
    ) -> List[UserSession]:
        """
        Get all active sessions for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of active UserSession objects
        """
        result = await db.execute(
            select(UserSession).where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.status == SessionStatus.ACTIVE,
                    UserSession.expires_at > datetime.utcnow()
                )
            ).order_by(UserSession.last_activity.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update_session_activity(
        db: AsyncSession,
        session_id: str
    ) -> bool:
        """
        Update last activity timestamp for a session.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            True if session was updated, False otherwise
        """
        session = await SessionService.get_session(db, session_id)
        if not session or session.status != SessionStatus.ACTIVE:
            return False
        
        session.last_activity = datetime.utcnow()
        await db.flush()
        return True
    
    @staticmethod
    async def revoke_session(
        db: AsyncSession,
        session_id: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Revoke a session.
        
        Args:
            db: Database session
            session_id: Session ID
            user_id: Optional user ID for verification
            
        Returns:
            True if session was revoked, False otherwise
        """
        session = await SessionService.get_session(db, session_id)
        if not session:
            return False
        
        if user_id and session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot revoke session belonging to another user"
            )
        
        session.status = SessionStatus.REVOKED
        session.revoked_at = datetime.utcnow()
        await db.flush()
        return True
    
    @staticmethod
    async def revoke_all_sessions(
        db: AsyncSession,
        user_id: str,
        exclude_session_id: Optional[str] = None
    ) -> int:
        """
        Revoke all sessions for a user (except optionally one).
        
        Args:
            db: Database session
            user_id: User ID
            exclude_session_id: Optional session ID to exclude from revocation
            
        Returns:
            Number of sessions revoked
        """
        query = select(UserSession).where(
            and_(
                UserSession.user_id == user_id,
                UserSession.status == SessionStatus.ACTIVE
            )
        )
        
        if exclude_session_id:
            query = query.where(UserSession.session_id != exclude_session_id)
        
        result = await db.execute(query)
        sessions = list(result.scalars().all())
        
        count = 0
        for session in sessions:
            session.status = SessionStatus.REVOKED
            session.revoked_at = datetime.utcnow()
            count += 1
        
        await db.flush()
        return count
    
    @staticmethod
    async def cleanup_expired_sessions(db: AsyncSession) -> int:
        """
        Mark expired sessions as expired.
        
        Args:
            db: Database session
            
        Returns:
            Number of sessions expired
        """
        result = await db.execute(
            select(UserSession).where(
                and_(
                    UserSession.status == SessionStatus.ACTIVE,
                    UserSession.expires_at <= datetime.utcnow()
                )
            )
        )
        sessions = list(result.scalars().all())
        
        count = 0
        for session in sessions:
            session.status = SessionStatus.EXPIRED
            count += 1
        
        await db.flush()
        return count
    
    @staticmethod
    async def validate_session(
        db: AsyncSession,
        session_id: str
    ) -> Optional[UserSession]:
        """
        Validate a session (check if active and not expired).
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            UserSession if valid, None otherwise
        """
        session = await SessionService.get_session(db, session_id)
        
        if not session:
            return None
        
        if session.status != SessionStatus.ACTIVE:
            return None
        
        if session.expires_at <= datetime.utcnow():
            session.status = SessionStatus.EXPIRED
            await db.flush()
            return None
        
        return session

