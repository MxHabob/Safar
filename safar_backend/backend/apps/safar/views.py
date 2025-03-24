from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.safar.models import (
    Category, Discount, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)
from apps.safar.serializers import (
    CategorySerializer,
    DiscountSerializer, PlaceSerializer, ExperienceSerializer, FlightSerializer,
    BoxSerializer, BookingSerializer, WishlistSerializer, ReviewSerializer,
    PaymentSerializer, MessageSerializer, NotificationSerializer
)

# Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Discount ViewSet
class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Place ViewSet
class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Experience ViewSet
class ExperienceViewSet(viewsets.ModelViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Flight ViewSet
class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Box ViewSet
class BoxViewSet(viewsets.ModelViewSet):
    queryset = Box.objects.all()
    serializer_class = BoxSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Booking ViewSet
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'Confirmed'
        booking.save()
        return Response({'status': 'Booking confirmed'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'Cancelled'
        booking.save()
        return Response({'status': 'Booking cancelled'})

# Wishlist ViewSet
class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Review ViewSet
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# Payment ViewSet
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        payment = self.get_object()
        payment.payment_status = 'Paid'
        payment.save()
        return Response({'status': 'Payment marked as paid'})

# Message ViewSet
class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'Message marked as read'})

# Notification ViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})