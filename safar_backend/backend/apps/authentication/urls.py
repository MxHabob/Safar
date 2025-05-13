from django.urls import path, re_path
from rest_framework.routers import DefaultRouter
from apps.authentication.auth_views import (
    CustomProviderAuthView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    LogoutView,
)
from apps.authentication.views import UserInteractionListView, UserViewSet,PointsTransactionViewSet

router = DefaultRouter()
router.register(r'interactions', UserInteractionListView, basename='interactions')
router.register(r'users', UserViewSet, basename='users')
router.register(r'points', PointsTransactionViewSet, basename='users')

urlpatterns = [
    re_path(
        r'^auth/o/(?P<provider>\S+)/$',
        CustomProviderAuthView.as_view(),
        name='provider-auth'
    ),
    path('auth/jwt/create/', CustomTokenObtainPairView.as_view()),
    path('auth/jwt/refresh/', CustomTokenRefreshView.as_view()),
    path('auth/jwt/verify/', CustomTokenVerifyView.as_view()),
    path('logout/', LogoutView.as_view()),
] + router.urls