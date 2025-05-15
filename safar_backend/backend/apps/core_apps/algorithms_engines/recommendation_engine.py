import logging
from typing import Dict, List, Optional, Any
from django.db.models import QuerySet,Q, F, Value, Case, When, FloatField, Count, Subquery, OuterRef, IntegerField
from django.db.models.functions import Coalesce
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta

from apps.authentication.models import User, UserInteraction
from apps.safar.models import Place, Experience

logger = logging.getLogger(__name__)

class RecommendationContext:
    """
    Context object that encapsulates all information needed for recommendations.
    This centralizes the context data needed by different recommendation strategies.
    """
    def __init__(
        self, 
        user: Optional[User] = None,
        request_data: Optional[Dict] = None,
        location: Optional[Point] = None,
        device_type: str = 'desktop',
        filters: Optional[Dict] = None,
        limit: int = 10,
        offset: int = 0
    ):
        self.user = user
        self.is_authenticated = user is not None and user.is_authenticated
        self.request_data = request_data or {}
        self.location = location
        self.device_type = device_type
        self.is_mobile = device_type in ['mobile', 'tablet']
        self.filters = filters or {}
        self.limit = limit
        self.offset = offset
        self.current_season = self._get_current_season()
    
        self.cache_prefix = f"rec_{self._get_cache_key_base()}"
        
    def _get_current_season(self) -> str:
        """Determine current season based on date"""
        now = datetime.now()
        month = now.month
        
        if 3 <= month <= 5:
            return 'spring'
        elif 6 <= month <= 8:
            return 'summer'
        elif 9 <= month <= 11:
            return 'autumn'
        else:
            return 'winter'
    
    def _get_cache_key_base(self) -> str:
        """Generate a base cache key from context"""
        user_part = f"user_{self.user.id}" if self.is_authenticated else "anon"

        device_part = f"dev_{self.device_type}"
        
        loc_part = ""
        if self.location:
            lat = round(self.location.y, 2)
            lng = round(self.location.x, 2)
            loc_part = f"loc_{lat}_{lng}"
        
        return f"{user_part}_{device_part}_{loc_part}"
    
    def get_cache_key(self, rec_type: str, params: Dict = None) -> str:
        """Generate a specific cache key for a recommendation type"""
        key = f"{self.cache_prefix}_{rec_type}"
        
        if params:
            param_str = "_".join(f"{k}_{v}" for k, v in sorted(params.items()))
            key = f"{key}_{param_str}"
            
        key = f"{key}_l{self.limit}_o{self.offset}"
        
        return key
    
    def get_user_profile(self) -> Optional[Any]:
        """Get user profile if available"""
        if self.is_authenticated and hasattr(self.user, 'profile'):
            return self.user.profile
        return None


class RecommendationStrategy:
    """Base strategy interface for recommendation algorithms"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """
        Get recommendations based on the strategy and context
        
        Args:
            context: The recommendation context
            item_type: 'place' or 'experience'
            
        Returns:
            QuerySet of recommended items
        """
        raise NotImplementedError("Subclasses must implement get_recommendations")
    
    def _get_base_query(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get the base query for the item type with filters applied"""
        filters = context.filters.copy()
        
        if item_type == 'place':
            query = Place.objects.filter(
                is_available=True,
                is_deleted=False,
                **filters
            ).select_related('category', 'country', 'city', 'region')
        else: 
            location_filters = {}
            for loc_key in ['country', 'region', 'city']:
                if loc_key in filters:
                    location_filters[f'place__{loc_key}'] = filters.pop(loc_key)
            
            query = Experience.objects.filter(
                is_available=True,
                is_deleted=False,
                **location_filters,
                **filters
            ).select_related('category', 'place', 'owner')
        
        return query
    
    def _initialize_scoring_fields(self, query: QuerySet) -> QuerySet:
        """Initialize scoring fields with default values"""
        return query.annotate(
            ml_score=Value(0.0, FloatField()),
            similarity_score=Value(0.0, FloatField()),
            personalization_score=Value(0.0, FloatField()),
            interaction_boost=Value(0.0, FloatField()),
            recent_popularity=Value(0.0, FloatField()),
            location_score=Value(0.0, FloatField()),
            seasonal_score=Value(0.0, FloatField()),
            trending_score=Value(0.0, FloatField()),
            device_optimization=Value(0.0, FloatField()),
            total_score=Value(0.0, FloatField())
        )


