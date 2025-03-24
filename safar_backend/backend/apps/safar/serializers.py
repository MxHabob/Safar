from rest_framework import serializers
from apps.safar.models import (
    Category, Discount, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ['id', 'code', 'discount_type', 'amount', 'valid_from', 'valid_to', 'is_active', 'applicable_places', 'applicable_experiences', 'applicable_flights', 'applicable_boxes', 'created_at']
        read_only_fields = ['id', 'created_at']

class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id', 'category', 'owner', 'name', 'description', 'location', 'country', 'city', 'region', 'rating', 'images', 'is_available', 'price', 'currency', 'metadata']
        read_only_fields = ['id']

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'place', 'owner', 'title', 'description', 'location', 'price_per_person', 'currency', 'duration', 'capacity', 'schedule', 'images', 'rating', 'is_available']
        read_only_fields = ['id']

class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = ['id', 'airline', 'flight_number', 'departure_airport', 'arrival_airport', 'arrival_city', 'departure_time', 'arrival_time', 'price', 'currency', 'duration', 'baggage_policy']
        read_only_fields = ['id']

class BoxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Box
        fields = ['id', 'name', 'description', 'total_price', 'currency', 'country', 'city', 'place', 'experience', 'contents', 'images']
        read_only_fields = ['id']

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'user', 'place', 'experience', 'flight', 'box', 'check_in', 'check_out', 'booking_date', 'status', 'total_price', 'currency', 'payment_status']
        read_only_fields = ['id', 'booking_date']

class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'place', 'experience', 'flight', 'box']
        read_only_fields = ['id']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'user', 'place', 'experience', 'flight', 'rating', 'review_text']
        read_only_fields = ['id']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'user', 'booking', 'amount', 'currency', 'payment_method', 'payment_status', 'transaction_id']
        read_only_fields = ['id']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'booking', 'message_text', 'is_read']
        read_only_fields = ['id']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'message', 'is_read']
        read_only_fields = ['id']