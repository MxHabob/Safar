from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from apps.safar.models import (
    Category, Discount, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)
from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine
from apps.core_apps.algorithms_engines.generation_box_algorithm import BoxGenerator
from apps.core_apps.general import BaseViewSet
import logging
from apps.safar.serializers import (
    CategorySerializer,
    DiscountSerializer, PlaceSerializer, ExperienceSerializer, FlightSerializer,
    BoxSerializer, BookingSerializer, WishlistSerializer, ReviewSerializer,
    PaymentSerializer, MessageSerializer, NotificationSerializer
)

logger = logging.getLogger(__name__)


class CategoryViewSet(BaseViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

class DiscountViewSet(BaseViewSet):
    queryset = Discount.objects.all().prefetch_related(
        'applicable_places',
        'applicable_experiences',
        'applicable_flights',
        'applicable_boxes'
    )
    serializer_class = DiscountSerializer
    filterset_fields = ['discount_type', 'is_active']
    search_fields = ['code']
    ordering_fields = ['valid_from', 'valid_to', 'amount']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def my_discounts(self, request):
        """Get discounts available to the current user"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to view your discounts'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        now = timezone.now()
    
        targeted_discounts = Discount.objects.filter(
            target_users=request.user,
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        )
        
        general_discounts = Discount.objects.filter(
            Q(target_users__isnull=True) | ~Q(target_users__in=[request.user]),
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        )
    
        all_discounts = list(targeted_discounts) + list(general_discounts)
        serializer = self.get_serializer(all_discounts, many=True)
        
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a discount code for the current user"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to validate discount codes'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        code = request.data.get('code')
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')
        amount = request.data.get('amount')
        
        if not code:
            return Response(
                {'error': 'Discount code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            discount = Discount.objects.get(code=code, is_active=True)
            
            if not discount.is_valid():
                return Response(
                    {'valid': False, 'error': 'This discount code has expired or is no longer valid'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
            if not discount.is_applicable_to_user(request.user):
                return Response(
                    {'valid': False, 'error': 'This discount code is not applicable to your account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if entity_type and entity_id:
                entity = None
                if entity_type == 'place':
                    entity = Place.objects.get(id=entity_id)
                elif entity_type == 'experience':
                    entity = Experience.objects.get(id=entity_id)
                elif entity_type == 'flight':
                    entity = Flight.objects.get(id=entity_id)
                elif entity_type == 'box':
                    entity = Box.objects.get(id=entity_id)
                
                if entity and not discount.is_applicable_to_entity(entity):
                    return Response(
                        {'valid': False, 'error': f'This discount code is not applicable to this {entity_type}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if amount and discount.min_purchase_amount and float(amount) < float(discount.min_purchase_amount):
                return Response(
                    {
                        'valid': False, 
                        'error': f'This discount requires a minimum purchase of ${discount.min_purchase_amount}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            discount_amount = None
            discounted_price = None
            if amount:
                discount_amount = discount.calculate_discount_amount(float(amount))
                discounted_price = float(amount) - discount_amount
            
            return Response({
                'valid': True,
                'discount': {
                    'id': discount.id,
                    'code': discount.code,
                    'discount_type': discount.discount_type,
                    'amount': float(discount.amount),
                    'discount_amount': discount_amount,
                    'discounted_price': discounted_price,
                    'valid_until': discount.valid_to
                }
            })
            
        except Discount.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Invalid discount code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error validating discount code: {str(e)}", exc_info=True)
            return Response(
                {'valid': False, 'error': 'An error occurred while validating the discount code'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active discounts"""
        now = timezone.now()
        discounts = self.get_queryset().filter(
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        )
        serializer = self.get_serializer(discounts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply discount to a booking"""
        discount = self.get_object()
        booking_id = request.data.get('booking_id')

        return Response({'status': 'Discount applied'})

class PlaceViewSet(BaseViewSet):
    queryset = Place.objects.select_related(
        'category', 'country', 'city', 'region', 'owner'
    ).prefetch_related('media')
    serializer_class = PlaceSerializer
    filterset_fields = ['category', 'country', 'city', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['rating', 'price', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        return queryset

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        limit = int(request.query_params.get('limit', 5))
        
        user = request.user if request.user.is_authenticated else None
        recommendation_engine = RecommendationEngine(user)
        
        try:
            places = recommendation_engine.recommend_places(limit=limit)
            
            # Check if we got results
            if not places.exists():
                logger.warning("Recommendation engine returned empty results, using fallback")
                places = Place.objects.filter(
                    is_available=True, 
                    is_deleted=False
                ).order_by('-rating')[:limit]
                
                # If still empty, get any places
                if not places.exists():
                    places = Place.objects.all()[:limit]
                    
            serializer = self.get_serializer(places, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in place recommendations: {str(e)}", exc_info=True)
            # Ensure we return something
            places = Place.objects.all().order_by('-created_at')[:limit]
            serializer = self.get_serializer(places, many=True)
            return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """Get similar places"""
        place = self.get_object()
        similar_places = self.get_queryset().filter(
            category=place.category
        ).exclude(id=place.id)[:5]
        serializer = self.get_serializer(similar_places, many=True)
        return Response(serializer.data)

class ExperienceViewSet(BaseViewSet):
    queryset = Experience.objects.select_related(
        'place', 'owner'
    ).prefetch_related('media')
    serializer_class = ExperienceSerializer
    filterset_fields = ['place', 'is_available']
    search_fields = ['title', 'description']
    ordering_fields = ['rating', 'price_per_person', 'duration']

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        limit = int(request.query_params.get('limit', 5))
        
        filters = {
            'is_available': True
        }
        
        user = request.user if request.user.is_authenticated else None
        recommendation_engine = RecommendationEngine(user)
        
        try:
            experiences = recommendation_engine.recommend_experiences(limit=limit, filters=filters)
            serializer = self.get_serializer(experiences, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in experience recommendations: {str(e)}", exc_info=True)
            experiences = Experience.objects.filter(
                is_available=True, 
                is_deleted=False
            ).order_by('-rating')[:limit]
            serializer = self.get_serializer(experiences, many=True)
            return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check availability for specific dates"""
        experience = self.get_object()
        date = request.query_params.get('date')
        return Response({'available': True, 'capacity': experience.capacity})

class FlightViewSet(BaseViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    filterset_fields = ['airline', 'departure_airport', 'arrival_airport']
    search_fields = ['flight_number', 'arrival_city']
    ordering_fields = ['departure_time', 'arrival_time', 'price']
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search flights with filters"""
        departure = request.query_params.get('departure')
        arrival = request.query_params.get('arrival')
        date = request.query_params.get('date')
        
        queryset = self.get_queryset()
        if departure:
            queryset = queryset.filter(departure_airport=departure)
        if arrival:
            queryset = queryset.filter(arrival_airport=arrival)
        if date:
            queryset = queryset.filter(departure_time__date=date)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class BoxViewSet(BaseViewSet):
    queryset = Box.objects.select_related('country', 'city').prefetch_related('media')
    serializer_class = BoxSerializer
    filterset_fields = ['country', 'city']
    search_fields = ['name', 'description']
    ordering_fields = ['total_price', 'created_at']

    @action(detail=True, methods=['get'])
    def itinerary(self, request, pk=None):
        """Get detailed itinerary for a box"""
        box = self.get_object()
        return Response({'itinerary': 'Detailed itinerary would be here'})
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a custom box based on user preferences
        """
        try:
            user = request.user
            destination_id = request.data.get('destination_id')
            destination_type = request.data.get('destination_type')
            duration_days = int(request.data.get('duration_days', 3))
            budget = request.data.get('budget')
            theme = request.data.get('theme')
            start_date = request.data.get('start_date')
            
            destination = self._get_destination(destination_id, destination_type)
            
            generator = BoxGenerator(user)
            box = generator.generate_box(
                destination=destination,
                duration_days=duration_days,
                budget=budget,
                start_date=start_date,
                theme=theme
            )
            
            return Response(
                BoxSerializer(box).data,
                status=status.HTTP_201_CREATED
            )
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Box generation failed: {str(e)}")
            return Response(
                {'error': 'Could not generate box'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_destination(self, destination_id, destination_type):
        """Get destination model instance"""
        from apps.geographic_data.models import City, Region, Country
        
        model_map = {
            'city': City,
            'region': Region,
            'country': Country
        }
        
        if destination_type not in model_map:
            raise ValueError("Invalid destination type")
            
        model = model_map[destination_type]
        try:
            return model.objects.get(id=destination_id, is_deleted=False)
        except model.DoesNotExist:
            raise ValueError(f"{destination_type.capitalize()} not found")
        
class BookingViewSet(BaseViewSet):
    queryset = Booking.objects.select_related(
        'user', 'place', 'experience', 'flight', 'box'
    )
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['booking_date', 'check_in', 'check_out']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a booking"""
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to confirm this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.status = 'Confirmed'
        booking.save()
        return Response({'status': 'Booking confirmed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to cancel this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.status = 'Cancelled'
        booking.save()
        return Response({'status': 'Booking cancelled'})
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get user's upcoming bookings"""
        bookings = self.get_queryset().filter(
            user=request.user,
            check_out__gte=timezone.now(),
            status='Confirmed'
        ).order_by('check_in')
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

class WishlistViewSet(BaseViewSet):
    queryset = Wishlist.objects.select_related(
        'user', 'place', 'experience', 'flight', 'box'
    )
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's wishlist"""
        wishlist = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(wishlist, many=True)
        return Response(serializer.data)

class ReviewViewSet(BaseViewSet):
    queryset = Review.objects.select_related(
        'user', 'place', 'experience', 'flight'
    )
    serializer_class = ReviewSerializer
    filterset_fields = ['rating']
    ordering_fields = ['rating', 'created_at']
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews"""
        reviews = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class PaymentViewSet(BaseViewSet):
    queryset = Payment.objects.select_related('user', 'booking')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['payment_status']
    ordering_fields = ['created_at', 'amount']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """Mark payment as paid (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin can mark payments as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment = self.get_object()
        payment.payment_status = 'Paid'
        payment.save()
        return Response({'status': 'Payment marked as paid'})

class MessageViewSet(BaseViewSet):
    queryset = Message.objects.select_related('sender', 'receiver', 'booking')
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
            )
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark message as read"""
        message = self.get_object()
        if message.receiver != request.user:
            return Response(
                {'error': 'You can only mark your own messages as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.is_read = True
        message.save()
        return Response({'status': 'Message marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread messages for current user"""
        messages = self.get_queryset().filter(
            receiver=request.user,
            is_read=False
        )
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

class NotificationViewSet(BaseViewSet):
    queryset = Notification.objects.select_related('user')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        if notification.user != request.user:
            return Response(
                {'error': 'You can only mark your own notifications as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications for current user"""
        notifications = self.get_queryset().filter(
            user=request.user,
            is_read=False
        )
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated = self.get_queryset().filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'status': f'{updated} notifications marked as read'})