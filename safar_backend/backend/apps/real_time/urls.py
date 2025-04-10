from django.urls import re_path
from apps.real_time.consumers import SafariConsumer

websocket_urlpatterns = [
    re_path(r'^safar/$', SafariConsumer.as_asgi()),
]