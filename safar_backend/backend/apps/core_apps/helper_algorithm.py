from collections import defaultdict
from django.db.models import Avg, Count, Q
from apps.safar.models import Booking, Wishlist, Review, Place
from apps.authentication.models import UserProfile
from datetime import timedelta
from django.utils import timezone


class RecommendationEngine:
    """
    Advanced recommendation engine that considers:
    - User preferences and past behavior
    - Social proof (popularity, reviews)
    - Personalization factors
    - Real-time availability
    """
    
    def __init__(self, user):
        self.user = user
        self.user_profile = user.profile if hasattr(user, 'profile') else None
    
    def rank_places(self, places, context=None):
        """
        Rank places using a multi-factor scoring algorithm
        """
        from django.db.models import Avg, Count
        from apps.safar.models import Review, Wishlist, Booking
        
        if not places:
            return places
        
        # Get user-specific data
        user_wishlist = set(Wishlist.objects.filter(
            user=self.user
        ).values_list('place_id', flat=True))
        
        user_reviews = {
            r.place_id: r.rating 
            for r in Review.objects.filter(user=self.user)
        }
        
        # Get social proof data
        place_reviews = {
            r['place_id']: r
            for r in Review.objects.filter(
                place_id__in=[p.id for p in places]
            ).values('place_id').annotate(
                avg_rating=Avg('rating'),
                review_count=Count('id')
            )
        }
        
        # Score each place
        scored_places = []
        for place in places:
            score = 0
            
            # Base score (50% weight)
            score += place.rating * 5
            
            # User-specific factors (30% weight)
            if place.id in user_wishlist:
                score += 10
                
            if place.id in user_reviews:
                score += user_reviews[place.id] * 2
                
            # Social proof (20% weight)
            if place.id in place_reviews:
                stats = place_reviews[place.id]
                score += stats['avg_rating'] * 2
                score += min(stats['review_count'] * 0.1, 5)
            
            # Contextual boosts
            if context:
                if self.user_profile and place.category.name.lower() in [
                    pref.lower() for pref in context['preferences'].get('categories', [])
                ]:
                    score += 5
                
                seasonal_boost = self._get_seasonal_boost(place, context['seasonal_factors'])
                score += seasonal_boost
            
            scored_places.append((place, score))
        
        scored_places.sort(key=lambda x: x[1], reverse=True)
        return [p[0] for p in scored_places]
    
    def rank_experiences(self, experiences, context=None):
        """
        Rank experiences using similar multi-factor scoring
        """
        from django.db.models import Avg, Count
        from apps.safar.models import Booking, Review
        
        if not experiences:
            return experiences
        
        user_bookings = {
            b.experience_id: b
            for b in Booking.objects.filter(
                user=self.user,
                experience__isnull=False
            )
        }
        
        exp_reviews = {
            r['experience_id']: r
            for r in Review.objects.filter(
                experience_id__in=[e.id for e in experiences]
            ).values('experience_id').annotate(
                avg_rating=Avg('rating'),
                review_count=Count('id')
            )
        }
        
        # Score each experience
        scored_exps = []
        for exp in experiences:
            score = 0
            
            # Base score (50% weight)
            score += exp.rating * 5
            
            # User-specific factors (30% weight)
            if exp.id in user_bookings:
                score += 10  # Bonus for previously booked
                
                # Additional bonus if they rated it highly
                user_review = Review.objects.filter(
                    user=self.user,
                    experience=exp
                ).first()
                if user_review and user_review.rating >= 4:
                    score += 5
            
            # Social proof (20% weight)
            if exp.id in exp_reviews:
                stats = exp_reviews[exp.id]
                score += stats['avg_rating'] * 2
                score += min(stats['review_count'] * 0.1, 5)
            
            # Contextual boosts
            if context:
                if self.user_profile and exp.category.name.lower() in [
                    pref.lower() for pref in context['preferences'].get('activities', [])
                ]:
                    score += 5
                
                seasonal_boost = self._get_seasonal_boost(exp, context['seasonal_factors'])
                score += seasonal_boost
            
            scored_exps.append((exp, score))
        
        # Sort by score
        scored_exps.sort(key=lambda x: x[1], reverse=True)
        return [e[0] for e in scored_exps]
    
    def _get_seasonal_boost(self, item, seasonal_factors):
        """
        Calculate seasonal relevance boost for an item
        """
        season = seasonal_factors['season']
        item_name = item.name.lower()
        
        seasonal_keywords = {
            'winter': ['ski', 'snow', 'northern lights', 'hot springs'],
            'summer': ['beach', 'swim', 'sun', 'hiking', 'camping'],
            'spring': ['garden', 'flowers', 'festival', 'outdoor'],
            'fall': ['wine', 'harvest', 'foliage', 'hiking']
        }
        
        for keyword in seasonal_keywords.get(season, []):
            if keyword in item_name:
                return 3  # Boost score by 3 points
        
        return 0
        