class PersonalizedRecommendationStrategy(RecommendationStrategy):
    """Strategy for personalized recommendations based on user preferences and behavior"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get personalized recommendations"""
        if context.is_authenticated:
            cache_key = context.get_cache_key(f"personalized_{item_type}")
            cached_results = cache.get(cache_key)
            if cached_results is not None:
                return cached_results
        

        query = self._get_base_query(context, item_type)
        
        # Initialize scoring fields
        query = self._initialize_scoring_fields(query)
        
        # Apply personalization if user is authenticated
        if context.is_authenticated:
            # Apply user preference boosting
            query = self._apply_preference_boosting(query, context)
            
            # Apply interaction boosting
            query = self._apply_interaction_boost(query, context, item_type)
        
        # Apply common enhancements for all users
        query = self._apply_popularity_boost(query)
        query = self._apply_rating_boost(query)
        
        # Apply location boost if location is available
        if context.location:
            query = self._apply_location_boost(query, context, item_type)
        
        # Apply seasonal boost
        query = self._apply_seasonal_boost(query, context)
        
        # Apply device optimization
        query = self._apply_device_optimization(query, context)
        
        # Calculate final score
        query = self._calculate_total_score(query, context)
        
        # Order by total score and apply limit/offset
        results = query.order_by('-total_score')[context.offset:context.offset + context.limit]
        
        # Cache results for authenticated users
        if context.is_authenticated:
            cache_key = context.get_cache_key(f"personalized_{item_type}")
            cache.set(cache_key, results, 1800)  # 30 minutes
        
        return results
    
    def _apply_preference_boosting(self, query: QuerySet, context: RecommendationContext) -> QuerySet:
        """Boost items based on user preferences"""
        profile = context.get_user_profile()
        if not profile:
            return query
        
        # Check if user has travel interests
        travel_interests = getattr(profile, 'travel_interests', [])
        if not travel_interests:
            return query
        
        # Boost items with matching categories
        return query.annotate(
            personalization_score=Case(
                When(category__name__in=travel_interests, then=0.9),
                default=0.1,
                output_field=FloatField()
            )
        )
    
    def _apply_interaction_boost(self, query: QuerySet, context: RecommendationContext, item_type: str) -> QuerySet:
        """Boost items based on user's past interactions"""
        if not context.is_authenticated:
            return query
        
        try:
            # Get content type for the item type
            from django.contrib.contenttypes.models import ContentType
            content_type = ContentType.objects.get_for_model(
                Place if item_type == 'place' else Experience
            )
            
            # Get user's interactions from the last 90 days
            cutoff_date = timezone.now() - timedelta(days=90)
            interactions = UserInteraction.objects.filter(
                user=context.user,
                content_type=content_type,
                created_at__gte=cutoff_date
            )
            
            # If no interactions, return query as is
            if not interactions.exists():
                return query
            
            # Get interaction weights
            interaction_weights = {
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
            
            # Get items user has interacted with and their weights
            interaction_items = {}
            for interaction in interactions:
                item_id = interaction.object_id
                interaction_type = interaction.interaction_type.code
                weight = interaction_weights.get(interaction_type, 0.2)
                
                # Apply temporal decay (more recent = higher weight)
                days_ago = (timezone.now() - interaction.created_at).days
                temporal_factor = max(0.1, 1.0 - (days_ago * 0.01))  # 1% decay per day
                
                # Update weight for this item
                if item_id in interaction_items:
                    interaction_items[item_id] = max(interaction_items[item_id], weight * temporal_factor)
                else:
                    interaction_items[item_id] = weight * temporal_factor
            
            # Create a Case expression to boost items based on interaction weights
            when_clauses = []
            for item_id, weight in interaction_items.items():
                when_clauses.append(When(id=item_id, then=Value(weight)))
            
            # Apply the Case expression
            if when_clauses:
                return query.annotate(
                    interaction_boost=Case(
                        *when_clauses,
                        default=Value(0.0),
                        output_field=FloatField()
                    )
                )
            
            return query
            
        except Exception as e:
            logger.error(f"Error applying interaction boost: {str(e)}", exc_info=True)
            return query
    
    def _apply_popularity_boost(self, query):
        """Boost items based on overall popularity"""
        try:
            # Check if the model has a 'metadata' field with popularity information
            return query.annotate(
                recent_popularity=Case(
                    # Use metadata__popularity if available
                    When(metadata__has_key='popularity', then=Case(
                        When(metadata__popularity__gte=1000, then=Value(0.9)),
                        When(metadata__popularity__gte=500, then=Value(0.7)),
                        When(metadata__popularity__gte=100, then=Value(0.5)),
                        When(metadata__popularity__gte=50, then=Value(0.3)),
                        default=Value(0.1),
                        output_field=FloatField()
                    )),
                    # Fallback to rating as a proxy for popularity
                    default=Case(
                        When(rating__gte=4.5, then=Value(0.9)),
                        When(rating__gte=4.0, then=Value(0.7)),
                        When(rating__gte=3.5, then=Value(0.5)),
                        When(rating__gte=3.0, then=Value(0.3)),
                        default=Value(0.1),
                        output_field=FloatField()
                    ),
                    output_field=FloatField()
                )
            )
        except Exception as e:
            logger.error(f"Error applying popularity boost: {str(e)}", exc_info=True)
            # Return query with default popularity value if there's an error
            return query.annotate(recent_popularity=Value(0.5, FloatField()))
    
    def _apply_rating_boost(self, query: QuerySet) -> QuerySet:
        """Boost items based on rating"""
        return query.annotate(
            rating_boost=Case(
                When(rating__gte=4.5, then=0.9),
                When(rating__gte=4.0, then=0.7),
                When(rating__gte=3.5, then=0.5),
                When(rating__gte=3.0, then=0.3),
                default=0.1,
                output_field=FloatField()
            )
        )
    
    def _apply_location_boost(self, query: QuerySet, context: RecommendationContext, item_type: str) -> QuerySet:
        """Boost items based on proximity to user's location"""
        if not context.location:
            return query
        
        try:
            # For places, use direct location comparison
            if item_type == 'place':
                return query.annotate(
                    distance=Distance('location', context.location),
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
                    distance=Distance('place__location', context.location),
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
            return query
    
    def _apply_seasonal_boost(self, query: QuerySet, context: RecommendationContext) -> QuerySet:
        """Boost items based on seasonal relevance"""
        try:
            # Get current season tags
            season_tags = self._get_season_tags(context.current_season)
            
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
    
    def _get_season_tags(self, season: str) -> List[str]:
        """Get tags related to current season"""
        season_tags = {
            'spring': ['spring', 'blossom', 'garden', 'hiking', 'outdoor'],
            'summer': ['summer', 'beach', 'swimming', 'festival', 'vacation'],
            'autumn': ['autumn', 'fall', 'foliage', 'harvest', 'cozy'],
            'winter': ['winter', 'snow', 'skiing', 'holiday', 'christmas']
        }
        
        return season_tags.get(season, [])
    
    def _apply_device_optimization(self, query, device_type):
        """
        Optimize recommendations based on device type.
        
        For mobile devices, prioritize items with:
        - Fewer images (lighter to load)
        - Higher mobile_friendly rating
        - More compact descriptions
        
        For desktop, prioritize items with:
        - More detailed content
        - Higher quality images
        """
        try:
            if not device_type or device_type not in ['mobile', 'tablet', 'desktop']:
                return query
                
            from apps.geographic_data.models import Media
            
            media_count_subquery = Subquery(
                Media.objects.filter(
                    content_type=OuterRef('content_type'),
                    object_id=OuterRef('id')
                )
                .values('object_id')
                .annotate(count=Count('id'))
                .values('count'),
                output_field=IntegerField()
            )
            
            query = query.annotate(media_count=Coalesce(media_count_subquery, Value(0)))
            
            return query.annotate(
                device_optimization=Case(
                    When(Q(device_type='mobile'), then=Case(
                        When(media_count__lte=3, then=Value(0.8)),
                        When(media_count__lte=5, then=Value(0.6)),
                        When(media_count__lte=8, then=Value(0.4)),
                        default=Value(0.2),
                        output_field=FloatField()
                    )),
                    When(Q(device_type='tablet'), then=Case(
                        When(media_count__lte=5, then=Value(0.7)),
                        When(media_count__lte=8, then=Value(0.6)),
                        When(media_count__lte=12, then=Value(0.4)),
                        default=Value(0.3),
                        output_field=FloatField()
                    )),
                    default=Case(
                        When(media_count__gte=8, then=Value(0.8)),
                        When(media_count__gte=5, then=Value(0.6)),
                        When(media_count__gte=3, then=Value(0.4)),
                        default=Value(0.2),
                        output_field=FloatField()
                    ),
                    output_field=FloatField()
                )
            )
        except Exception as e:
            # Log the error but don't break the query
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error optimizing for device: {str(e)}", exc_info=True)
            return query
    
    def _calculate_total_score(self, query: QuerySet, context: RecommendationContext) -> QuerySet:
        """Calculate the final score with weighted factors"""
        # Get weights based on user context
        weights = self._get_score_weights(context)
        
        # Create the weighted sum expression
        return query.annotate(
            total_score=F('personalization_score') * weights['personalization_score'] +
                       F('interaction_boost') * weights['interaction_boost'] +
                       F('recent_popularity') * weights['recent_popularity'] +
                       F('location_score') * weights['location_score'] +
                       F('seasonal_score') * weights['seasonal_score'] +
                       F('device_optimization') * weights['device_optimization'] +
                       F('rating') * weights['rating']
        )
    
    def _get_score_weights(self, context: RecommendationContext) -> Dict[str, float]:
        """Get score weights based on user context"""
        # Default weights
        weights = {
            'personalization_score': 0.15,
            'interaction_boost': 0.15,
            'recent_popularity': 0.15,
            'location_score': 0.15,
            'seasonal_score': 0.10,
            'device_optimization': 0.05,
            'rating': 0.25
        }
        
        # Adjust weights based on user context
        if context.is_authenticated:
            profile = context.get_user_profile()
            if profile:
                # If user has strong preferences, boost personalization
                if hasattr(profile, 'travel_interests') and profile.travel_interests:
                    weights['personalization_score'] += 0.05
                    weights['recent_popularity'] -= 0.05
        
        # Adjust for location awareness
        if context.location:
            weights['location_score'] += 0.05
            weights['seasonal_score'] -= 0.05
        
        # Adjust for mobile devices
        if context.is_mobile:
            weights['device_optimization'] += 0.05
            weights['personalization_score'] -= 0.05
        
        # Normalize weights to ensure they sum to 1
        total = sum(weights.values())
        return {k: v/total for k, v in weights.items()}


class TrendingRecommendationStrategy(RecommendationStrategy):
    """Strategy for trending recommendations based on recent popularity"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get trending recommendations"""
        # Check cache for all users
        cache_key = context.get_cache_key(f"trending_{item_type}")
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results
        
        # Get base query with filters
        query = self._get_base_query(context, item_type)
        
        # Apply trending boost
        query = self._apply_trending_boost(query, item_type)
        
        # Order by trending score and apply limit/offset
        results = query.order_by('-trending_score')[context.offset:context.offset + context.limit]
        
        # Cache results
        cache.set(cache_key, results, 3600)  # 1 hour
        
        return results
    
    def _apply_trending_boost(self, query: QuerySet, item_type: str) -> QuerySet:
        """Boost items that are currently trending"""
        try:
            # Get trending items from the last 7 days
            from django.contrib.contenttypes.models import ContentType
            content_type = ContentType.objects.get_for_model(
                Place if item_type == 'place' else Experience
            )
            
            # Get cutoff date (7 days ago)
            cutoff_date = timezone.now() - timedelta(days=7)
            
            # Get interaction counts for items
            from django.db.models import Count
            trending_items = UserInteraction.objects.filter(
                content_type=content_type,
                created_at__gte=cutoff_date
            ).values('object_id').annotate(
                interaction_count=Count('id')
            ).filter(
                interaction_count__gte=5  # Minimum interactions to be considered trending
            ).order_by('-interaction_count')
            
            # Extract item IDs and counts
            trending_map = {str(item['object_id']): item['interaction_count'] for item in trending_items}
            
            if not trending_map:
                # If no trending items, fall back to recent items
                return query.annotate(
                    trending_score=Case(
                        When(created_at__gte=cutoff_date, then=0.7),
                        default=0.3,
                        output_field=FloatField()
                    )
                )
            
            # Create a Case expression to boost items based on trending score
            when_clauses = []
            max_count = max(trending_map.values()) if trending_map else 1
            
            for item_id, count in trending_map.items():
                # Normalize count to a score between 0.5 and 1.0
                normalized_score = 0.5 + (count / max_count) * 0.5
                when_clauses.append(When(id=item_id, then=Value(normalized_score)))
            
            # Apply the Case expression
            return query.annotate(
                trending_score=Case(
                    *when_clauses,
                    default=Value(0.1),
                    output_field=FloatField()
                )
            )
            
        except Exception as e:
            logger.error(f"Error applying trending boost: {str(e)}", exc_info=True)
            return query.annotate(trending_score=Value(0.5, FloatField()))


class SeasonalRecommendationStrategy(RecommendationStrategy):
    """Strategy for seasonal recommendations based on current season"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get seasonal recommendations"""
        # Check cache for all users
        cache_key = context.get_cache_key(f"seasonal_{item_type}")
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results
        
        # Get base query with filters
        query = self._get_base_query(context, item_type)
        
        # Apply seasonal boost
        query = self._apply_seasonal_boost(query, context.current_season)
        
        # Order by seasonal score and apply limit/offset
        results = query.order_by('-seasonal_score')[context.offset:context.offset + context.limit]
        
        # Cache results
        cache.set(cache_key, results, 86400)  # 24 hours (seasons don't change quickly)
        
        return results
    
    def _apply_seasonal_boost(self, query: QuerySet, season: str) -> QuerySet:
        """Boost items based on seasonal relevance"""
        try:
            # Get current season tags
            season_tags = self._get_season_tags(season)
            
            if not season_tags:
                return query.annotate(seasonal_score=Value(0.5, FloatField()))
            
            # Boost items with metadata tags matching current season
            return query.annotate(
                seasonal_score=Case(
                    When(metadata__tags__overlap=season_tags, then=0.9),
                    default=0.2,
                    output_field=FloatField()
                )
            )
            
        except Exception as e:
            logger.error(f"Error applying seasonal boost: {str(e)}", exc_info=True)
            return query.annotate(seasonal_score=Value(0.5, FloatField()))
    
    def _get_season_tags(self, season: str) -> List[str]:
        """Get tags related to current season"""
        season_tags = {
            'spring': ['spring', 'blossom', 'garden', 'hiking', 'outdoor'],
            'summer': ['summer', 'beach', 'swimming', 'festival', 'vacation'],
            'autumn': ['autumn', 'fall', 'foliage', 'harvest', 'cozy'],
            'winter': ['winter', 'snow', 'skiing', 'holiday', 'christmas']
        }
        
        return season_tags.get(season, [])


class NearbyRecommendationStrategy(RecommendationStrategy):
    """Strategy for nearby recommendations based on user location"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get nearby recommendations"""
        # Location is required for this strategy
        if not context.location:
            logger.warning("Nearby recommendations requested without location")
            return self._get_base_query(context, item_type).none()
        
        # Check cache
        cache_key = context.get_cache_key(f"nearby_{item_type}")
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results
        
        # Get radius from context or default to 10km
        radius = context.request_data.get('radius', 10)
        
        # Get base query with filters
        query = self._get_base_query(context, item_type)
        
        # Apply location filter
        if item_type == 'place':
            query = query.filter(
                location__distance_lte=(context.location, D(km=radius))
            ).distance(context.location).order_by('distance')
        else:  # experience
            query = query.filter(
                place__location__distance_lte=(context.location, D(km=radius))
            ).distance(context.location, field_name='place__location').order_by('distance')
        
        # Apply limit/offset
        results = query[context.offset:context.offset + context.limit]
        
        # Cache results
        cache.set(cache_key, results, 1800)  # 30 minutes
        
        return results


class PopularRecommendationStrategy(RecommendationStrategy):
    """Strategy for popular recommendations based on ratings"""
    
    def get_recommendations(self, context: RecommendationContext, item_type: str) -> QuerySet:
        """Get popular recommendations"""
        # Check cache for all users
        cache_key = context.get_cache_key(f"popular_{item_type}")
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results
        
        # Get base query with filters
        query = self._get_base_query(context, item_type)
        
        # Order by rating and apply limit/offset
        results = query.order_by('-rating')[context.offset:context.offset + context.limit]
        
        # Cache results
        cache.set(cache_key, results, 3600)  # 1 hour
        
        return results


class RecommendationEngine:
    """
    Unified service for all recommendation types.
    Uses strategy pattern to select the appropriate algorithm.
    """
    
    def __init__(self):
        self.strategies = {
            'personalized': PersonalizedRecommendationStrategy(),
            'trending': TrendingRecommendationStrategy(),
            'seasonal': SeasonalRecommendationStrategy(),
            'nearby': NearbyRecommendationStrategy(),
            'popular': PopularRecommendationStrategy()
        }
    
    def get_recommendations(
        self,
        rec_type: str,
        user: Optional[User] = None,
        item_type: str = 'place',
        request_data: Optional[Dict] = None,
        location: Optional[Point] = None,
        device_type: str = 'desktop',
        filters: Optional[Dict] = None,
        limit: int = 10,
        offset: int = 0
    ) -> QuerySet:
        """
        Get recommendations using the appropriate strategy
        
        Args:
            rec_type: Type of recommendation (personalized, trending, seasonal, nearby, popular)
            user: User to get recommendations for (optional)
            item_type: Type of items to recommend (place, experience)
            request_data: Additional request data
            location: User's location
            device_type: User's device type
            filters: Filters to apply to recommendations
            limit: Maximum number of recommendations to return
            offset: Offset for pagination
            
        Returns:
            QuerySet of recommended items
        """
        context = RecommendationContext(
            user=user,
            request_data=request_data,
            location=location,
            device_type=device_type,
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        if rec_type not in self.strategies:
            logger.warning(f"Unknown recommendation type: {rec_type}, falling back to popular")
            rec_type = 'popular'
        
        strategy = self.strategies[rec_type]
        
        try:
            recommendations = strategy.get_recommendations(context, item_type)
            
            if user and user.is_authenticated:
                self._log_recommendations(user, recommendations, rec_type, item_type)
            
            return recommendations
        except Exception as e:
            logger.error(f"Error getting {rec_type} recommendations: {str(e)}", exc_info=True)
            return self.strategies['popular'].get_recommendations(context, item_type)

    def recommend_for_box(self, destination, duration_days):
        """
        Get recommendations specifically for box generation.
        
        Args:
            destination: The travel destination (City, Region, or Country)
            duration_days: Trip duration in days
            
        Returns:
            Dict: Dictionary with recommended places and experiences
        """
        # Determine the destination type and create appropriate filters
        filters = {}
        if hasattr(destination, '__class__') and destination.__class__.__name__ == 'City':
            filters['city'] = destination.id
        elif hasattr(destination, '__class__') and destination.__class__.__name__ == 'Region':
            filters['region'] = destination.id
        else:  # Assume Country
            filters['country'] = destination.id
        
        # Calculate how many items to fetch based on duration
        places_limit = duration_days * 3  # More options for places
        experiences_limit = duration_days * 2  # Fewer experiences
        
        # Get place recommendations
        places = self.get_recommendations(
            rec_type='personalized',
            item_type='place',
            filters=filters,
            limit=places_limit
        )
        
        # Get experience recommendations
        experiences = self.get_recommendations(
            rec_type='personalized',
            item_type='experience',
            filters=filters,
            limit=experiences_limit
        )
        
        # Return combined recommendations
        return {
            'places': places,
            'experiences': experiences
        }
    

    def _log_recommendations(self, user: User, recommendations: QuerySet, rec_type: str, item_type: str) -> None:
        """Log recommendations for analytics"""
        try:
            # Log only the top 10 recommendations
            for position, item in enumerate(recommendations[:10]):
                UserInteraction.log_interaction(
                    user=user,
                    content_object=item,
                    interaction_type_code='recommendation_shown',
                    position=position,
                    item_type=item_type,
                    recommendation_type=rec_type,
                    timestamp=timezone.now().isoformat()
                )
        except Exception as e:
            logger.warning(f"Failed to log recommendations: {str(e)}")