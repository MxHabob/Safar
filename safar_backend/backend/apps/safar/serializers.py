from rest_framework import serializers
from apps.safar.models import (
    BoxItineraryDay, BoxItineraryItem, Category, Discount, Media, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)
from apps.authentication.serializers import UserSerializer
from apps.geographic_data.serializers import CitySerializer, CountrySerializer, RegionSerializer

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'url','type', 'file', 'uploaded_by']
        read_only_fields = ['id']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ['id', 'code', 'discount_type', 'amount', 'valid_from', 'valid_to', 
                 'is_active', 'applicable_places', 'applicable_experiences', 
                 'applicable_flights', 'applicable_boxes', 'created_at']
        read_only_fields = ['id', 'created_at']

class ExperiencePlaceSerializer(serializers.ModelSerializer):
    """Enhanced Place serializer for Experience with location details"""
    country = CountrySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    city = CitySerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    media = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Place
        fields = [
            'id', 'name', 'description', 'location', 
            'country', 'city', 'region', 'rating', 
            'media', 'is_available', 'price', 'currency', 
            'metadata', 'category'
        ]
        read_only_fields = ['id']


class ExperienceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    place = ExperiencePlaceSerializer(read_only=True)
    is_in_wishlist = serializers.SerializerMethodField()

    class Meta:
        model = Experience
        fields = [
            'id', 'place', 'owner', 'category', 'title', 
            'description', 'location', 'price_per_person', 
            'currency', 'duration', 'capacity', 'schedule', 
            'country', 'city', 'region','metadata',
            'media', 'rating','is_in_wishlist', 'is_available'
        ]
        read_only_fields = ['id']

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, experience=obj).exists()
        return False
    
class PlaceSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    city = CitySerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    experiences = serializers.SerializerMethodField()
    media = MediaSerializer(many=True, read_only=True)
    is_in_wishlist = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            'id', 'category', 'owner', 'name', 'description', 'location', 
            'country', 'city', 'region', 'rating', 'media', 'is_available', 
            'price', 'currency', 'metadata','is_in_wishlist', 'experiences'
        ]
        read_only_fields = ['id']


    def get_experiences(self, obj):
        experiences = obj.experiences.all()
        return ExperienceSerializer(experiences, many=True, context=self.context).data

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, place=obj).exists()
        return False
    
class FlightSerializer(serializers.ModelSerializer):
    is_in_wishlist = serializers.SerializerMethodField()
    class Meta:
        model = Flight
        fields = ['id', 'airline', 'flight_number', 'departure_airport', 
                 'arrival_airport', 'arrival_city', 'departure_time', 
                 'arrival_time', 'price', 'currency', 'duration', 
                 'is_in_wishlist','baggage_policy']
        read_only_fields = ['id']

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, flight=obj).exists()
        return False
    
class BoxItineraryItemSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)
    experience = ExperienceSerializer(read_only=True)

    class Meta:
        model = BoxItineraryItem
        fields = [
            'id', 'itinerary_day', 'place', 'experience', 'start_time',
            'end_time', 'duration_minutes', 'order', 'notes', 'is_optional',
            'estimated_cost'
        ]
        read_only_fields = ['id']

class BoxItineraryDaySerializer(serializers.ModelSerializer):
    items = BoxItineraryItemSerializer(many=True, read_only=True)

    class Meta:
        model = BoxItineraryDay
        fields = [
            'id', 'box', 'day_number', 'date', 'description',
            'estimated_hours', 'items'
        ]
        read_only_fields = ['id']
        
class BoxSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    itinerary_days = BoxItineraryDaySerializer(many=True, read_only=True)
    is_in_wishlist = serializers.SerializerMethodField()

    class Meta:
        model = Box
        fields = [
            'id', 'category', 'name', 'description', 'total_price', 'currency',
            'country', 'city', 'media', 'duration_days', 'duration_hours',
            'start_date', 'end_date', 'is_customizable', 'max_group_size',
            'tags', 'is_in_wishlist', 'itinerary_days'
        ]
        read_only_fields = ['id']

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, box=obj).exists()
        return False
    
class BookingSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer(read_only=True)
    place = PlaceSerializer(read_only=True)
    flight = FlightSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'place', 'experience', 'flight', 'box', 
            'check_in', 'check_out', 'booking_date', 'status', 
            'total_price', 'currency', 'payment_status'
        ]
        read_only_fields = ['id', 'booking_date', 'user']

class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'place', 'experience', 'flight', 'box']
        read_only_fields = ['id']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'place', 'experience', 'flight', 
                 'rating', 'review_text']
        read_only_fields = ['id']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'user', 'booking', 'amount', 'currency', 
                 'payment_method', 'payment_status', 'transaction_id']
        read_only_fields = ['id']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'booking', 'message_text', 
                 'is_read']
        read_only_fields = ['id']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'message', 'is_read']
        read_only_fields = ['id']