from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.marketing.views import CampaignViewSet, CampaignTemplateViewSet

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet)
router.register(r'templates', CampaignTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]