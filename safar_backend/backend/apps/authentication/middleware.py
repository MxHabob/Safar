from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from apps.authentication.models import User
from django.db import close_old_connections
import jwt
from channels.db import database_sync_to_async

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]
        
        # If not in query string, check cookies
        if not token and "headers" in scope:
            cookies = {}
            for name, value in scope.get("headers", []):
                if name == b"cookie":
                    cookie_string = value.decode()
                    cookies = {
                        c.split("=")[0]: c.split("=")[1]
                        for c in cookie_string.split("; ")
                    }
                    break
            token = cookies.get("access")
        
        user = AnonymousUser()
        if token:
            try:
                decoded_data = AccessToken(token)
                user = await self.get_user(decoded_data["user_id"])
            except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
                user = AnonymousUser()

        close_old_connections()
        scope["user"] = user
        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

# Wrap with AuthMiddlewareStack
def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
