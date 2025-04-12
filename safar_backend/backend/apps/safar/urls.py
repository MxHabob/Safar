from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.safar.views import (
    CategoryViewSet, DiscountViewSet, PlaceViewSet,
    ExperienceViewSet, FlightViewSet, BoxViewSet,
    BookingViewSet, WishlistViewSet, ReviewViewSet,
    PaymentViewSet, MessageViewSet, NotificationViewSet,
    BoxGenerationViewSet
)

router = DefaultRouter()

# Register all viewsets with the router
router.register(r'categories', CategoryViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'places', PlaceViewSet)
router.register(r'experiences', ExperienceViewSet)
router.register(r'flights', FlightViewSet)
router.register(r'boxes', BoxViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'wishlists', WishlistViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'generation', BoxGenerationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]