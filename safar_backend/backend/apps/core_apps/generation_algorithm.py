from django.db.models import Q
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.utils import timezone
from django.contrib.gis.geos import Point
from apps.helper_algorithm import RecommendationEngine

class BoxGenerator:
    def __init__(self, user, search_query=None, location=None, radius_km=50):
        self.user = user
        self.search_query = search_query
        self.location = location or self._get_user_location()
        self.radius_km = radius_km
        self.recommendation_engine = RecommendationEngine(user)
        self.user_profile = user.profile if hasattr(user, 'profile') else None
    
    def generate_personalized_box(self):
        """
        Enhanced method to generate a personalized box with optimized itinerary
        """
        # Step 1: Understand user context
        user_context = self._analyze_user_context()
        
        # Step 2: Find optimal places and experiences
        places = self._find_optimal_places(user_context)
        experiences = self._find_optimal_experiences(user_context, places)
        
        # Step 3: Generate optimized itinerary
        itinerary = self._generate_optimized_itinerary(places, experiences, user_context)
        
        # Step 4: Calculate pricing with dynamic discounts
        pricing = self._calculate_dynamic_pricing(places, experiences, user_context)
        
        # Step 5: Create and return the box
        return self._create_box_with_itinerary(
            places=places,
            experiences=experiences,
            itinerary=itinerary,
            pricing=pricing,
            context=user_context
        )
    
    def _analyze_user_context(self):
        """
        Analyze all available user data to build comprehensive context
        """
        context = {
            'intent': self._determine_search_intent(),
            'preferences': self._get_user_preferences(),
            'constraints': self._get_user_constraints(),
            'seasonal_factors': self._get_seasonal_factors()
        }
        
        # Add location context
        if self.location:
            context['location'] = {
                'point': self.location,
                'country': self._get_location_country(),
                'city': self._get_location_city()
            }
        
        return context
    
    def _determine_search_intent(self):
        """Enhanced intent detection with multiple factors"""
        intent = {
            'type': 'exploration',
            'duration_days': 3,
            'budget_level': 'medium',
            'group_size': 1
        }
        
        # Analyze search query if available
        if self.search_query:
            query = self.search_query.lower()
            
            # Detect intent type
            if any(word in query for word in ['relax', 'spa', 'resort']):
                intent['type'] = 'relaxation'
            elif any(word in query for word in ['adventure', 'hike', 'trek']):
                intent['type'] = 'adventure'
            elif any(word in query for word in ['culture', 'history', 'museum']):
                intent['type'] = 'cultural'
            elif any(word in query for word in ['family', 'kids', 'children']):
                intent['type'] = 'family'
                intent['group_size'] = 4  # Default family size
            
            # Extract duration hints
            if 'weekend' in query:
                intent['duration_days'] = 2
            elif 'week' in query:
                intent['duration_days'] = 7
            elif 'month' in query:
                intent['duration_days'] = 30
            
            # Extract budget hints
            if 'luxury' in query or '5 star' in query:
                intent['budget_level'] = 'high'
            elif 'budget' in query or 'cheap' in query:
                intent['budget_level'] = 'low'
        
        # Override with profile data if available
        if self.user_profile:
            # Get preferred travel style from profile
            if self.user_profile.travel_interests:
                if 'adventure' in self.user_profile.travel_interests:
                    intent['type'] = 'adventure'
                elif 'relaxation' in self.user_profile.travel_interests:
                    intent['type'] = 'relaxation'
            
            # Get group size from past bookings
            past_bookings = Booking.objects.filter(user=self.user).aggregate(
                avg_group=Avg('group_size')
            )
            if past_bookings['avg_group']:
                intent['group_size'] = max(1, round(past_bookings['avg_group']))
        
        return intent
    
    def _get_user_preferences(self):
        """Extract preferences from user profile and history"""
        preferences = {
            'categories': [],
            'activities': [],
            'cuisines': [],
            'accommodation_types': []
        }
        
        if self.user_profile:
            # Get from explicit profile fields
            if self.user_profile.travel_interests:
                preferences['activities'] = self.user_profile.travel_interests
            
            if self.user_profile.preferred_countries.exists():
                preferences['countries'] = list(
                    self.user_profile.preferred_countries.values_list('id', flat=True)
                )
            
            # Get from past behavior
            reviewed_categories = Review.objects.filter(
                user=self.user,
                rating__gte=4
            ).values_list(
                'place__category__name',
                'experience__category__name'
            ).distinct()
            
            for place_cat, exp_cat in reviewed_categories:
                if place_cat and place_cat not in preferences['categories']:
                    preferences['categories'].append(place_cat)
                if exp_cat and exp_cat not in preferences['activities']:
                    preferences['activities'].append(exp_cat)
        
        return preferences
    
    def _get_user_constraints(self):
        """Identify any user constraints (accessibility, timing, etc.)"""
        constraints = {
            'accessibility': False,
            'time_windows': [],
            'dietary_restrictions': []
        }
        
        if self.user_profile and self.user_profile.metadata:
            profile_meta = self.user_profile.metadata
            
            if 'accessibility_needs' in profile_meta:
                constraints['accessibility'] = True
            
            if 'dietary_restrictions' in profile_meta:
                constraints['dietary_restrictions'] = profile_meta['dietary_restrictions']
            
            if 'preferred_times' in profile_meta:
                constraints['time_windows'] = profile_meta['preferred_times']
        
        return constraints
    
    def _get_seasonal_factors(self):
        """Get relevant seasonal factors for recommendations"""
        from django.utils import timezone
        
        month = timezone.now().month
        season = 'winter'
        if 3 <= month <= 5:
            season = 'spring'
        elif 6 <= month <= 8:
            season = 'summer'
        elif 9 <= month <= 11:
            season = 'fall'
        
        return {
            'season': season,
            'events': self._get_local_events(),
            'weather': self._get_weather_patterns()
        }
    
    def _get_local_events(self):
        """Get local events happening during travel period"""
        # This would integrate with an events API in production
        return []
    
    def _get_weather_patterns(self):
        """Get typical weather patterns for the location and season"""
        # This would integrate with a weather API in production
        return {}
    
    def _get_user_location(self):
        """Get user's location from profile if available"""
        if self.user_profile and self.user_profile.location:
            return self.user_profile.location
        return None
    
    def _get_location_country(self):
        """Get country from location point"""
        if self.location:
            from apps.geographic_data.models import Country
            return Country.objects.filter(
                geometry__contains=self.location
            ).first()
        return None
    
    def _get_location_city(self):
        """Get city from location point"""
        if self.location:
            from apps.geographic_data.models import City
            return City.objects.filter(
                geometry__contains=self.location
            ).first()
        return None
    
    def _find_optimal_places(self, context):
        """
        Find optimal places considering all context factors
        """
        from apps.safar.models import Place
        from django.db.models import Q, F
        
        # Base query
        query = Q(is_available=True)
        
        # Location filter
        if context.get('location'):
            query &= Q(location__distance_lte=(context['location']['point'], D(km=self.radius_km)))
        
        # Intent filters
        intent = context['intent']
        if intent['type'] == 'relaxation':
            query &= Q(category__name__in=['Hotels', 'Resorts', 'Spas', 'Beach Houses'])
        elif intent['type'] == 'adventure':
            query &= Q(category__name__in=['Camping Sites', 'Adventure Parks', 'Mountain Lodges'])
        elif intent['type'] == 'cultural':
            query &= Q(category__name__in=['Museums', 'Historical Sites', 'Religious Centers'])
        elif intent['type'] == 'family':
            query &= Q(category__name__in=['Family Resorts', 'Theme Parks', 'Kid-Friendly Hotels'])
        
        # Budget filter
        if intent['budget_level'] == 'high':
            query &= Q(price__gte=200)
        elif intent['budget_level'] == 'low':
            query &= Q(price__lte=100)
        
        # Accessibility filter
        if context['constraints']['accessibility']:
            query &= Q(metadata__accessibility__has_key='wheelchair') | Q(metadata__accessibility=True)
        
        # Get base queryset
        places = Place.objects.filter(query)
        
        # Apply geographic sorting if location available
        if context.get('location'):
            places = places.annotate(
                distance=Distance('location', context['location']['point'])
            ).order_by('distance')
        else:
            places = places.order_by('-rating')
        
        # Apply recommendation engine ranking
        places = self.recommendation_engine.rank_places(places, context)
        
        # Limit results based on trip duration
        max_places = min(intent['duration_days'] + 2, 5)
        return places[:max_places]
    
    def _find_optimal_experiences(self, context, places):
        """
        Find optimal experiences that complement selected places
        """
        from apps.safar.models import Experience
        from django.db.models import Q
        
        if not places:
            return []
        
        # Calculate centroid of selected places
        place_locations = [p.location for p in places]
        avg_location = self._calculate_centroid(place_locations)
        
        # Base query
        query = Q(is_available=True)
        
        # Location filter
        query &= Q(location__distance_lte=(avg_location, D(km=self.radius_km)))
        
        # Intent filters
        intent = context['intent']
        if intent['type'] == 'relaxation':
            query &= Q(category__name__in=['Spa Treatments', 'Yoga', 'Meditation'])
        elif intent['type'] == 'adventure':
            query &= Q(category__name__in=['Hiking', 'Water Sports', 'Rock Climbing'])
        elif intent['type'] == 'cultural':
            query &= Q(category__name__in=['Guided Tours', 'Cultural Shows', 'Cooking Classes'])
        elif intent['type'] == 'family':
            query &= Q(category__name__in=['Kid Activities', 'Zoo Visits', 'Interactive Museums'])
        
        # Group size filter
        query &= Q(capacity__gte=intent['group_size'])
        
        # Time window filters
        if context['constraints']['time_windows']:
            time_query = Q()
            for window in context['constraints']['time_windows']:
                time_query |= Q(schedule__overlap=window)
            query &= time_query
        
        # Get base queryset
        experiences = Experience.objects.filter(query)
        
        # Apply geographic sorting
        experiences = experiences.annotate(
            distance=Distance('location', avg_location)
        ).order_by('distance')
        
        # Apply recommendation engine ranking
        experiences = self.recommendation_engine.rank_experiences(experiences, context)
        
        # Select experiences - more for longer trips
        max_experiences = min(intent['duration_days'] * 2, 6)
        return experiences[:max_experiences]
    
    def _generate_optimized_itinerary(self, places, experiences, context):
        """
        Generate an optimized itinerary considering:
        - Travel time between locations
        - Opening hours
        - Logical grouping of activities
        - User preferences and constraints
        """
        from datetime import time, timedelta
        
        itinerary = []
        intent = context['intent']
        duration = intent['duration_days']
        
        # Group activities by proximity and type
        activity_groups = self._group_activities(places, experiences)
        
        # Distribute groups across days
        for day in range(1, duration + 1):
            day_plan = {
                'day_number': day,
                'date': (context.get('start_date') or timezone.now().date()) + timedelta(days=day-1),
                'activities': []
            }
            
            # Assign activities to this day
            for group in activity_groups:
                if not group['assigned'] and self._fits_day(day_plan, group):
                    day_plan['activities'].extend(group['activities'])
                    group['assigned'] = True
            
            # Add travel time estimates
            if len(day_plan['activities']) > 1:
                day_plan['travel_time'] = self._calculate_travel_time(day_plan['activities'])
            
            itinerary.append(day_plan)
        
        return itinerary
    
    def _group_activities(self, places, experiences):
        """
        Group activities by proximity and category for logical itinerary
        """
        from collections import defaultdict
        
        # Combine places and experiences
        all_activities = []
        for place in places:
            all_activities.append({
                'type': 'place',
                'object': place,
                'location': place.location,
                'duration': timedelta(hours=2),  # Default duration for places
                'category': place.category.name
            })
        
        for exp in experiences:
            all_activities.append({
                'type': 'experience',
                'object': exp,
                'location': exp.location,
                'duration': timedelta(minutes=exp.duration),
                'category': exp.category.name
            })
        
        # Cluster by proximity
        clusters = defaultdict(list)
        for activity in all_activities:
            # Simple clustering - in production would use proper clustering algorithm
            loc_key = (round(activity['location'].x, 2), round(activity['location'].y, 2))
            clusters[loc_key].append(activity)
        
        # Form groups
        groups = []
        for cluster_activities in clusters.values():
            # Split large clusters
            while len(cluster_activities) > 0:
                group_size = min(3, len(cluster_activities))
                group = {
                    'activities': cluster_activities[:group_size],
                    'total_duration': sum(
                        (a['duration'] for a in cluster_activities[:group_size]),
                        timedelta()
                    ),
                    'assigned': False
                }
                groups.append(group)
                cluster_activities = cluster_activities[group_size:]
        
        return groups
    
    def _fits_day(self, day_plan, activity_group):
        """
        Check if activity group fits in the day considering:
        - Total activity time (max 8 hours per day)
        - Logical sequence (morning -> afternoon -> evening)
        - Category diversity
        """
        max_day_hours = 8
        current_hours = sum(
            a['duration'].total_seconds() / 3600
            for a in day_plan.get('activities', [])
        )
        group_hours = activity_group['total_duration'].total_seconds() / 3600
        
        if current_hours + group_hours > max_day_hours:
            return False
        
        # Check category diversity (don't put all museums in one day)
        existing_categories = {a['category'] for a in day_plan.get('activities', [])}
        group_categories = {a['category'] for a in activity_group['activities']}
        
        if len(existing_categories & group_categories) > 1:
            return False
        
        return True
    
    def _calculate_travel_time(self, activities):
        """
        Estimate travel time between activities in a day
        """
        # In production, would use a routing service like Google Maps
        # Here we use simple haversine distance with average speed
        from geopy.distance import great_circle
        
        total_seconds = 0
        for i in range(len(activities) - 1):
            loc1 = (activities[i]['location'].y, activities[i]['location'].x)
            loc2 = (activities[i+1]['location'].y, activities[i+1]['location'].x)
            distance_km = great_circle(loc1, loc2).km
            time_hours = distance_km / 30  # Assume 30km/h average speed in cities
            total_seconds += time_hours * 3600
        
        return timedelta(seconds=total_seconds)
    
    def _calculate_dynamic_pricing(self, places, experiences, context):
        """
        Calculate pricing with dynamic discounts based on:
        - Group size
        - Seasonality
        - User loyalty
        - Package composition
        """
        from decimal import Decimal
        
        # Base prices
        place_prices = [p.price for p in places]
        experience_prices = [e.price_per_person for e in experiences]
        
        # Calculate base total
        group_size = context['intent']['group_size']
        base_total = sum(place_prices) + sum(exp * group_size for exp in experience_prices)
        
        # Calculate dynamic discounts
        discounts = {
            'group_size': self._calculate_group_discount(group_size),
            'seasonal': self._calculate_seasonal_discount(context['seasonal_factors']['season']),
            'loyalty': self._calculate_loyalty_discount(),
            'package': self._calculate_package_discount(len(places) + len(experiences))
        }
        
        # Apply discounts (multiplicative)
        final_discount = 1
        for discount in discounts.values():
            final_discount *= (1 - discount)
        
        final_price = Decimal(float(base_total) * final_discount).quantize(Decimal('0.00'))
        
        return {
            'base_price': base_total,
            'final_price': final_price,
            'currency': context.get('location', {}).get('country', {}).currency or 'USD',
            'discounts': discounts,
            'discount_percentage': round((1 - final_discount) * 100, 1)
        }
    
    def _calculate_group_discount(self, group_size):
        """Discount based on group size"""
        if group_size >= 10:
            return 0.15
        elif group_size >= 5:
            return 0.10
        elif group_size >= 3:
            return 0.05
        return 0
    
    def _calculate_seasonal_discount(self, season):
        """Discount based on current season"""
        # Higher discounts in off-seasons
        if season == 'winter':
            return 0.10  # 10% discount in winter
        elif season == 'fall':
            return 0.05  # 5% discount in fall
        return 0
    
    def _calculate_loyalty_discount(self):
        """Discount based on user loyalty"""
        if not self.user:
            return 0
        
        # Check membership level
        if self.user.membership_level == 'gold':
            return 0.10
        elif self.user.membership_level == 'silver':
            return 0.05
        
        # Additional discount based on past bookings
        past_bookings = Booking.objects.filter(user=self.user).count()
        if past_bookings >= 10:
            return 0.07
        elif past_bookings >= 5:
            return 0.03
        
        return 0
    
    def _calculate_package_discount(self, item_count):
        """Discount based on number of items in package"""
        if item_count >= 5:
            return 0.10
        elif item_count >= 3:
            return 0.05
        return 0
    
    def _create_box_with_itinerary(self, places, experiences, itinerary, pricing, context):
        """
        Create the Box model with full itinerary structure
        """
        from apps.safar.models import Box, BoxItineraryDay, BoxItineraryItem
        
        # Create the base box
        box = Box.objects.create(
            name=f"Personalized {context['intent']['type'].title()} Experience",
            description=self._generate_box_description(context),
            total_price=pricing['final_price'],
            currency=pricing['currency'],
            country=places[0].country if places else None,
            city=places[0].city if places else None,
            duration_days=context['intent']['duration_days'],
            start_date=itinerary[0]['date'],
            end_date=itinerary[-1]['date'],
            is_customizable=True,
            max_group_size=context['intent']['group_size'],
            tags=self._generate_box_tags(context),
            metadata={
                'generated_at': timezone.now(),
                'user_id': self.user.id,
                'search_query': self.search_query,
                'discounts': pricing['discounts']
            }
        )
        
        # Add places and experiences
        box.place.set(places)
        box.experience.set(experiences)
        
        # Create itinerary days and items
        for day_plan in itinerary:
            itinerary_day = BoxItineraryDay.objects.create(
                box=box,
                day_number=day_plan['day_number'],
                date=day_plan['date'],
                description=f"Day {day_plan['day_number']} of your {context['intent']['type']} experience",
                estimated_hours=sum(
                    a['duration'].total_seconds() / 3600
                    for a in day_plan['activities']
                )
            )
            
            # Add activities to the day
            for i, activity in enumerate(day_plan['activities'], start=1):
                BoxItineraryItem.objects.create(
                    itinerary_day=itinerary_day,
                    place=activity['object'] if activity['type'] == 'place' else None,
                    experience=activity['object'] if activity['type'] == 'experience' else None,
                    start_time=time(9, 0) if i % 2 == 1 else time(14, 0),  # Alternate morning/afternoon
                    end_time=(
                        time(9, 0) + activity['duration'] if i % 2 == 1
                        else time(14, 0) + activity['duration']
                    ),
                    duration_minutes=int(activity['duration'].total_seconds() / 60),
                    order=i,
                    notes=f"Recommended {activity['type']} activity",
                    estimated_cost=(
                        activity['object'].price if activity['type'] == 'place'
                        else activity['object'].price_per_person * context['intent']['group_size']
                    )
                )
        
        return box
    
    def _generate_box_description(self, context):
        """Generate a compelling description for the box"""
        intent = context['intent']
        desc = f"A perfectly curated {intent['type']} experience "
        
        if intent['type'] == 'relaxation':
            desc += "designed to help you unwind and rejuvenate."
        elif intent['type'] == 'adventure':
            desc += "packed with thrilling activities for the adventurous soul."
        elif intent['type'] == 'cultural':
            desc += "that immerses you in the local culture and heritage."
        else:
            desc += "tailored to your interests and preferences."
        
        if intent['duration_days'] > 3:
            desc += f" This {intent['duration_days']}-day journey includes everything you need for an unforgettable trip."
        
        return desc
    
    def _generate_box_tags(self, context):
        """Generate relevant tags for the box"""
        tags = [context['intent']['type']]
        
        if context.get('location'):
            if context['location'].get('city'):
                tags.append(context['location']['city'].name)
            if context['location'].get('country'):
                tags.append(context['location']['country'].name)
        
        tags.append(f"{context['intent']['duration_days']} days")
        tags.append(context['seasonal_factors']['season'])
        
        return tags
    
    def _calculate_centroid(self, points):
        """Calculate centroid from a list of points"""
        if not points:
            return None
            
        x = sum(point.x for point in points) / len(points)
        y = sum(point.y for point in points) / len(points)
        return Point(x, y, srid=points[0].srid)