def get_seasonal_trends():
    """Manual curated list with seasonal trends"""
    from django.utils import timezone
    
    month = timezone.now().month
    if 3 <= month <= 5:
        return ['Cherry Blossom Tours', 'Garden Destinations']
    elif 6 <= month <= 8: 
        return ['Beach Resorts', 'Mountain Retreats']
    elif 9 <= month <= 11:
        return ['Wine Country', 'Foliage Trips']
    else:
        return ['Ski Resorts', 'Northern Lights']

def get_user_preference_clusters():
    """Group users by travel preferences from profiles"""
    clusters = {
        'adventure': UserProfile.objects.filter(
            Q(metadata__interests__contains=['hiking']) |
            Q(metadata__interests__contains=['adventure'])
        ),
        'luxury': UserProfile.objects.filter(
            preferred_currency__in=['USD', 'EUR'],
            metadata__accommodation_preference='luxury'
        ),
    }
    return clusters

def calculate_trending_destinations():
    """
    Enhanced trending destinations with:
    - Better weighting algorithm
    - Seasonal adjustments
    - Performance optimizations
    """
    from django.db.models import F, ExpressionWrapper, FloatField
    
    trends = defaultdict(float)
    now = timezone.now()
    season = get_current_season()
    
    # 1. Booking Data (40%) with recency weighting
    bookings = Booking.objects.filter(
        created_at__gte=now - timedelta(days=120)
    ).annotate(
        recency_weight=ExpressionWrapper(
            1.0 - (F('created_at') - (now - timedelta(days=120))) / timedelta(days=120),
            output_field=FloatField()
        )
    ).values('place__city', 'place__country').annotate(
        weighted_count=Count('id') * F('recency_weight')
    )
    
    for item in bookings:
        key = (item['place__city'], item['place__country'])
        trends[key] += float(item['weighted_count']) * 0.4
    
    # 2. Wishlist Data (30%) with user quality factor
    wishes = Wishlist.objects.filter(
        created_at__gte=now - timedelta(days=90),
        place__isnull=False
    ).annotate(
        user_quality=Case(
            When(user__membership_level='gold', then=1.5),
            When(user__membership_level='silver', then=1.2),
            default=1.0,
            output_field=FloatField()
        )
    ).values('place__city', 'place__country').annotate(
        quality_count=Count('id') * F('user_quality')
    )
    
    for item in wishes:
        key = (item['place__city'], item['place__country'])
        trends[key] += float(item['quality_count']) * 0.3
    
    # 3. Review Data (25%) with rating quality
    reviews = Review.objects.filter(
        created_at__gte=now - timedelta(days=180),
        rating__gte=3,
        place__isnull=False
    ).values('place__city', 'place__country').annotate(
        rating_power=Avg('rating') * Count('id')
    )
    
    for item in reviews:
        key = (item['place__city'], item['place__country'])
        trends[key] += float(item['rating_power']) * 0.25
    
    # 4. Seasonal Adjustment (5%)
    seasonal_boost = {
        'winter': 0.8,  # Slightly less weight in winter
        'summer': 1.2,  # More weight in summer
        'spring': 1.1,
        'fall': 1.0
    }.get(season, 1.0)
    
    # Apply seasonal multiplier
    for key in trends:
        trends[key] *= seasonal_boost
    
    # 5. Manual Curation (fixed bonus)
    for trend_name in get_seasonal_trends():
        manual_places = Place.objects.filter(
            name__icontains=trend_name
        ).values('city', 'country').distinct()
        for place in manual_places:
            key = (place['city'], place['country'])
            trends[key] += 15  # Fixed bonus with seasonal relevance
    
    return sorted(trends.items(), key=lambda x: -x[1])[:15]  # Return top 15