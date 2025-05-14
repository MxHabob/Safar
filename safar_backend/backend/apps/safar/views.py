from rest_framework import generics,permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from apps.safar.models import (
    Category, Discount, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)
from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine
from apps.core_apps.algorithms_engines.generation_box_algorithm import BoxGenerator
from apps.core_apps.general import BaseViewSet
from apps.safar.serializers import (
    CategorySerializer,
    DiscountSerializer, PlaceSerializer, ExperienceSerializer, FlightSerializer,
    BoxSerializer, BookingSerializer, WishlistSerializer, ReviewSerializer,
    PaymentSerializer, MessageSerializer, NotificationSerializer
)

from apps.authentication.models import User
from apps.geographic_data.models import Country, Region, City
from apps.geographic_data.serializers import CountrySerializer, RegionSerializer, CitySerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_api_key.permissions import HasAPIKey


import logging
logger = logging.getLogger(__name__)

class RecommendationViewSet(viewsets.ViewSet):
    """
    ViewSet for all recommendation-related endpoints.
    Provides personalized recommendations based on user preferences,
    location, context, and other factors.
    """
    
    def get_permissions(self):
        """
        Anonymous users can access basic recommendations,
        but personalized recommendations require authentication.
        """
        if self.action in ['trending', 'seasonal', 'popular']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def _get_request_context(self, request):
        """
        Extract context information from the request
        """
        context = {
            'ip': request.META.get('REMOTE_ADDR'),
            'device_type': self._detect_device_type(request),
            'referrer': request.META.get('HTTP_REFERER'),
            'timestamp': timezone.now()
        }
        
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if lat and lng:
            try:
                context['location'] = Point(float(lng), float(lat), srid=4326)
            except (ValueError, TypeError):
                pass
        
        return context
    
    def _detect_device_type(self, request):
        """
        Detect device type from user agent
        """
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            return 'tablet'
        else:
            return 'desktop'
    
    def _get_recommendation_engine(self, request):
        """
        Initialize recommendation engine with user and request context
        """
        user = request.user if request.user.is_authenticated else None
        context = self._get_request_context(request)
        
        return RecommendationEngine(user, context)
    
    def _parse_common_params(self, request):
        """
        Parse common query parameters used across recommendation endpoints
        """
        return {
            'limit': int(request.query_params.get('limit', 10)),
            'offset': int(request.query_params.get('offset', 0)),
            'category': request.query_params.get('category'),
            'country': request.query_params.get('country'),
            'city': request.query_params.get('city'),
            'region': request.query_params.get('region'),
            'min_price': request.query_params.get('min_price'),
            'max_price': request.query_params.get('max_price'),
            'min_rating': request.query_params.get('min_rating'),
            'location_aware': request.query_params.get('location_aware', 'true').lower() == 'true'
        }
    
    def _build_filters(self, params):
        """
        Build filters dictionary from parameters
        """
        filters = {}
        if params.get('category'):
            filters['category__name'] = params['category']
        
        # Location filters
        for location_type in ['country', 'city', 'region']:
            if params.get(location_type):
                filters[location_type] = params[location_type]
        
        # Price filters
        if params.get('min_price'):
            filters['price__gte'] = float(params['min_price'])
        if params.get('max_price'):
            filters['price__lte'] = float(params['max_price'])
        
        # Rating filter
        if params.get('min_rating'):
            filters['rating__gte'] = float(params['min_rating'])
        
        return filters
    
    @action(detail=False, methods=['get'])
    def personalized(self, request):
        """
        Get personalized recommendations based on user preferences and behavior.
        
        Query Parameters:
        - type: Type of items to recommend (places, experiences, both). Default: both
        - limit: Maximum number of items to return per type. Default: 10
        - category: Filter by category name
        - country, city, region: Filter by location
        - min_price, max_price: Filter by price range
        - min_rating: Filter by minimum rating
        - location_aware: Whether to consider user's location (true/false). Default: true
        - diversity_factor: How much to diversify results (0-1). Default: 0.2
        """
        try:
            params = self._parse_common_params(request)
            item_type = request.query_params.get('type', 'both')
            diversity_factor = float(request.query_params.get('diversity_factor', 0.2))

            engine = self._get_recommendation_engine(request)

            filters = self._build_filters(params)
            
            response_data = {}
            
            if item_type in ['places', 'both']:
                places = engine.recommend_places(
                    limit=params['limit'],
                    filters=filters,
                    location_aware=params['location_aware'],
                    diversity_factor=diversity_factor
                )
                response_data['places'] = PlaceSerializer(places, many=True).data
            
            if item_type in ['experiences', 'both']:
                experiences = engine.recommend_experiences(
                    limit=params['limit'],
                    filters=filters,
                    location_aware=params['location_aware']
                )
                response_data['experiences'] = ExperienceSerializer(experiences, many=True).data
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in personalized recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """
        Get recommendations near a specific location.
        
        Query Parameters:
        - lat: Latitude (required if no user location)
        - lng: Longitude (required if no user location)
        - radius: Search radius in kilometers. Default: 10
        - type: Type of items to recommend (places, experiences, both). Default: both
        - limit: Maximum number of items to return per type. Default: 10
        - category: Filter by category name
        - min_price, max_price: Filter by price range
        - min_rating: Filter by minimum rating
        """
        try:
            params = self._parse_common_params(request)
            item_type = request.query_params.get('type', 'both')
            radius = float(request.query_params.get('radius', 10))
            
            # Get location from query parameters
            lat = request.query_params.get('lat')
            lng = request.query_params.get('lng')
            
            # Initialize recommendation engine
            engine = self._get_recommendation_engine(request)
            
            # If location not provided in query, try to use user's location
            location = None
            if lat and lng:
                try:
                    location = Point(float(lng), float(lat), srid=4326)
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Invalid latitude or longitude'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif engine.user_location:
                location = engine.user_location
            else:
                return Response(
                    {'error': 'Location is required. Provide lat and lng parameters.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            response_data = {}
            
            # Get nearby places if requested
            if item_type in ['places', 'both']:
                # Create location filter
                place_filters = self._build_filters(params)
                
                # Query places within radius
                places = Place.objects.filter(
                    location__distance_lte=(location, D(km=radius)),
                    is_available=True,
                    is_deleted=False,
                    **place_filters
                ).distance(location).order_by('distance')[:params['limit']]
                
                response_data['places'] = PlaceSerializer(places, many=True).data
            
            # Get nearby experiences if requested
            if item_type in ['experiences', 'both']:
                # Create location filter
                exp_filters = self._build_filters(params)
                
                # Query experiences within radius
                experiences = Experience.objects.filter(
                    place__location__distance_lte=(location, D(km=radius)),
                    is_available=True,
                    is_deleted=False,
                    **exp_filters
                ).select_related('place').distance(
                    location, field_name='place__location'
                ).order_by('distance')[:params['limit']]
                
                response_data['experiences'] = ExperienceSerializer(experiences, many=True).data
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in nearby recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating nearby recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending items based on recent user interactions.
        This endpoint is available to anonymous users.
        
        Query Parameters:
        - type: Type of items to recommend (places, experiences, both). Default: both
        - limit: Maximum number of items to return per type. Default: 10
        - days: Number of days to consider for trending. Default: 7
        - category: Filter by category name
        - country, city, region: Filter by location
        """
        try:
            params = self._parse_common_params(request)
            item_type = request.query_params.get('type', 'both')
            days = int(request.query_params.get('days', 7))
            
            # Initialize recommendation engine
            engine = self._get_recommendation_engine(request)
            
            # Build filters
            filters = self._build_filters(params)
            
            # Add trending boost with high weight
            trending_weight = 0.8
            
            response_data = {}
            
            # Get trending places if requested
            if item_type in ['places', 'both']:
                places_query = Place.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                )
                
                # Apply trending boost
                places = engine._apply_trending_boost(places_query, 'place')
                
                # Order by trending score
                places = places.order_by('-trending_score')[:params['limit']]
                
                response_data['places'] = PlaceSerializer(places, many=True).data
            
            # Get trending experiences if requested
            if item_type in ['experiences', 'both']:
                experiences_query = Experience.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                )
                
                # Apply trending boost
                experiences = engine._apply_trending_boost(experiences_query, 'experience')
                
                # Order by trending score
                experiences = experiences.order_by('-trending_score')[:params['limit']]
                
                response_data['experiences'] = ExperienceSerializer(experiences, many=True).data
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in trending recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating trending recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def seasonal(self, request):
        """
        Get seasonal recommendations based on current season.
        This endpoint is available to anonymous users.
        
        Query Parameters:
        - type: Type of items to recommend (places, experiences, both). Default: both
        - limit: Maximum number of items to return per type. Default: 10
        - season: Override current season (spring, summer, autumn, winter)
        - category: Filter by category name
        - country, city, region: Filter by location
        """
        try:
            params = self._parse_common_params(request)
            item_type = request.query_params.get('type', 'both')
            season_override = request.query_params.get('season')
            
            # Initialize recommendation engine
            engine = self._get_recommendation_engine(request)
            
            # Override season if provided
            if season_override:
                engine._get_current_season = lambda: season_override
            
            # Build filters
            filters = self._build_filters(params)
            
            response_data = {
                'season': engine._get_current_season(),
                'season_tags': engine._get_season_tags()
            }
            
            # Get seasonal places if requested
            if item_type in ['places', 'both']:
                places_query = Place.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                )
                
                # Apply seasonal boost
                places = engine._apply_seasonal_boost(places_query, 'place')
                
                # Order by seasonal score
                places = places.order_by('-seasonal_score')[:params['limit']]
                
                response_data['places'] = PlaceSerializer(places, many=True).data
            
            # Get seasonal experiences if requested
            if item_type in ['experiences', 'both']:
                experiences_query = Experience.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                )
                
                # Apply seasonal boost
                experiences = engine._apply_seasonal_boost(experiences_query, 'experience')
                
                # Order by seasonal score
                experiences = experiences.order_by('-seasonal_score')[:params['limit']]
                
                response_data['experiences'] = ExperienceSerializer(experiences, many=True).data
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in seasonal recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating seasonal recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Get popular items based on ratings and interaction count.
        This endpoint is available to anonymous users.
        
        Query Parameters:
        - type: Type of items to recommend (places, experiences, both). Default: both
        - limit: Maximum number of items to return per type. Default: 10
        - category: Filter by category name
        - country, city, region: Filter by location
        """
        try:
            params = self._parse_common_params(request)
            item_type = request.query_params.get('type', 'both')
            
            # Build filters
            filters = self._build_filters(params)
            
            response_data = {}
            
            # Get popular places if requested
            if item_type in ['places', 'both']:
                places = Place.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                ).order_by('-rating')[:params['limit']]
                
                response_data['places'] = PlaceSerializer(places, many=True).data
            
            # Get popular experiences if requested
            if item_type in ['experiences', 'both']:
                experiences = Experience.objects.filter(
                    is_available=True,
                    is_deleted=False,
                    **filters
                ).order_by('-rating')[:params['limit']]
                
                response_data['experiences'] = ExperienceSerializer(experiences, many=True).data
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in popular recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating popular recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def trip(self, request):
        """
        Get recommendations for a trip to a specific destination.
        
        Request Body:
        {
            "destination_id": "uuid",
            "destination_type": "city|region|country",
            "duration_days": 5,
            "budget": {
                "max_per_place": 200,
                "max_per_experience": 100
            },
            "interests": ["adventure", "culture", "food"],
            "start_date": "2023-06-15"
        }
        """
        try:
            # Validate required fields
            required_fields = ['destination_id', 'destination_type', 'duration_days']
            for field in required_fields:
                if field not in request.data:
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Parse request data
            destination_id = request.data.get('destination_id')
            destination_type = request.data.get('destination_type')
            duration_days = int(request.data.get('duration_days', 3))
            budget = request.data.get('budget', {})
            interests = request.data.get('interests', [])
            start_date = request.data.get('start_date')
            
            # Validate destination type
            if destination_type not in ['city', 'region', 'country']:
                return Response(
                    {'error': 'Invalid destination_type. Must be city, region, or country.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get destination
            destination = self._get_destination(destination_id, destination_type)
            if not destination:
                return Response(
                    {'error': f'{destination_type.capitalize()} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Initialize recommendation engine
            engine = self._get_recommendation_engine(request)
            
            # Generate recommendations for the trip
            recommendations = engine.recommend_for_box(
                destination=destination,
                duration_days=duration_days,
                user_interests=interests,
                budget=budget
            )
            
            # Prepare response
            response_data = {
                'destination': self._serialize_destination(destination, destination_type),
                'duration_days': duration_days,
                'places': PlaceSerializer(recommendations.get('places', []), many=True).data,
                'experiences': ExperienceSerializer(recommendations.get('experiences', []), many=True).data
            }
            
            # Add budget information if provided
            if budget:
                response_data['budget'] = budget
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in trip recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating trip recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def similar(self, request):
        """
        Get items similar to a specific item.
        
        Query Parameters:
        - item_id: ID of the reference item (required)
        - item_type: Type of the reference item (place, experience) (required)
        - limit: Maximum number of similar items to return. Default: 5
        """
        try:
            # Validate required parameters
            item_id = request.query_params.get('item_id')
            item_type = request.query_params.get('item_type')
            
            if not item_id or not item_type:
                return Response(
                    {'error': 'Both item_id and item_type are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if item_type not in ['place', 'experience']:
                return Response(
                    {'error': 'item_type must be either place or experience'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            limit = int(request.query_params.get('limit', 5))
            
            # Get the reference item
            try:
                if item_type == 'place':
                    item = Place.objects.get(id=item_id, is_deleted=False)
                else:
                    item = Experience.objects.get(id=item_id, is_deleted=False)
            except (Place.DoesNotExist, Experience.DoesNotExist):
                return Response(
                    {'error': f'{item_type.capitalize()} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Find similar items
            similar_items = self._find_similar_items(item, item_type, limit)
            
            # Serialize response
            if item_type == 'place':
                serializer = PlaceSerializer(similar_items, many=True)
            else:
                serializer = ExperienceSerializer(similar_items, many=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error finding similar items: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while finding similar items'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Get recommended categories based on user preferences and behavior.
        """
        try:
            limit = int(request.query_params.get('limit', 10))
            
            # Initialize recommendation engine
            engine = self._get_recommendation_engine(request)
            
            # Get all categories
            all_categories = Category.objects.all()
            
            if request.user.is_authenticated and hasattr(request.user, 'profile'):
                # Get user's preferred categories from profile
                user_interests = getattr(request.user.profile, 'travel_interests', [])
                
                # Prioritize categories matching user interests
                if user_interests:
                    matching_categories = all_categories.filter(name__in=user_interests)
                    other_categories = all_categories.exclude(name__in=user_interests)
                    
                    # Combine with priority to user's interests
                    categories = list(matching_categories) + list(other_categories)[:limit - matching_categories.count()]
                else:
                    # Get categories from user's interactions
                    from apps.authentication.models import UserInteraction
                    from django.contrib.contenttypes.models import ContentType
                    
                    place_type = ContentType.objects.get_for_model(Place)
                    exp_type = ContentType.objects.get_for_model(Experience)
                    
                    # Get categories from places user interacted with
                    place_interactions = UserInteraction.objects.filter(
                        user=request.user,
                        content_type=place_type
                    ).values_list('object_id', flat=True)
                    
                    place_categories = Place.objects.filter(
                        id__in=place_interactions
                    ).values_list('category', flat=True).distinct()
                    
                    # Get categories from experiences user interacted with
                    exp_interactions = UserInteraction.objects.filter(
                        user=request.user,
                        content_type=exp_type
                    ).values_list('object_id', flat=True)
                    
                    exp_categories = Experience.objects.filter(
                        id__in=exp_interactions
                    ).values_list('category', flat=True).distinct()
                    
                    # Combine category IDs
                    category_ids = list(place_categories) + list(exp_categories)
                    
                    if category_ids:
                        # Get categories user has interacted with
                        interacted_categories = Category.objects.filter(id__in=category_ids)
                        other_categories = all_categories.exclude(id__in=category_ids)
                        
                        # Combine with priority to interacted categories
                        categories = list(interacted_categories) + list(other_categories)[:limit - interacted_categories.count()]
                    else:
                        # Fallback to popular categories
                        categories = all_categories.order_by('?')[:limit]
            else:
                # For anonymous users, return random categories
                categories = all_categories.order_by('?')[:limit]
            
            # Serialize and return
            from apps.safar.serializers import CategorySerializer
            serializer = CategorySerializer(categories, many=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in category recommendations: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating category recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_destination(self, destination_id, destination_type):
        """Get destination model instance"""
        model_map = {
            'city': City,
            'region': Region,
            'country': Country
        }
        
        model = model_map[destination_type]
        try:
            return model.objects.get(id=destination_id, is_deleted=False)
        except model.DoesNotExist:
            return None
    
    def _serialize_destination(self, destination, destination_type):
        """Serialize destination based on its type"""
        if destination_type == 'city':
            return CitySerializer(destination).data
        elif destination_type == 'region':
            return RegionSerializer(destination).data
        else:
            return CountrySerializer(destination).data
    
    def _find_similar_items(self, item, item_type, limit):
        """Find items similar to the given item"""
        if item_type == 'place':
            # Find places with same category and/or location
            similar_items = Place.objects.filter(
                Q(category=item.category) | 
                Q(country=item.country) |
                Q(city=item.city)
            ).exclude(
                id=item.id
            ).filter(
                is_available=True,
                is_deleted=False
            ).distinct()
            
            # If item has location, boost by proximity
            if item.location:
                similar_items = similar_items.annotate(
                    distance=Distance('location', item.location)
                ).order_by('distance')
            else:
                similar_items = similar_items.order_by('-rating')
            
        else:  # experience
            # Find experiences with same category and/or place
            similar_items = Experience.objects.filter(
                Q(category=item.category) | 
                Q(place=item.place) |
                Q(place__country=item.place.country if item.place else None)
            ).exclude(
                id=item.id
            ).filter(
                is_available=True,
                is_deleted=False
            ).distinct()
            
            # Order by rating
            similar_items = similar_items.order_by('-rating')
        
        return similar_items[:limit]


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
        return [IsAuthenticated()]

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
    filterset_fields = ['category','place', 'is_available']
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
    filterset_fields = ['category','country', 'city']
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
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    
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
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    
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
    permission_classes = [IsAuthenticated]
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


class UniversalSearchView(generics.GenericAPIView):
    """
    Universal search endpoint that searches across multiple entity types:
    - Users
    - Places
    - Experiences
    - Cities
    - Regions
    - Countries
    
    Returns brief data (id, name, type) for each result.
    
    Query Parameters:
    - q: Search query (required, min 2 characters)
    - limit: Maximum number of results per entity type (default: 5)
    - types: Comma-separated list of entity types to search (optional)
             Available types: users,places,experiences,cities,regions,countries
    """
    permission_classes = [IsAuthenticated | HasAPIKey]
    
    def get(self, request):
        try:
            query = request.query_params.get('q', '')
            limit = int(request.query_params.get('limit', 5))
            types = request.query_params.get('types', '')
            
            # Validate query
            if not query or len(query) < 2:
                return Response({
                    'error': 'Search query must be at least 2 characters long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse types to search
            search_types = [t.strip() for t in types.split(',')] if types else [
                'users', 'places', 'experiences', 'cities', 'regions', 'countries'
            ]
            
            results = {}
            
            # Search users
            if 'users' in search_types:
                users = self._search_users(query, limit)
                results['users'] = [
                    {
                        'id': user.id, 
                        'name': user.get_full_name(), 
                        'username': user.username,
                        'type': 'user'
                    } 
                    for user in users
                ]
            
            # Search places
            if 'places' in search_types:
                places = self._search_places(query, limit)
                results['places'] = [
                    {
                        'id': place.id, 
                        'name': place.name, 
                        'type': 'place',
                        'category': place.category.name if place.category else None
                    } 
                    for place in places
                ]
            
            # Search experiences
            if 'experiences' in search_types:
                experiences = self._search_experiences(query, limit)
                results['experiences'] = [
                    {
                        'id': exp.id, 
                        'name': exp.title, 
                        'type': 'experience',
                        'category': exp.category.name if exp.category else None
                    } 
                    for exp in experiences
                ]
            
            # Search cities
            if 'cities' in search_types:
                cities = self._search_cities(query, limit)
                results['cities'] = [
                    {
                        'id': city.id, 
                        'name': city.name, 
                        'country': city.country.name if city.country else None, 
                        'type': 'city'
                    } 
                    for city in cities
                ]
            
            # Search regions
            if 'regions' in search_types:
                regions = self._search_regions(query, limit)
                results['regions'] = [
                    {
                        'id': region.id, 
                        'name': region.name, 
                        'country': region.country.name if region.country else None, 
                        'type': 'region'
                    } 
                    for region in regions
                ]
            
            # Search countries
            if 'countries' in search_types:
                countries = self._search_countries(query, limit)
                results['countries'] = [
                    {
                        'id': country.id, 
                        'name': country.name, 
                        'code': country.iso_code,
                        'type': 'country'
                    } 
                    for country in countries
                ]
            
            # Add total count
            total_count = sum(len(results[key]) for key in results)
            
            # Log search for analytics
            self._log_search(request.user, query, total_count)
            
            return Response({
                'query': query,
                'total_count': total_count,
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing your search'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _search_users(self, query, limit):
        """Search for users with optimized query"""
        return User.objects.filter(
            Q(username__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).filter(
            is_active=True, 
            is_deleted=False
        ).only(
            'id', 'username', 'first_name', 'last_name', 'email'
        )[:limit]
    
    def _search_places(self, query, limit):
        """Search for places with optimized query"""
        return Place.objects.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query)
        ).filter(
            is_deleted=False
        ).select_related(
            'category'
        ).only(
            'id', 'name', 'category__name'
        )[:limit]
    
    def _search_experiences(self, query, limit):
        """Search for experiences with optimized query"""
        return Experience.objects.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query)
        ).filter(
            is_deleted=False
        ).select_related(
            'category'
        ).only(
            'id', 'title', 'category__name'
        )[:limit]
    
    def _search_cities(self, query, limit):
        """Search for cities with optimized query"""
        return City.objects.filter(
            Q(name__icontains=query) | 
            Q(name_ascii__icontains=query)
        ).select_related(
            'country'
        ).only(
            'id', 'name', 'country__name'
        )[:limit]
    
    def _search_regions(self, query, limit):
        """Search for regions with optimized query"""
        return Region.objects.filter(
            Q(name__icontains=query) | 
            Q(code__icontains=query)
        ).select_related(
            'country'
        ).only(
            'id', 'name', 'country__name'
        )[:limit]
    
    def _search_countries(self, query, limit):
        """Search for countries with optimized query"""
        return Country.objects.filter(
            Q(name__icontains=query) | 
            Q(iso_code__iexact=query) | 
            Q(iso3_code__iexact=query)
        ).only(
            'id', 'name', 'iso_code'
        )[:limit]
    
    def _log_search(self, user, query, result_count):
        """Log search for analytics"""
        try:
            from apps.authentication.models import UserInteraction
            
            UserInteraction.log_interaction(
                user=user,
                content_object=user,  # Self-reference as there's no specific object
                interaction_type='search',
                metadata={
                    'query': query,
                    'result_count': result_count
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log search: {str(e)}")