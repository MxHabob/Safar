from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from apps.authentication.models import User
from django.db import close_old_connections
import jwt
from channels.db import database_sync_to_async
import logging
from django.conf import settings
import asyncio

logger = logging.getLogger(__name__)

class JWTAuthMiddleware:
    """
    Custom JWT authentication middleware for Django Channels with improved performance
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Close old connections to prevent connection leaks
        await database_sync_to_async(close_old_connections)()
        
        scope["user"] = AnonymousUser()
        
        token = self._extract_token(scope)
        
        if token:
            try:
                # Use a timeout for token validation to prevent hanging
                user_id = await asyncio.wait_for(
                    database_sync_to_async(self._get_user_id_from_token)(token),
                    timeout=1.0
                )
                
                if user_id:
                    # Use a timeout for user retrieval
                    user = await asyncio.wait_for(
                        self.get_user(user_id),
                        timeout=1.0
                    )
                    if user:
                        scope["user"] = user
                        logger.debug(f"Authenticated WebSocket connection for user {user_id}")
            except asyncio.TimeoutError:
                logger.error("Timeout authenticating WebSocket connection")
            except Exception as e:
                logger.error(f"Error authenticating WebSocket connection: {str(e)}")
        
        return await self.inner(scope, receive, send)
    
    def _extract_token(self, scope):
        """Extract JWT token from query string or cookies"""
        query_string = scope.get("query_string", b"").decode()
        if query_string:
            query_params = parse_qs(query_string)
            if "token" in query_params:
                return query_params["token"][0]
        
        if "headers" in scope:
            cookies = {}
            for name, value in scope.get("headers", []):
                if name == b"cookie":
                    cookie_string = value.decode()
                    cookies = {
                        c.split("=")[0]: c.split("=")[1]
                        for c in cookie_string.split("; ")
                        if "=" in c
                    }
                    return cookies.get("access") or cookies.get("token")
        
        return None
    
    def _get_user_id_from_token(self, token):
        """Validate JWT token and extract user ID"""
        try:
            try:
                access_token = AccessToken(token)
                return access_token["user_id"]
            except Exception:
                decoded_token = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=["HS256"],
                    options={"verify_signature": True}
                )
                return decoded_token.get("user_id") or decoded_token.get("sub")
        except jwt.ExpiredSignatureError:
            logger.warning("Expired JWT token")
        except jwt.InvalidTokenError:
            logger.warning("Invalid JWT token")
        except Exception as e:
            logger.error(f"Error decoding JWT token: {str(e)}")
        
        return None

    @database_sync_to_async
    def get_user(self, user_id):
        """Get user from database asynchronously"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error retrieving user {user_id}: {str(e)}")
            return None

def JWTAuthMiddlewareStack(inner):
    """Convenience function to wrap with JWT auth and standard auth"""
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))