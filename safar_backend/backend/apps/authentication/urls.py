from django.urls import path, re_path
from rest_framework.routers import DefaultRouter
from .views import (
    CustomProviderAuthView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    LogoutView,
    UserInteractionListView,
)


router = DefaultRouter()
router.register(r'interactions', UserInteractionListView, basename='interactions')

urlpatterns = [
    re_path(
        r'^o/(?P<provider>\S+)/$',
        CustomProviderAuthView.as_view(),
        name='provider-auth'
    ),
    path('auth/jwt/create/', CustomTokenObtainPairView.as_view()),
    path('auth/jwt/refresh/', CustomTokenRefreshView.as_view()),
    path('auth/jwt/verify/', CustomTokenVerifyView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
] + router.urls