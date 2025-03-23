from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from apps.authentication.models import User
from django.db import close_old_connections
import jwt
from channels.db import database_sync_to_async

class JWTAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections using JWT.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        user = AnonymousUser()

        if token:
            try:
                decoded_data = AccessToken(token)
                user = await self.get_user(decoded_data["user_id"])
            except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
                user = AnonymousUser()

        close_old_connections()
        scope["user"] = user

        await self.inner(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

# Wrap with AuthMiddlewareStack
def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
