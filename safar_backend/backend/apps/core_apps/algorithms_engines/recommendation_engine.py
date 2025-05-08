import logging
from typing import Dict, List, Optional, Tuple, Union, Any
from django.db.models import Q, F, Count, Avg, Sum, Case, When, Value, FloatField
from django.db.models.functions import Coalesce
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.contrib.gis.geos import Point
from django.utils import timezone
from datetime import timedelta
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

from apps.safar.models import (
    Place, Experience, Flight, Box, Category, 
    Booking, Wishlist, Review
)
from apps.authentication.models import UserInteraction
from apps.authentication.models import User, UserProfile
from apps.geographic_data.models import Country, Region, City

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    A sophisticated recommendation engine that provides personalized recommendations
    for places, experiences, flights, and travel packages based on user preferences,
    behavior, and geographic data.
    """
    
    def __init__(self, user: Optional[User] = None):
        """
        Initialize the recommendation engine.
        
        Args:
            user: The user to generate recommendations for. If None, will provide
                 non-personalized recommendations.
        """
        self.user = user
        self.is_authenticated = user is not None and user.is_authenticated
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self.logger.info(f"Initializing recommendation engine for user: {user.id if self.is_authenticated else 'anonymous'}")
        
        # Cache for user preferences
        self._user_preferences = None
        self._user_location = None
        self._interaction_history = None
        
    def recommend_places(self, limit: int = 5, filters: Optional[Dict] = None) -> List[Place]:
        """
        Recommend places based on user preferences and behavior.
        
        Args:
            limit: Maximum number of recommendations to return
            filters: Additional filters to apply to the recommendations
            
        Returns:
            A list of recommended Place objects
        """
        try:
            self.logger.info(f"Generating place recommendations with limit={limit}")
            
            # Start with base queryset
            base_queryset = Place.objects.filter(is_deleted=False, is_available=True)
            
            # Apply any additional filters
            if filters:
                base_queryset = base_queryset.filter(**filters)
            
            if not self.is_authenticated:
                # For anonymous users, return popular places
                return self._get_popular_places(base_queryset, limit)
            
            # For authenticated users, use a hybrid approach
            return self._get_personalized_places(base_queryset, limit)
            
        except Exception as e:
            self.logger.error(f"Error generating place recommendations: {str(e)}", exc_info=True)
            # Fallback to popular places in case of error
            return Place.objects.filter(is_deleted=False, is_available=True).order_by('-rating')[:limit]
    
    def recommend_experiences(self, limit: int = 5, filters: Optional[Dict] = None) -> List[Experience]:
        """
        Recommend experiences based on user preferences and behavior.
        
        Args:
            limit: Maximum number of recommendations to return
            filters: Additional filters to apply to the recommendations
            
        Returns:
            A list of recommended Experience objects
        """
        try:
            self.logger.info(f"Generating experience recommendations with limit={limit}")
            
            # Start with base queryset
            base_queryset = Experience.objects.filter(is_deleted=False, is_available=True)
            
            # Apply any additional filters
            if filters:
                base_queryset = base_queryset.filter(**filters)
            
            if not self.is_authenticated:
                # For anonymous users, return popular experiences
                return self._get_popular_experiences(base_queryset, limit)
            
            # For authenticated users, use a hybrid approach
            return self._get_personalized_experiences(base_queryset, limit)
            
        except Exception as e:
            self.logger.error(f"Error generating experience recommendations: {str(e)}", exc_info=True)
            # Fallback to popular experiences in case of error
            return Experience.objects.filter(is_deleted=False, is_available=True).order_by('-rating')[:limit]
    
    def recommend_boxes(self, limit: int = 5, filters: Optional[Dict] = None) -> List[Box]:
        """
        Recommend travel packages (boxes) based on user preferences and behavior.
        
        Args:
            limit: Maximum number of recommendations to return
            filters: Additional filters to apply to the recommendations
            
        Returns:
            A list of recommended Box objects
        """
        try:
            self.logger.info(f"Generating box recommendations with limit={limit}")
            
            # Start with base queryset
            base_queryset = Box.objects.filter(is_deleted=False)
            
            # Apply any additional filters
            if filters:
                base_queryset = base_queryset.filter(**filters)
            
            if not self.is_authenticated:
                # For anonymous users, return popular boxes
                return self._get_popular_boxes(base_queryset, limit)
            
            # For authenticated users, use a hybrid approach
            return self._get_personalized_boxes(base_queryset, limit)
            
        except Exception as e:
            self.logger.error(f"Error generating box recommendations: {str(e)}", exc_info=True)
            # Fallback to popular boxes in case of error
            return Box.objects.filter(is_deleted=False).order_by('-created_at')[:limit]
    
    def recommend_flights(self, limit: int = 5, filters: Optional[Dict] = None) -> List[Flight]:
        """
        Recommend flights based on user preferences and behavior.
        
        Args:
            limit: Maximum number of recommendations to return
            filters: Additional filters to apply to the recommendations
            
        Returns:
            A list of recommended Flight objects
        """
        try:
            self.logger.info(f"Generating flight recommendations with limit={limit}")
            
            # Start with base queryset
            base_queryset = Flight.objects.filter(is_deleted=False)
            
            # Apply any additional filters
            if filters:
                base_queryset = base_queryset.filter(**filters)
            
            if not self.is_authenticated:
                # For anonymous users, return popular flights
                return self._get_popular_flights(base_queryset, limit)
            
            # For authenticated users, use a hybrid approach
            return self._get_personalized_flights(base_queryset, limit)
            
        except Exception as e:
            self.logger.error(f"Error generating flight recommendations: {str(e)}", exc_info=True)
            # Fallback to popular flights in case of error
            return Flight.objects.filter(is_deleted=False).order_by('price')[:limit]
    
    def recommend_nearby(self, lat: float, lng: float, radius_km: float = 10, 
                         limit: int = 5, entity_type: str = 'place') -> List[Any]:
        """
        Recommend entities near a specific location.
        
        Args:
            lat: Latitude of the location
            lng: Longitude of the location
            radius_km: Radius in kilometers to search within
            limit: Maximum number of recommendations to return
            entity_type: Type of entity to recommend ('place', 'experience')
            
        Returns:
            A list of recommended entities near the specified location
        """
        try:
            self.logger.info(f"Generating nearby {entity_type} recommendations at ({lat}, {lng}) with radius={radius_km}km")
            
            # Create a point from the coordinates
            point = Point(lng, lat, srid=4326)
            
            # Select the appropriate model based on entity_type
            if entity_type == 'place':
                model = Place
                base_queryset = Place.objects.filter(is_deleted=False, is_available=True)
            elif entity_type == 'experience':
                model = Experience
                base_queryset = Experience.objects.filter(is_deleted=False, is_available=True)
            else:
                raise ValueError(f"Unsupported entity type: {entity_type}")
            
            # Find entities within the specified radius
            nearby_entities = base_queryset.filter(
                location__distance_lte=(point, D(km=radius_km))
            ).annotate(
                distance=Distance('location', point)
            ).order_by('distance')[:limit]
            
            return nearby_entities
            
        except Exception as e:
            self.logger.error(f"Error generating nearby recommendations: {str(e)}", exc_info=True)
            # Return empty list in case of error
            return []
    
    def get_user_preferences(self) -> Dict:
        """
        Get the user's preferences based on their profile and interaction history.
        
        Returns:
            A dictionary of user preferences
        """
        if not self.is_authenticated:
            return {}
            
        if self._user_preferences is not None:
            return self._user_preferences
            
        try:
            # Initialize preferences dictionary
            preferences = {
                'categories': {},
                'price_range': {
                    'min': 0,
                    'max': float('inf'),
                    'preferred': None
                },
                'locations': {
                    'countries': {},
                    'regions': {},
                    'cities': {}
                },
                'ratings': {},
                'tags': {}
            }
            
            # Get user profile data
            try:
                profile = UserProfile.objects.get(user=self.user)
                
                # Add preferred countries from profile
                for country in profile.preferred_countries.all():
                    preferences['locations']['countries'][country.id] = 1.0
                    
                # Add travel interests from profile
                if profile.travel_interests:
                    for interest in profile.travel_interests:
                        if interest not in preferences['tags']:
                            preferences['tags'][interest] = 0
                        preferences['tags'][interest] += 1
                        
                # Add travel history from profile
                if profile.travel_history:
                    for history_item in profile.travel_history:
                        country_id = history_item.get('country_id')
                        if country_id:
                            if country_id not in preferences['locations']['countries']:
                                preferences['locations']['countries'][country_id] = 0
                            preferences['locations']['countries'][country_id] += 0.5
            except UserProfile.DoesNotExist:
                pass
                
            # Analyze booking history
            bookings = Booking.objects.filter(user=self.user, is_deleted=False)
            
            # Process place bookings
            place_bookings = bookings.filter(place__isnull=False).select_related('place__category', 'place__country', 'place__region', 'place__city')
            for booking in place_bookings:
                place = booking.place
                
                # Update category preferences
                category_id = place.category_id
                if category_id not in preferences['categories']:
                    preferences['categories'][category_id] = 0
                preferences['categories'][category_id] += 1
                
                # Update location preferences
                if place.country_id:
                    if place.country_id not in preferences['locations']['countries']:
                        preferences['locations']['countries'][place.country_id] = 0
                    preferences['locations']['countries'][place.country_id] += 1
                    
                if place.region_id:
                    if place.region_id not in preferences['locations']['regions']:
                        preferences['locations']['regions'][place.region_id] = 0
                    preferences['locations']['regions'][place.region_id] += 1
                    
                if place.city_id:
                    if place.city_id not in preferences['locations']['cities']:
                        preferences['locations']['cities'][place.city_id] = 0
                    preferences['locations']['cities'][place.city_id] += 1
                
                # Update price preferences
                price = float(place.price)
                if preferences['price_range']['preferred'] is None:
                    preferences['price_range']['preferred'] = price
                else:
                    preferences['price_range']['preferred'] = (preferences['price_range']['preferred'] + price) / 2
            
            # Process experience bookings
            experience_bookings = bookings.filter(experience__isnull=False).select_related('experience__category', 'experience__country', 'experience__region', 'experience__city')
            for booking in experience_bookings:
                experience = booking.experience
                
                # Update category preferences
                category_id = experience.category_id
                if category_id not in preferences['categories']:
                    preferences['categories'][category_id] = 0
                preferences['categories'][category_id] += 1
                
                # Update location preferences
                if experience.country_id:
                    if experience.country_id not in preferences['locations']['countries']:
                        preferences['locations']['countries'][experience.country_id] = 0
                    preferences['locations']['countries'][experience.country_id] += 1
                    
                if experience.region_id:
                    if experience.region_id not in preferences['locations']['regions']:
                        preferences['locations']['regions'][experience.region_id] = 0
                    preferences['locations']['regions'][experience.region_id] += 1
                    
                if experience.city_id:
                    if experience.city_id not in preferences['locations']['cities']:
                        preferences['locations']['cities'][experience.city_id] = 0
                    preferences['locations']['cities'][experience.city_id] += 1
                
                # Update price preferences
                price = float(experience.price_per_person)
                if preferences['price_range']['preferred'] is None:
                    preferences['price_range']['preferred'] = price
                else:
                    preferences['price_range']['preferred'] = (preferences['price_range']['preferred'] + price) / 2
            
            # Analyze wishlist
            wishlist_items = Wishlist.objects.filter(user=self.user, is_deleted=False)
            
            # Process place wishlist items
            place_wishlist = wishlist_items.filter(place__isnull=False).select_related('place__category', 'place__country', 'place__region', 'place__city')
            for wishlist_item in place_wishlist:
                place = wishlist_item.place
                
                # Update category preferences
                category_id = place.category_id
                if category_id not in preferences['categories']:
                    preferences['categories'][category_id] = 0
                preferences['categories'][category_id] += 0.7  # Lower weight than bookings
                
                # Update location preferences
                if place.country_id:
                    if place.country_id not in preferences['locations']['countries']:
                        preferences['locations']['countries'][place.country_id] = 0
                    preferences['locations']['countries'][place.country_id] += 0.7
                    
                if place.region_id:
                    if place.region_id not in preferences['locations']['regions']:
                        preferences['locations']['regions'][place.region_id] = 0
                    preferences['locations']['regions'][place.region_id] += 0.7
                    
                if place.city_id:
                    if place.city_id not in preferences['locations']['cities']:
                        preferences['locations']['cities'][place.city_id] = 0
                    preferences['locations']['cities'][place.city_id] += 0.7
            
            # Analyze reviews
            reviews = Review.objects.filter(user=self.user, is_deleted=False)
            
            # Process place reviews
            place_reviews = reviews.filter(place__isnull=False).select_related('place__category')
            for review in place_reviews:
                # Update rating preferences
                rating = review.rating
                if rating not in preferences['ratings']:
                    preferences['ratings'][rating] = 0
                preferences['ratings'][rating] += 1
                
                # Update category preferences based on highly rated places
                if rating >= 4:
                    category_id = review.place.category_id
                    if category_id not in preferences['categories']:
                        preferences['categories'][category_id] = 0
                    preferences['categories'][category_id] += 0.8
            
            # Analyze user interactions
            interactions = UserInteraction.objects.filter(
                user=self.user,
                created_at__gte=timezone.now() - timedelta(days=90)  # Last 90 days
            ).select_related('content_type')
            
            for interaction in interactions:
                # Get the weight of this interaction type
                weight = interaction.interaction_weight
                
                # Get the content object
                content_object = interaction.content_object
                
                # Process different types of content objects
                if isinstance(content_object, Place):
                    # Update category preferences
                    category_id = content_object.category_id
                    if category_id not in preferences['categories']:
                        preferences['categories'][category_id] = 0
                    preferences['categories'][category_id] += weight * 0.5
                    
                    # Update location preferences
                    if content_object.country_id:
                        if content_object.country_id not in preferences['locations']['countries']:
                            preferences['locations']['countries'][content_object.country_id] = 0
                        preferences['locations']['countries'][content_object.country_id] += weight * 0.5
                        
                    if content_object.region_id:
                        if content_object.region_id not in preferences['locations']['regions']:
                            preferences['locations']['regions'][content_object.region_id] = 0
                        preferences['locations']['regions'][content_object.region_id] += weight * 0.5
                        
                    if content_object.city_id:
                        if content_object.city_id not in preferences['locations']['cities']:
                            preferences['locations']['cities'][content_object.city_id] = 0
                        preferences['locations']['cities'][content_object.city_id] += weight * 0.5
                    
                    # Process metadata for additional insights
                    metadata = interaction.metadata
                    if metadata:
                        # Extract tags or features from metadata
                        if 'tags' in metadata:
                            for tag in metadata['tags']:
                                if tag not in preferences['tags']:
                                    preferences['tags'][tag] = 0
                                preferences['tags'][tag] += weight * 0.3
            
            # Normalize preferences
            self._normalize_preferences(preferences)
            
            # Cache the preferences
            self._user_preferences = preferences
            
            return preferences
            
        except Exception as e:
            self.logger.error(f"Error getting user preferences: {str(e)}", exc_info=True)
            return {}
    
    def get_user_location(self) -> Optional[Point]:
        """
        Get the user's current location if available.
        
        Returns:
            A Point object representing the user's location, or None if not available
        """
        if not self.is_authenticated:
            return None
            
        if self._user_location is not None:
            return self._user_location
            
        try:
            # Try to get location from user profile
            profile = UserProfile.objects.filter(user=self.user).first()
            if profile and profile.location:
                self._user_location = profile.location
                return profile.location
                
            # If no profile location, try to infer from recent interactions
            recent_login = self.user.login_logs.order_by('-created_at').first()
            if recent_login and recent_login.country and recent_login.city:
                # Try to find the city in our database
                city = City.objects.filter(
                    name__iexact=recent_login.city,
                    country__name__iexact=recent_login.country
                ).first()
                
                if city and city.geometry:
                    self._user_location = city.geometry
                    return city.geometry
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user location: {str(e)}", exc_info=True)
            return None
    
    def get_interaction_history(self) -> Dict:
        """
        Get the user's interaction history.
        
        Returns:
            A dictionary of interaction history
        """
        if not self.is_authenticated:
            return {}
            
        if self._interaction_history is not None:
            return self._interaction_history
            
        try:
            # Initialize interaction history dictionary
            history = {
                'places': {},
                'experiences': {},
                'flights': {},
                'boxes': {},
                'categories': {},
                'countries': {},
                'cities': {}
            }
            
            # Get recent interactions
            interactions = UserInteraction.objects.filter(
                user=self.user,
                created_at__gte=timezone.now() - timedelta(days=90)  # Last 90 days
            ).select_related('content_type')
            
            for interaction in interactions:
                # Get the weight of this interaction type
                weight = interaction.interaction_weight
                
                # Get the content object
                content_object = interaction.content_object
                
                # Process different types of content objects
                if isinstance(content_object, Place):
                    if content_object.id not in history['places']:
                        history['places'][content_object.id] = 0
                    history['places'][content_object.id] += weight
                    
                    # Update category history
                    if content_object.category_id not in history['categories']:
                        history['categories'][content_object.category_id] = 0
                    history['categories'][content_object.category_id] += weight
                    
                    # Update location history
                    if content_object.country_id:
                        if content_object.country_id not in history['countries']:
                            history['countries'][content_object.country_id] = 0
                        history['countries'][content_object.country_id] += weight
                    
                    if content_object.city_id:
                        if content_object.city_id not in history['cities']:
                            history['cities'][content_object.city_id] = 0
                        history['cities'][content_object.city_id] += weight
                
                elif isinstance(content_object, Experience):
                    if content_object.id not in history['experiences']:
                        history['experiences'][content_object.id] = 0
                    history['experiences'][content_object.id] += weight
                    
                    # Update category history
                    if content_object.category_id not in history['categories']:
                        history['categories'][content_object.category_id] = 0
                    history['categories'][content_object.category_id] += weight
                    
                    # Update location history
                    if content_object.country_id:
                        if content_object.country_id not in history['countries']:
                            history['countries'][content_object.country_id] = 0
                        history['countries'][content_object.country_id] += weight
                    
                    if content_object.city_id:
                        if content_object.city_id not in history['cities']:
                            history['cities'][content_object.city_id] = 0
                        history['cities'][content_object.city_id] += weight
                
                elif isinstance(content_object, Flight):
                    if content_object.id not in history['flights']:
                        history['flights'][content_object.id] = 0
                    history['flights'][content_object.id] += weight
                
                elif isinstance(content_object, Box):
                    if content_object.id not in history['boxes']:
                        history['boxes'][content_object.id] = 0
                    history['boxes'][content_object.id] += weight
                    
                    # Update location history
                    if content_object.country_id:
                        if content_object.country_id not in history['countries']:
                            history['countries'][content_object.country_id] = 0
                        history['countries'][content_object.country_id] += weight
                    
                    if content_object.city_id:
                        if content_object.city_id not in history['cities']:
                            history['cities'][content_object.city_id] = 0
                        history['cities'][content_object.city_id] += weight
            
            # Cache the interaction history
            self._interaction_history = history
            
            return history
            
        except Exception as e:
            self.logger.error(f"Error getting interaction history: {str(e)}", exc_info=True)
            return {}
    
    def _get_popular_places(self, queryset, limit: int = 5) -> List[Place]:
        """
        Get popular places for anonymous users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of places to return
            
        Returns:
            A list of popular Place objects
        """
        # Calculate popularity score based on ratings, bookings, and reviews
        popular_places = queryset.annotate(
            booking_count=Count('bookings', distinct=True),
            review_count=Count('reviews', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            popularity_score=Coalesce(F('rating'), 0) * 0.5 + 
                            Count('bookings', distinct=True) * 0.3 + 
                            Count('reviews', distinct=True) * 0.1 +
                            Count('wishlists', distinct=True) * 0.1
        ).order_by('-popularity_score')[:limit]
        
        return popular_places
    
    def _get_personalized_places(self, queryset, limit: int = 5) -> List[Place]:
        """
        Get personalized place recommendations for authenticated users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of places to return
            
        Returns:
            A list of personalized Place recommendations
        """
        # Get user preferences
        preferences = self.get_user_preferences()
        
        # Get user location
        user_location = self.get_user_location()
        
        # Get interaction history
        interaction_history = self.get_interaction_history()
        
        # Exclude places the user has already booked
        booked_place_ids = Booking.objects.filter(
            user=self.user,
            place__isnull=False
        ).values_list('place_id', flat=True)
        
        queryset = queryset.exclude(id__in=booked_place_ids)
        
        # Calculate personalized score based on user preferences
        personalized_places = queryset.annotate(
            # Base popularity metrics
            booking_count=Count('bookings', distinct=True),
            review_count=Count('reviews', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            
            # Base popularity score (30% weight)
            popularity_score=Coalesce(F('rating'), 0) * 0.5 + 
                            Count('bookings', distinct=True) * 0.3 + 
                            Count('reviews', distinct=True) * 0.1 +
                            Count('wishlists', distinct=True) * 0.1,
                            
            # Location relevance score (30% weight)
            location_score=Case(
                # Country match
                When(country_id__in=list(preferences.get('locations', {}).get('countries', {}).keys()), 
                     then=Value(0.6)),
                # Region match
                When(region_id__in=list(preferences.get('locations', {}).get('regions', {}).keys()), 
                     then=Value(0.3)),
                # City match
                When(city_id__in=list(preferences.get('locations', {}).get('cities', {}).keys()), 
                     then=Value(0.1)),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Category relevance score (20% weight)
            category_score=Case(
                When(category_id__in=list(preferences.get('categories', {}).keys()), 
                     then=Value(1.0)),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Price relevance score (10% weight)
            price_score=Case(
                When(
                    price__lte=preferences.get('price_range', {}).get('preferred', 0) * 1.2,
                    price__gte=preferences.get('price_range', {}).get('preferred', 0) * 0.8,
                    then=Value(1.0)
                ),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Distance score if user location is available (10% weight)
            distance_score=Value(1.0, output_field=FloatField())  # Default value
        )
        
        # Add distance score if user location is available
        if user_location:
            personalized_places = personalized_places.annotate(
                distance=Distance('location', user_location),
                distance_score=Case(
                    When(distance__lte=D(km=10), then=Value(1.0)),
                    When(distance__lte=D(km=50), then=Value(0.8)),
                    When(distance__lte=D(km=100), then=Value(0.6)),
                    When(distance__lte=D(km=500), then=Value(0.4)),
                    When(distance__lte=D(km=1000), then=Value(0.2)),
                    default=Value(0.0),
                    output_field=FloatField()
                )
            )
        
        # Calculate final personalized score
        personalized_places = personalized_places.annotate(
            personalized_score=(
                F('popularity_score') * 0.3 +  # 30% weight for popularity
                F('location_score') * 0.3 +    # 30% weight for location relevance
                F('category_score') * 0.2 +    # 20% weight for category relevance
                F('price_score') * 0.1 +       # 10% weight for price relevance
                F('distance_score') * 0.1      # 10% weight for distance (if available)
            )
        ).order_by('-personalized_score')
        
        # Add diversity to recommendations (don't return all from same category/location)
        diverse_recommendations = []
        categories_added = set()
        countries_added = set()
        
        # Get twice as many recommendations as needed to ensure diversity
        candidate_places = list(personalized_places[:limit*2])
        
        # First, add the top recommendation regardless of diversity
        if candidate_places:
            diverse_recommendations.append(candidate_places[0])
            if candidate_places[0].category_id:
                categories_added.add(candidate_places[0].category_id)
            if candidate_places[0].country_id:
                countries_added.add(candidate_places[0].country_id)
            
            # Then add the rest with diversity in mind
            for place in candidate_places[1:]:
                # Skip if we already have enough recommendations
                if len(diverse_recommendations) >= limit:
                    break
                    
                # Add diversity by limiting places from same category/country
                category_id = place.category_id
                country_id = place.country_id
                
                # If we already have 2 places from this category, skip unless we're running low on options
                if category_id in categories_added and len(categories_added) >= 2:
                    # Unless we're running out of recommendations
                    if len(diverse_recommendations) < limit - 2:
                        continue
                
                # If we already have 2 places from this country, skip unless we're running low on options
                if country_id in countries_added and len(countries_added) >= 2:
                    # Unless we're running out of recommendations
                    if len(diverse_recommendations) < limit - 2:
                        continue
                
                # Add this place to our recommendations
                diverse_recommendations.append(place)
                
                # Update our tracking sets
                if category_id:
                    categories_added.add(category_id)
                if country_id:
                    countries_added.add(country_id)
        
        # If we couldn't get enough diverse recommendations, fall back to the original sorted list
        if len(diverse_recommendations) < limit:
            return list(personalized_places[:limit])
            
        return diverse_recommendations
    
    def _get_popular_experiences(self, queryset, limit: int = 5) -> List[Experience]:
        """
        Get popular experiences for anonymous users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of experiences to return
            
        Returns:
            A list of popular Experience objects
        """
        # Calculate popularity score based on ratings, bookings, and reviews
        popular_experiences = queryset.annotate(
            booking_count=Count('bookings', distinct=True),
            review_count=Count('reviews', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            popularity_score=Coalesce(F('rating'), 0) * 0.5 + 
                            Count('bookings', distinct=True) * 0.3 + 
                            Count('reviews', distinct=True) * 0.1 +
                            Count('wishlists', distinct=True) * 0.1
        ).order_by('-popularity_score')[:limit]
        
        return popular_experiences
    
    def _get_personalized_experiences(self, queryset, limit: int = 5) -> List[Experience]:
        """
        Get personalized experience recommendations for authenticated users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of experiences to return
            
        Returns:
            A list of personalized Experience recommendations
        """
        # Similar approach to _get_personalized_places but adapted for experiences
        # Get user preferences
        preferences = self.get_user_preferences()
        
        # Get user location
        user_location = self.get_user_location()
        
        # Exclude experiences the user has already booked
        booked_experience_ids = Booking.objects.filter(
            user=self.user,
            experience__isnull=False
        ).values_list('experience_id', flat=True)
        
        queryset = queryset.exclude(id__in=booked_experience_ids)
        
        # Calculate personalized score based on user preferences
        personalized_experiences = queryset.annotate(
            # Base popularity metrics
            booking_count=Count('bookings', distinct=True),
            review_count=Count('reviews', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            
            # Base popularity score (30% weight)
            popularity_score=Coalesce(F('rating'), 0) * 0.5 + 
                            Count('bookings', distinct=True) * 0.3 + 
                            Count('reviews', distinct=True) * 0.1 +
                            Count('wishlists', distinct=True) * 0.1,
                            
            # Location relevance score (30% weight)
            location_score=Case(
                # Country match
                When(country_id__in=list(preferences.get('locations', {}).get('countries', {}).keys()), 
                     then=Value(0.6)),
                # Region match
                When(region_id__in=list(preferences.get('locations', {}).get('regions', {}).keys()), 
                     then=Value(0.3)),
                # City match
                When(city_id__in=list(preferences.get('locations', {}).get('cities', {}).keys()), 
                     then=Value(0.1)),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Category relevance score (20% weight)
            category_score=Case(
                When(category_id__in=list(preferences.get('categories', {}).keys()), 
                     then=Value(1.0)),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Price relevance score (10% weight)
            price_score=Case(
                When(
                    price_per_person__lte=preferences.get('price_range', {}).get('preferred', 0) * 1.2,
                    price_per_person__gte=preferences.get('price_range', {}).get('preferred', 0) * 0.8,
                    then=Value(1.0)
                ),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Distance score if user location is available (10% weight)
            distance_score=Value(1.0, output_field=FloatField())  # Default value
        )
        
        # Add distance score if user location is available
        if user_location:
            personalized_experiences = personalized_experiences.annotate(
                distance=Distance('location', user_location),
                distance_score=Case(
                    When(distance__lte=D(km=10), then=Value(1.0)),
                    When(distance__lte=D(km=50), then=Value(0.8)),
                    When(distance__lte=D(km=100), then=Value(0.6)),
                    When(distance__lte=D(km=500), then=Value(0.4)),
                    When(distance__lte=D(km=1000), then=Value(0.2)),
                    default=Value(0.0),
                    output_field=FloatField()
                )
            )
        
        # Calculate final personalized score
        personalized_experiences = personalized_experiences.annotate(
            personalized_score=(
                F('popularity_score') * 0.3 +  # 30% weight for popularity
                F('location_score') * 0.3 +    # 30% weight for location relevance
                F('category_score') * 0.2 +    # 20% weight for category relevance
                F('price_score') * 0.1 +       # 10% weight for price relevance
                F('distance_score') * 0.1      # 10% weight for distance (if available)
            )
        ).order_by('-personalized_score')[:limit]
        
        return personalized_experiences
    
    def _get_popular_boxes(self, queryset, limit: int = 5) -> List[Box]:
        """
        Get popular boxes for anonymous users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of boxes to return
            
        Returns:
            A list of popular Box objects
        """
        # Calculate popularity score based on bookings and wishlists
        popular_boxes = queryset.annotate(
            booking_count=Count('bookings', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            popularity_score=Count('bookings', distinct=True) * 0.7 + 
                            Count('wishlists', distinct=True) * 0.3
        ).order_by('-popularity_score')[:limit]
        
        return popular_boxes
    
    def _get_personalized_boxes(self, queryset, limit: int = 5) -> List[Box]:
        """
        Get personalized box recommendations for authenticated users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of boxes to return
            
        Returns:
            A list of personalized Box recommendations
        """
        # Similar approach to _get_personalized_places but adapted for boxes
        # Get user preferences
        preferences = self.get_user_preferences()
        
        # Exclude boxes the user has already booked
        booked_box_ids = Booking.objects.filter(
            user=self.user,
            box__isnull=False
        ).values_list('box_id', flat=True)
        
        queryset = queryset.exclude(id__in=booked_box_ids)
        
        # Calculate personalized score based on user preferences
        personalized_boxes = queryset.annotate(
            # Base popularity metrics
            booking_count=Count('bookings', distinct=True),
            wishlist_count=Count('wishlists', distinct=True),
            
            # Base popularity score (40% weight)
            popularity_score=Count('bookings', distinct=True) * 0.7 + 
                            Count('wishlists', distinct=True) * 0.3,
                            
            # Location relevance score (40% weight)
            location_score=Case(
                # Country match
                When(country_id__in=list(preferences.get('locations', {}).get('countries', {}).keys()), 
                     then=Value(1.0)),
                # City match
                When(city_id__in=list(preferences.get('locations', {}).get('cities', {}).keys()), 
                     then=Value(0.5)),
                default=Value(0.0),
                output_field=FloatField()
            ),
            
            # Price relevance score (20% weight)
            price_score=Case(
                When(
                    total_price__lte=preferences.get('price_range', {}).get('preferred', 0) * 1.5,
                    total_price__gte=preferences.get('price_range', {}).get('preferred', 0) * 0.5,
                    then=Value(1.0)
                ),
                default=Value(0.0),
                output_field=FloatField()
            )
        )
        
        # Calculate final personalized score
        personalized_boxes = personalized_boxes.annotate(
            personalized_score=(
                F('popularity_score') * 0.4 +  # 40% weight for popularity
                F('location_score') * 0.4 +    # 40% weight for location relevance
                F('price_score') * 0.2         # 20% weight for price relevance
            )
        ).order_by('-personalized_score')[:limit]
        
        return personalized_boxes
    
    def _get_popular_flights(self, queryset, limit: int = 5) -> List[Flight]:
        """
        Get popular flights for anonymous users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of flights to return
            
        Returns:
            A list of popular Flight objects
        """
        # For flights, popularity is mainly based on bookings
        popular_flights = queryset.annotate(
            booking_count=Count('bookings', distinct=True),
            popularity_score=Count('bookings', distinct=True)
        ).order_by('-popularity_score', 'price')[:limit]
        
        return popular_flights
    
    def _get_personalized_flights(self, queryset, limit: int = 5) -> List[Flight]:
        """
        Get personalized flight recommendations for authenticated users.
        
        Args:
            queryset: Base queryset to filter from
            limit: Maximum number of flights to return
            
        Returns:
            A list of personalized Flight recommendations
        """
        # For flights, we need to look at the user's travel history
        interaction_history = self.get_interaction_history()
        
        # Get frequently visited airports
        frequent_airports = set()
        
        # Look at past flight bookings
        flight_bookings = Booking.objects.filter(
            user=self.user,
            flight__isnull=False
        ).select_related('flight')
        
        for booking in flight_bookings:
            frequent_airports.add(booking.flight.departure_airport)
            frequent_airports.add(booking.flight.arrival_airport)
        
        # If we have frequent airports, prioritize flights to/from those airports
        if frequent_airports:
            personalized_flights = queryset.annotate(
                is_frequent_departure=Case(
                    When(departure_airport__in=frequent_airports, then=Value(1)),
                    default=Value(0),
                    output_field=FloatField()
                ),
                is_frequent_arrival=Case(
                    When(arrival_airport__in=frequent_airports, then=Value(1)),
                    default=Value(0),
                    output_field=FloatField()
                ),
                personalized_score=F('is_frequent_departure') * 0.5 + F('is_frequent_arrival') * 0.5
            ).order_by('-personalized_score', 'price')[:limit]
            
            return personalized_flights
        
        # If no flight history, return flights sorted by price
        return queryset.order_by('price')[:limit]
    
    def _normalize_preferences(self, preferences: Dict) -> None:
        """
        Normalize preference values to be between 0 and 1.
        
        Args:
            preferences: Dictionary of user preferences to normalize
        """
        # Normalize category preferences
        if preferences['categories']:
            max_category_value = max(preferences['categories'].values())
            if max_category_value > 0:
                for category_id in preferences['categories']:
                    preferences['categories'][category_id] /= max_category_value
        
        # Normalize location preferences
        for location_type in ['countries', 'regions', 'cities']:
            if preferences['locations'][location_type]:
                max_location_value = max(preferences['locations'][location_type].values())
                if max_location_value > 0:
                    for location_id in preferences['locations'][location_type]:
                        preferences['locations'][location_type][location_id] /= max_location_value
        
        # Normalize tag preferences
        if preferences['tags']:
            max_tag_value = max(preferences['tags'].values())
            if max_tag_value > 0:
                for tag in preferences['tags']:
                    preferences['tags'][tag] /= max_tag_value
