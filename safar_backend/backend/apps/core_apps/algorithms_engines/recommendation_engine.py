import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from geopy.distance import geodesic
import logging
from django.db import models
from django.db.models import Case, When, F, Value, FloatField, Count, Avg, ExpressionWrapper, Q
from django.db.models.functions import Coalesce
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from datetime import datetime, timedelta
from django.core.cache import cache
import hashlib
import json

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Enhanced recommendation engine with improved personalization, location awareness,
    and dynamic content allocation based on user context
    """
    INTERACTION_WEIGHTS = {
        'booking_complete': 1.0,
        'booking_start': 0.7,
        'wishlist_add': 0.6,
        'rating_given': 0.8,
        'review_added': 0.5,
        'view_place': 0.3,
        'view_experience': 0.3,
        'recommendation_click': 0.4,
        'search': 0.2,
        'filter_use': 0.15
    }
    
    TEMPORAL_DECAY_RATE = 0.1 
    
    GLOBAL_CACHE_TTL = 3600
    USER_CACHE_TTL = 1800
    
    def __init__(self, user=None, request_context=None):
        """
        Initialize the recommendation engine
        
        Args:
            user (User, optional): The user to generate recommendations for.
                                  If None, anonymous recommendations will be provided.
            request_context (dict, optional): Additional context from the request
                                             such as IP, location, device, etc.
        """
        self.user = user
        self.profile = user.profile if user and hasattr(user, 'profile') else None
        self.is_authenticated = user is not None
        self.request_context = request_context or {}
        
        self.user_item_matrix = None
        self.item_features = None
        self.user_features = None
        self.svd_model = None
        self.kmeans_model = None
        
        self.user_location = self._get_user_location()
        self.device_type = self.request_context.get('device_type', 'desktop')
        self.is_mobile = self.device_type in ['mobile', 'tablet']
        
        self.current_season = self._get_current_season()
        self.current_events = self._get_current_events()
        
    def recommend_places(self, limit=None, filters=None, boost_user_preferences=True, 
                         location_aware=True, diversity_factor=0.2):
        """
        Recommend places to the user with enhanced personalization
        
        Args:
            limit (int, optional): Maximum number of recommendations to return.
            filters (dict): Additional filters to apply to the query
            boost_user_preferences (bool): Whether to boost based on user preferences
            location_aware (bool): Whether to consider user's location
            diversity_factor (float): How much to diversify results (0-1)
            
        Returns:
            QuerySet: A queryset of recommended places with scores
        """
        try:
            if not self.is_authenticated:
                cache_key = self._get_cache_key('places', filters, limit)
                cached_results = cache.get(cache_key)
                if cached_results is not None:
                    return cached_results
            
            filters = filters or {}
            query = self._get_base_place_query(filters)
            
            query = self._initialize_scoring_fields(query)
            
            if self.is_authenticated:
                self._build_feature_matrices('place')
                
                if self.user_item_matrix is not None and self.svd_model is not None:
                    query = self._apply_matrix_factorization(query, 'place')
                
                if boost_user_preferences:
                    query = self._apply_preference_boosting(query)
                
                if self.item_features is not None:
                    query = self._apply_content_based_filtering(query, 'place')
                
                query = self._apply_collaborative_filtering(query, 'place')
                
                # Apply temporal and contextual factors
                query = self._apply_temporal_popularity(query)
                query = self._boost_user_interactions(query, 'place')
                
                # Apply location awareness if requested
                if location_aware and self.user_location:
                    query = self._apply_location_boost(query)
                
                # Apply seasonal and trending boosts
                query = self._apply_seasonal_boost(query)
                query = self._apply_trending_boost(query)
                
                # Apply device-specific optimizations
                query = self._optimize_for_device(query)
                
                # Calculate final score with all factors
                query = self._calculate_total_score(query)
                
                # Apply diversity to avoid too similar results
                results = self._apply_diversity(query, diversity_factor)
                
                if limit is not None:
                    results = results[:limit]
            else:
                # Anonymous recommendations
                results = self._get_anonymous_recommendations(query, 'place', limit)
                
                cache_key = self._get_cache_key('places', filters, limit)
                cache.set(cache_key, results, self.GLOBAL_CACHE_TTL)
            
            # Log recommendations for analytics
            self._log_recommendations(results, 'place')
            
            return results
            
        except Exception as e:
            logger.error(f"Error recommending places: {str(e)}", exc_info=True)
            return self._fallback_recommendations('place', filters, limit)
    
    def recommend_experiences(self, limit=None, filters=None, location_aware=True):
        """
        Recommend experiences with enhanced personalization
        
        Args:
            limit (int): Maximum number of recommendations
            filters (dict): Additional filters
            location_aware (bool): Whether to consider user's location
            
        Returns:
            QuerySet: Recommended experiences
        """
        try:
            if not self.is_authenticated:
                cache_key = self._get_cache_key('experiences', filters, limit)
                cached_results = cache.get(cache_key)
                if cached_results is not None:
                    return cached_results
            
            filters = filters or {}
            
            # Handle location filters
            location_filters = {}
            for loc_key in ['country', 'region', 'city']:
                if loc_key in filters:
                    location_filters[f'place__{loc_key}'] = filters.pop(loc_key)
            
            query = self._get_base_experience_query(filters, location_filters)
            
            # Initialize scoring fields
            query = self._initialize_scoring_fields(query)
            
            if self.is_authenticated:
                # Apply machine learning based recommendations
                self._build_feature_matrices('experience')
                
                if self.user_item_matrix is not None and self.svd_model is not None:
                    query = self._apply_matrix_factorization(query, 'experience')
                
                query = self._apply_preference_boosting(query)
                
                if self.item_features is not None:
                    query = self._apply_content_based_filtering(query, 'experience')
                
                query = self._apply_collaborative_filtering(query, 'experience')
                
                # Apply temporal and contextual factors
                query = self._apply_temporal_popularity(query)
                query = self._boost_user_interactions(query, 'experience')
                
                # Apply location awareness if requested
                if location_aware and self.user_location:
                    query = self._apply_location_boost(query, 'experience')
                
                # Apply seasonal and trending boosts
                query = self._apply_seasonal_boost(query, 'experience')
                query = self._apply_trending_boost(query, 'experience')
                
                # Apply device-specific optimizations
                query = self._optimize_for_device(query, 'experience')
                
                # Calculate final score with all factors
                query = self._calculate_total_score(query, 'experience')
                
                results = query.order_by('-total_score')
                
                if limit is not None:
                    results = results[:limit]
            else:
                # Anonymous recommendations
                results = self._get_anonymous_recommendations(query, 'experience', limit)
                
                cache_key = self._get_cache_key('experiences', filters, limit)
                cache.set(cache_key, results, self.GLOBAL_CACHE_TTL)
            
            # Log recommendations for analytics
            self._log_recommendations(results, 'experience')
            
            return results
            
        except Exception as e:
            logger.error(f"Error recommending experiences: {str(e)}", exc_info=True)
            return self._fallback_recommendations('experience', filters, limit)
    
    def recommend_for_box(self, destination, duration_days, limit_per_category=3, 
                          user_interests=None, budget=None):
        """
        Recommend items for a travel box with enhanced personalization
        
        Args:
            destination: The destination (City, Region, or Country)
            duration_days: Number of days for the trip
            limit_per_category: Maximum number of items per category
            user_interests: Specific interests to focus on
            budget: Budget constraints for recommendations
            
        Returns:
            dict: Dictionary of recommended items by category
        """
        try:
            destination_filters = self._create_destination_filters(destination)
            
            # Adjust recommendations based on trip duration
            adjusted_limit = max(3, int(limit_per_category * (duration_days / 3)))
            
            # Get places with budget consideration if provided
            place_filters = destination_filters.copy()
            if budget and budget.get('max_per_place'):
                place_filters['price__lte'] = budget.get('max_per_place')
                
            places = self.recommend_places(
                limit=adjusted_limit * 3,
                filters=place_filters
            )
            
            # Get experiences with budget consideration if provided
            exp_filters = destination_filters.copy()
            if budget and budget.get('max_per_experience'):
                exp_filters['price_per_person__lte'] = budget.get('max_per_experience')
                
            experiences = self.recommend_experiences(
                limit=adjusted_limit * 2,
                filters=exp_filters
            )
            
            # Organize by categories for better box creation
            categorized_places = self._categorize_recommendations(places)
            categorized_experiences = self._categorize_recommendations(experiences)
            
            # Balance recommendations based on duration
            balanced_recommendations = self._balance_recommendations_for_duration(
                categorized_places, 
                categorized_experiences,
                duration_days
            )
            
            return balanced_recommendations
            
        except Exception as e:
            logger.error(f"Error recommending for box: {str(e)}", exc_info=True)
            return {'places': [], 'experiences': []}
    
    def _get_base_place_query(self, filters):
        """Get base query for places with optimized joins"""
        return Place.objects.filter(
            is_available=True,
            is_deleted=False,
            **filters
        ).select_related('category', 'country', 'city', 'region')
    
    def _get_base_experience_query(self, filters, location_filters):
        """Get base query for experiences with optimized joins"""
        return Experience.objects.filter(
            is_deleted=False,
            **location_filters,
            **filters
        ).select_related('category', 'place', 'owner')
    
    def _initialize_scoring_fields(self, query):
        """Initialize all scoring fields with default values"""
        return query.annotate(
            ml_score=Value(0.0, FloatField()),
            similarity_score=Value(0.0, FloatField()),
            personalization_score=Value(0.0, FloatField()),
            interaction_boost=Value(0.0, FloatField()),
            recent_popularity=Value(0.0, FloatField()),
            location_score=Value(0.0, FloatField()),
            seasonal_score=Value(0.0, FloatField()),
            trending_score=Value(0.0, FloatField()),
            device_optimization=Value(0.0, FloatField())
        )
    
    def _calculate_total_score(self, query, item_type='place'):
        """Calculate the final score with weighted factors"""
        # Adjust weights based on item type and user context
        weights = self._get_score_weights(item_type)
        
        # Create the weighted sum expression
        weighted_sum = ExpressionWrapper(
            F('ml_score') * Value(weights['ml_score']) +
            F('similarity_score') * Value(weights['similarity_score']) +
            F('personalization_score') * Value(weights['personalization_score']) +
            F('interaction_boost') * Value(weights['interaction_boost']) +
            F('recent_popularity') * Value(weights['recent_popularity']) +
            F('location_score') * Value(weights['location_score']) +
            F('seasonal_score') * Value(weights['seasonal_score']) +
            F('trending_score') * Value(weights['trending_score']) +
            F('device_optimization') * Value(weights['device_optimization']) +
            F('rating') * Value(weights['rating']),
            output_field=FloatField()
        )
        
        return query.annotate(total_score=weighted_sum)
    
    def _get_score_weights(self, item_type):
        """Get score weights based on item type and user context"""
        # Default weights
        weights = {
            'ml_score': 0.25,
            'similarity_score': 0.15,
            'personalization_score': 0.15,
            'interaction_boost': 0.10,
            'recent_popularity': 0.10,
            'location_score': 0.10,
            'seasonal_score': 0.05,
            'trending_score': 0.05,
            'device_optimization': 0.02,
            'rating': 0.03
        }
        
        # Adjust weights based on user context
        if self.is_authenticated and self.profile:
            # If user has strong preferences, boost personalization
            if hasattr(self.profile, 'travel_interests') and self.profile.travel_interests:
                weights['personalization_score'] += 0.05
                weights['ml_score'] -= 0.05
            
            # If user has many interactions, boost ML score
            interaction_count = getattr(self.user, 'interactions', []).count()
            if interaction_count > 50:
                weights['ml_score'] += 0.05
                weights['recent_popularity'] -= 0.05
        
        # Adjust for location awareness
        if self.user_location:
            weights['location_score'] += 0.05
            weights['ml_score'] -= 0.05
        
        # Adjust for mobile devices
        if self.is_mobile:
            weights['device_optimization'] += 0.03
            weights['similarity_score'] -= 0.03
        
        # Normalize weights to ensure they sum to 1
        total = sum(weights.values())
        return {k: v/total for k, v in weights.items()}
    
    def _apply_location_boost(self, query, item_type='place'):
        """Boost items based on proximity to user's location"""
        if not self.user_location:
            return query
        
        try:
            # For places, use direct location comparison
            if item_type == 'place':
                return query.annotate(
                    distance=Distance('location', self.user_location),
                    location_score=Case(
                        When(distance__lte=10000, then=0.9),  # Within 10km
                        When(distance__lte=50000, then=0.7),  # Within 50km
                        When(distance__lte=100000, then=0.5), # Within 100km
                        When(distance__lte=500000, then=0.3), # Within 500km
                        default=0.1,
                        output_field=FloatField()
                    )
                )
            # For experiences, use place location
            elif item_type == 'experience':
                return query.annotate(
                    distance=Distance('place__location', self.user_location),
                    location_score=Case(
                        When(distance__lte=10000, then=0.9),
                        When(distance__lte=50000, then=0.7),
                        When(distance__lte=100000, then=0.5),
                        When(distance__lte=500000, then=0.3),
                        default=0.1,
                        output_field=FloatField()
                    )
                )
            
            return query
            
        except Exception as e:
            logger.error(f"Error applying location boost: {str(e)}", exc_info=True)
            return query.annotate(location_score=Value(0.0, FloatField()))
    
    def _apply_seasonal_boost(self, query, item_type='place'):
        """Boost items based on seasonal relevance"""
        try:
            # Get current season tags
            season_tags = self._get_season_tags()
            
            if not season_tags:
                return query
            
            # Boost items with metadata tags matching current season
            return query.annotate(
                seasonal_score=Case(
                    When(metadata__tags__overlap=season_tags, then=0.8),
                    default=0.2,
                    output_field=FloatField()
                )
            )
            
        except Exception as e:
            logger.error(f"Error applying seasonal boost: {str(e)}", exc_info=True)
            return query
    
    def _apply_trending_boost(self, query, item_type='place'):
        """Boost items that are currently trending"""
        try:
            # Get trending items from the last 7 days
            content_type = ContentType.objects.get_for_model(
                Place if item_type == 'place' else Experience
            )
            
            trending_items = UserInteraction.objects.filter(
                content_type=content_type,
                created_at__gte=datetime.now() - timedelta(days=7)
            ).values('object_id').annotate(
                interaction_count=Count('id')
            ).filter(
                interaction_count__gte=5  # Minimum interactions to be considered trending
            ).values_list('object_id', flat=True)
            
            if not trending_items:
                return query
            
            # Boost trending items
            return query.annotate(
                trending_score=Case(
                    When(id__in=trending_items, then=0.9),
                    default=0.1,
                    output_field=FloatField()
                )
            )
            
        except Exception as e:
            logger.error(f"Error applying trending boost: {str(e)}", exc_info=True)
            return query
    
    def _optimize_for_device(self, query, item_type='place'):
        """Apply device-specific optimizations"""
        try:
            if not self.device_type:
                return query
            
            # For mobile devices, prioritize items with better mobile experience
            if self.is_mobile:
                return query.annotate(
                    device_optimization=Case(
                        # Prioritize items with mobile-friendly content
                        When(metadata__mobile_friendly=True, then=0.9),
                        # Prioritize items with fewer images for faster loading
                        When(media__count__lte=3, then=0.7),
                        default=0.3,
                        output_field=FloatField()
                    )
                )
            
            # For desktop, can prioritize items with rich media
            return query.annotate(
                device_optimization=Case(
                    When(media__count__gte=5, then=0.8),
                    default=0.5,
                    output_field=FloatField()
                )
            )
            
        except Exception as e:
            logger.error(f"Error optimizing for device: {str(e)}", exc_info=True)
            return query
    
    def _apply_diversity(self, query, diversity_factor=0.2):
        """Apply diversity to avoid too similar results"""
        try:
            if diversity_factor <= 0:
                return query.order_by('-total_score')
            
            # Get top results first
            top_results = list(query.order_by('-total_score')[:50])
            
            if not top_results or len(top_results) <= 5:
                return query.order_by('-total_score')
            
            # Initialize result list with the top item
            diversified_results = [top_results[0]]
            remaining_items = top_results[1:]
            
            # Add items that are different from already selected items
            while remaining_items and len(diversified_results) < len(top_results):
                # Find the most diverse item from remaining items
                most_diverse_item = None
                max_diversity_score = -1
                
                for item in remaining_items:
                    # Calculate diversity as average difference from already selected items
                    diversity_score = self._calculate_diversity_score(item, diversified_results)
                    
                    # Combine diversity with original score
                    combined_score = (1 - diversity_factor) * item.total_score + diversity_factor * diversity_score
                    
                    if combined_score > max_diversity_score:
                        max_diversity_score = combined_score
                        most_diverse_item = item
                
                if most_diverse_item:
                    diversified_results.append(most_diverse_item)
                    remaining_items.remove(most_diverse_item)
                else:
                    break
            
            # Create a Case expression to order by the new diversified order
            preserved_order = Case(
                *[When(pk=obj.pk, then=pos) for pos, obj in enumerate(diversified_results)],
                default=len(diversified_results),
                output_field=models.IntegerField()
            )
            
            # Apply the ordering to the original queryset
            item_ids = [item.id for item in diversified_results]
            return query.filter(id__in=item_ids).order_by(preserved_order)
            
        except Exception as e:
            logger.error(f"Error applying diversity: {str(e)}", exc_info=True)
            return query.order_by('-total_score')
    
    def _calculate_diversity_score(self, item, selected_items):
        """Calculate how diverse an item is compared to already selected items"""
        if not selected_items:
            return 1.0
        
        # Calculate diversity based on category and location
        diversity_scores = []
        
        for selected_item in selected_items:
            score = 0.0
            
            # Different category is diverse
            if hasattr(item, 'category') and hasattr(selected_item, 'category'):
                if item.category != selected_item.category:
                    score += 0.5
            
            # Different location is diverse
            if hasattr(item, 'country') and hasattr(selected_item, 'country'):
                if item.country != selected_item.country:
                    score += 0.3
            
            # Different price range is diverse
            if hasattr(item, 'price') and hasattr(selected_item, 'price'):
                price_diff = abs(float(item.price) - float(selected_item.price))
                normalized_diff = min(1.0, price_diff / 100.0)
                score += normalized_diff * 0.2
            
            diversity_scores.append(score)
        
        # Return average diversity score
        return sum(diversity_scores) / len(diversity_scores)
    
    def _categorize_recommendations(self, items):
        """Organize recommendations by category for better box creation"""
        categorized = {}
        
        for item in items:
            if not hasattr(item, 'category') or not item.category:
                continue
                
            category_name = item.category.name
            if category_name not in categorized:
                categorized[category_name] = []
                
            categorized[category_name].append(item)
        
        return categorized
    
    def _balance_recommendations_for_duration(self, places, experiences, duration_days):
        """Balance recommendations based on trip duration"""
        # Calculate how many items to include based on duration
        places_per_day = 2
        experiences_per_day = 1
        
        total_places = places_per_day * duration_days
        total_experiences = experiences_per_day * duration_days
        
        # Select top items from each category
        selected_places = []
        selected_experiences = []
        
        # Distribute places across categories
        place_categories = list(places.keys())
        places_per_category = max(1, total_places // len(place_categories)) if place_categories else 0
        
        for category in place_categories:
            selected_places.extend(places[category][:places_per_category])
        
        # Fill remaining slots with top-rated places
        remaining_places = total_places - len(selected_places)
        if remaining_places > 0:
            all_places = [p for sublist in places.values() for p in sublist]
            all_places.sort(key=lambda x: x.rating, reverse=True)
            
            # Exclude already selected places
            additional_places = [p for p in all_places if p not in selected_places][:remaining_places]
            selected_places.extend(additional_places)
        
        # Distribute experiences across categories
        exp_categories = list(experiences.keys())
        exps_per_category = max(1, total_experiences // len(exp_categories)) if exp_categories else 0
        
        for category in exp_categories:
            selected_experiences.extend(experiences[category][:exps_per_category])
        
        # Fill remaining slots with top-rated experiences
        remaining_exps = total_experiences - len(selected_experiences)
        if remaining_exps > 0:
            all_exps = [e for sublist in experiences.values() for e in sublist]
            all_exps.sort(key=lambda x: x.rating, reverse=True)
            
            # Exclude already selected experiences
            additional_exps = [e for e in all_exps if e not in selected_experiences][:remaining_exps]
            selected_experiences.extend(additional_exps)
        
        return {
            'places': selected_places,
            'experiences': selected_experiences,
            'days': duration_days
        }
    
    def _get_user_location(self):
        """Get user's location from profile or request context"""
        if self.is_authenticated and self.profile and hasattr(self.profile, 'location'):
            return self.profile.location
        
        # Try to get location from request context
        if self.request_context and 'location' in self.request_context:
            return self.request_context['location']
        
        return None
    
    def _get_current_season(self):
        """Determine current season based on date and location"""
        now = datetime.now()
        month = now.month
        
        # Default to northern hemisphere seasons
        if 3 <= month <= 5:
            return 'spring'
        elif 6 <= month <= 8:
            return 'summer'
        elif 9 <= month <= 11:
            return 'autumn'
        else:
            return 'winter'
    
    def _get_season_tags(self):
        """Get tags related to current season"""
        season = self._get_current_season()
        
        season_tags = {
            'spring': ['spring', 'blossom', 'garden', 'hiking', 'outdoor'],
            'summer': ['summer', 'beach', 'swimming', 'festival', 'vacation'],
            'autumn': ['autumn', 'fall', 'foliage', 'harvest', 'cozy'],
            'winter': ['winter', 'snow', 'skiing', 'holiday', 'christmas']
        }
        
        return season_tags.get(season, [])
    
    def _get_current_events(self):
        """Get current events that might influence recommendations"""
        # This would typically connect to an events database or API
        # For now, return a placeholder
        return []
    
    def _log_recommendations(self, results, item_type):
        """Log recommendations for analytics"""
        if not self.is_authenticated or not results:
            return
            
        try:
            from apps.authentication.models import UserInteraction
            
            # Log only the top 10 recommendations
            top_items = results[:10]
            
            for position, item in enumerate(top_items):
                UserInteraction.log_interaction(
                    user=self.user,
                    content_object=item,
                    interaction_type_code='recommendation_shown',
                    position=position,
                    item_type=item_type,
                    recommendation_context={
                        'device': self.device_type,
                        'location_aware': self.user_location is not None,
                        'timestamp': datetime.now().isoformat()
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to log recommendations: {str(e)}")
    
    def _fallback_recommendations(self, item_type, filters, limit):
        """Provide fallback recommendations when ML methods fail"""
        try:
            filters = filters or {}
            
            if item_type == 'place':
                model_class = Place
                location_filters = {k: v for k, v in filters.items() 
                                  if k in ['country', 'region', 'city']}
                for k in location_filters.keys():
                    if k in filters:
                        filters.pop(k)
            else:  # experience
                model_class = Experience
                location_filters = {}
                for loc_key in ['country', 'region', 'city']:
                    if loc_key in filters:
                        location_filters[f'place__{loc_key}'] = filters.pop(loc_key)
            
            # Basic query with location filters
            queryset = model_class.objects.filter(
                is_available=True,
                is_deleted=False,
                **location_filters
            )
            
            # Apply user preferences if available
            if self.is_authenticated and hasattr(self, 'profile'):
                if hasattr(self.profile, 'preferred_countries') and self.profile.preferred_countries.exists():
                    if item_type == 'experience':
                        queryset = queryset.filter(place__country__in=self.profile.preferred_countries.all())
                    else:
                        queryset = queryset.filter(country__in=self.profile.preferred_countries.all())
            
            # Return top rated items
            return queryset.order_by('-rating')[:limit or 10]
            
        except Exception as e:
            logger.error(f"Fallback recommendation failed: {str(e)}", exc_info=True)
            
            # Last resort fallback
            if item_type == 'place':
                return Place.objects.filter(is_available=True, is_deleted=False).order_by('-rating')[:limit or 10]
            else:
                return Experience.objects.filter(is_available=True, is_deleted=False).order_by('-rating')[:limit or 10]

# Example usage:
def example_usage():
    # Initialize with user and request context
    user = User.objects.get(id=1)  # Replace with actual user
    
    request_context = {
        'ip': '192.168.1.1',
        'device_type': 'mobile',
        'location': None, 
        'referrer': 'search'
    }
    
    engine = EnhancedRecommendationEngine(user, request_context)
    
    place_recommendations = engine.recommend_places(
        limit=10,
        filters={'category__name': 'Hotel'},
        location_aware=True
    )
    
    experience_recommendations = engine.recommend_experiences(
        limit=5,
        filters={'price_per_person__lte': 100}
    )
    
    from apps.geographic_data.models import City
    destination = City.objects.get(name='Paris')
    
    box_recommendations = engine.recommend_for_box(
        destination=destination,
        duration_days=5,
        budget={'max_per_place': 200, 'max_per_experience': 100}
    )
    
    return {
        'places': place_recommendations,
        'experiences': experience_recommendations,
        'box': box_recommendations
    }
