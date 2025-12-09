"""
Session Validation Middleware
Validates sessions on authenticated requests and updates session activity.
"""
from typing import Callable
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

from app.core.security import decode_token
from app.modules.users.session_service import SessionService

logger = logging.getLogger(__name__)


class SessionValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate sessions on authenticated requests.
    Updates session activity automatically.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip session validation for public routes
        if self._is_public_route(request.url.path):
            return await call_next(request)
        
        # Check if request has authorization header
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return await call_next(request)
        
        # Extract token
        token = auth_header.replace("Bearer ", "").strip()
        
        # Try to decode token and validate session
        try:
            payload = decode_token(token, token_type="access")
            session_id = payload.get("session_id")
            
            # If session_id exists, validate it
            if session_id:
                # Import here to avoid circular dependencies
                from app.core.database import AsyncSessionLocal
                
                # Create a database session for validation
                async with AsyncSessionLocal() as db:
                    session = await SessionService.validate_session(db, session_id)
                    if not session:
                        # Session is invalid - return 401
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session has been revoked or expired"
                        )
                    
                    # Update session activity
                    await SessionService.update_session_activity(db, session_id)
                    await db.commit()
        except HTTPException:
            # Re-raise HTTP exceptions (like invalid token)
            raise
        except Exception as e:
            # For other errors, log but don't block the request
            # The dependency will handle authentication validation
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(f"Session validation error (non-blocking): {str(e)}")
        
        return await call_next(request)
    
    @staticmethod
    def _is_public_route(path: str) -> bool:
        """Check if route is public (doesn't require session validation)."""
        public_paths = [
            "/health",
            "/health/live",
            "/health/ready",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/api/v1/users/register",
            "/api/v1/users/login",
            "/api/v1/users/refresh",
            "/api/v1/users/password/reset/request",
            "/api/v1/users/password/reset",
            "/api/v1/users/oauth/login",
            "/api/v1/users/otp/request",
            "/api/v1/users/otp/verify",
            "/api/v1/users/login/2fa/verify",
        ]
        return any(path.startswith(public_path) for public_path in public_paths)

