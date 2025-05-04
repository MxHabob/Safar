from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.http import HttpResponse
from apps.core_apps.views import health_check

schema_view = get_schema_view(
    openapi.Info(
        title="API",
        default_version='v1',
        description="API documentation",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@yourapi.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

rest_api_urlpatterns = [
    path('api/auth/', include('djoser.urls')),
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.safar.urls')),
    path('api/', include('apps.geographic_data.urls')),
    path('api/', include('apps.marketing.urls')),
    path('api/languages/', include('apps.languages.urls')),
    path('health/', health_check, name='health_check'),
]

urlpatterns = [
    path('', lambda request: HttpResponse('Safar API!')),
    path('admin/', admin.site.urls),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + rest_api_urlpatterns + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
