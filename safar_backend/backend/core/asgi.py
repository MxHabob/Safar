import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Set a reasonable shutdown timeout (in seconds)
os.environ['DJANGO_ASGI_SHUTDOWN_TIMEOUT'] = '5'

django_asgi_app = get_asgi_application()

from apps.real_time.middleware import JWTAuthMiddlewareStack
from apps.real_time import urls

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(urls.websocket_urlpatterns)
        )
    ),
})