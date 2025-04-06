from collections import defaultdict
from django.db.models import Avg, Count, Q
from apps.safar.models import Booking, Wishlist, Review, Place
from apps.authentication.models import UserProfile
from datetime import timedelta
from django.utils import timezone

def get_seasonal_trends():
    """Manual curated list with seasonal trends"""
    from django.utils import timezone
    
    month = timezone.now().month
    if 3 <= month <= 5:  # Spring
        return ['Cherry Blossom Tours', 'Garden Destinations']
    elif 6 <= month <= 8:  # Summer
        return ['Beach Resorts', 'Mountain Retreats']
    elif 9 <= month <= 11:  # Fall
        return ['Wine Country', 'Foliage Trips']
    else:  # Winter
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
        # Add more clusters as needed
    }
    return clusters

def calculate_trending_destinations():
    trends = defaultdict(float)
    
    # 1. Booking Data (40%)
    bookings = Booking.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=90)
    ).values('place__city', 'place__country').annotate(
        total=Count('id')
    )
    for item in bookings:
        key = (item['place__city'], item['place__country'])
        trends[key] += item['total'] * 0.4
    
    # 2. Wishlist Data (30%)
    wishes = Wishlist.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=60),
        place__isnull=False
    ).values('place__city', 'place__country').annotate(
        total=Count('id')
    )
    for item in wishes:
        key = (item['place__city'], item['place__country'])
        trends[key] += item['total'] * 0.3
    
    # 3. Review Data (20%)
    reviews = Review.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=120),
        rating__gte=4,
        place__isnull=False
    ).values('place__city', 'place__country').annotate(
        avg_rating=Avg('rating'),
        review_count=Count('id')
    )
    for item in reviews:
        key = (item['place__city'], item['place__country'])
        trends[key] += (item['avg_rating'] * item['review_count']) * 0.2
    
    # 4. Manual Curation (10%)
    for trend_name in get_seasonal_trends():
        # Assuming manual trends match Place names
        manual_places = Place.objects.filter(
            name__icontains=trend_name
        ).values('city', 'country').distinct()
        for place in manual_places:
            key = (place['city'], place['country'])
            trends[key] += 10  # Fixed bonus points
    
    return sorted(trends.items(), key=lambda x: -x[1])[:10]