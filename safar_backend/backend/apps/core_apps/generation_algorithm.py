from django.db.models import Q
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.utils import timezone
from django.contrib.gis.geos import Point

class BoxGenerator:
    def __init__(self, user, search_query=None, location=None, radius_km=50):
        self.user = user
        self.search_query = search_query
        self.location = location
        self.radius_km = radius_km
        self.recommendation_engine = RecommendationEngine(user)
    
    def generate_personalized_box(self):
        """
        Main method to generate a personalized box based on user context
        """
        # Step 1: Understand user intent from search
        intent = self._analyze_search_intent()
        
        # Step 2: Find relevant places
        places = self._find_relevant_places(intent)
        
        if not places:
            return None
            
        # Step 3: Find complementary experiences
        experiences = self._find_complementary_experiences(places, intent)
        
        # Step 4: Calculate optimal box configuration
        box_config = self._calculate_box_configuration(places, experiences)
        
        # Step 5: Create the box
        box = self._create_box(box_config)
        
        return box
    
    def _analyze_search_intent(self):
        """
        Analyze search query to determine user intent
        Returns: dict with intent details (type, duration, budget, etc.)
        """
        intent = {
            'type': 'exploration',  # Default
            'duration_days': 3,     # Default
            'budget_level': 'medium' # Default
        }
        
        if self.search_query:
            # Simple NLP analysis (can be enhanced with ML)
            query = self.search_query.lower()
            
            if any(word in query for word in ['relax', 'spa', 'resort']):
                intent['type'] = 'relaxation'
            elif any(word in query for word in ['adventure', 'hike', 'trek']):
                intent['type'] = 'adventure'
            elif any(word in query for word in ['culture', 'history', 'museum']):
                intent['type'] = 'cultural'
            
            # Extract duration if mentioned
            if 'weekend' in query:
                intent['duration_days'] = 2
            elif 'week' in query:
                intent['duration_days'] = 7
            
            # Extract budget hints
            if 'luxury' in query or '5 star' in query:
                intent['budget_level'] = 'high'
            elif 'budget' in query or 'cheap' in query:
                intent['budget_level'] = 'low'
        
        return intent
    
    def _find_relevant_places(self, intent):
        """
        Find places matching the user's intent and location
        """
        from apps.safar.models import Place
        
        # Base query - filter by location if available
        query = Q(is_available=True)
        
        if self.location:
            query &= Q(location__distance_lte=(self.location, D(km=self.radius_km)))
        
        # Filter by category based on intent
        if intent['type'] == 'relaxation':
            query &= Q(category__name__in=['Hotels', 'Resorts', 'Spas'])
        elif intent['type'] == 'adventure':
            query &= Q(category__name__in=['Camping Sites', 'Adventure Parks'])
        elif intent['type'] == 'cultural':
            query &= Q(category__name__in=['Museums', 'Historical Sites', 'Religious Centers'])
        
        # Filter by budget
        if intent['budget_level'] == 'high':
            query &= Q(price__gte=200)
        elif intent['budget_level'] == 'low':
            query &= Q(price__lte=100)
        
        places = Place.objects.filter(query).annotate(
            distance=Distance('location', self.location)
        ).order_by('distance') if self.location else Place.objects.filter(query)
        
        # Apply recommendation engine to prioritize places
        places = self.recommendation_engine.rank_places(places)
        
        # Limit to 3-5 places based on trip duration
        max_places = min(intent['duration_days'] + 2, 5)
        return places[:max_places]
    
    def _find_complementary_experiences(self, places, intent):
        """
        Find experiences that complement the selected places
        """
        from apps.safar.models import Experience
        
        if not places:
            return []
        
        # Get experiences near the selected places
        place_locations = [p.location for p in places]
        avg_location = self._calculate_centroid(place_locations)
        
        # Base query
        query = Q(is_available=True)
        
        # Filter by location
        query &= Q(location__distance_lte=(avg_location, D(km=self.radius_km)))
        
        # Filter by intent
        if intent['type'] == 'relaxation':
            query &= Q(category__name__in=['Spa Treatments', 'Yoga'])
        elif intent['type'] == 'adventure':
            query &= Q(category__name__in=['Hiking', 'Water Sports'])
        elif intent['type'] == 'cultural':
            query &= Q(category__name__in=['Guided Tours', 'Cultural Shows'])
        
        experiences = Experience.objects.filter(query).annotate(
            distance=Distance('location', avg_location)
        ).order_by('distance')
        
        # Apply recommendation engine
        experiences = self.recommendation_engine.rank_experiences(experiences)
        
        # Select 1-2 experiences per day
        max_experiences = min(intent['duration_days'] * 2, 6)
        return experiences[:max_experiences]
    
    def _calculate_box_configuration(self, places, experiences):
        """
        Calculate the optimal box configuration including pricing
        """
        # Calculate base price (sum of places + experiences)
        base_price = sum(p.price for p in places) + sum(e.price_per_person for e in experiences)
        
        # Apply discount based on box size
        discount = min(len(places) + len(experiences) * 0.05, 0.2)  # Up to 20% discount
        
        # Final price
        final_price = base_price * (1 - discount)
        
        # Generate itinerary
        itinerary = self._generate_itinerary(places, experiences)
        
        return {
            'name': f"Personalized {self.search_query or 'Travel'} Box",
            'places': places,
            'experiences': experiences,
            'base_price': base_price,
            'discount': discount,
            'final_price': final_price,
            'currency': 'USD',  # Could be dynamic
            'itinerary': itinerary,
            'duration_days': len(itinerary),
            'metadata': {
                'generated_at': timezone.now(),
                'search_query': self.search_query,
                'user_id': self.user.id
            }
        }
    
    def _generate_itinerary(self, places, experiences):
        """
        Generate a day-by-day itinerary
        """
        itinerary = []
        
        # Group places and experiences by day
        num_days = max(len(places), len(experiences) // 2 + 1)
        
        for day in range(1, num_days + 1):
            day_plan = {
                'day': day,
                'places': [],
                'experiences': []
            }
            
            # Add places (try to distribute evenly)
            if day <= len(places):
                day_plan['places'].append(places[day-1])
            
            # Add experiences (morning and afternoon)
            exp_index = (day-1)*2
            if exp_index < len(experiences):
                day_plan['experiences'].append({
                    'time': 'morning',
                    'experience': experiences[exp_index]
                })
            if exp_index+1 < len(experiences):
                day_plan['experiences'].append({
                    'time': 'afternoon',
                    'experience': experiences[exp_index+1]
                })
            
            itinerary.append(day_plan)
        
        return itinerary
    
    def _create_box(self, config):
        """
        Create the actual Box model instance
        """
        from apps.safar.models import Box,Wishlist
   
        
        box = Box.objects.create(
            name=config['name'],
            description=f"Personalized travel box generated for {self.user.username}",
            total_price=config['final_price'],
            currency=config['currency'],
            country=config['places'][0].country if config['places'] else None,
            city=config['places'][0].city if config['places'] else None,
            contents=config['itinerary'],
            metadata=config['metadata']
        )
        
        # Add places and experiences
        box.place.set(config['places'])
        box.experience.set(config['experiences'])
        
        # Add to user's wishlist automatically
        Wishlist.objects.get_or_create(user=self.user, box=box)
        
        return box
    
    def _calculate_centroid(self, points):
        """
        Calculate centroid from a list of points
        """
        if not points:
            return None
            
        x = sum(point.x for point in points) / len(points)
        y = sum(point.y for point in points) / len(points)
        return Point(x, y, srid=points[0].srid)


class RecommendationEngine:
    """
    Helper class for making personalized recommendations
    """
    def __init__(self, user):
        self.user = user
    
    def rank_places(self, places):
        """
        Rank places based on user preferences and popularity
        """
        from apps.safar.models import Review, Wishlist
        from django.db.models import Avg
        
        # Get user preferences from past behavior
        user_wishlist = set(Wishlist.objects.filter(
            user=self.user
        ).values_list('place_id', flat=True))
        
        user_reviews = {
            r.place_id: r.rating 
            for r in Review.objects.filter(user=self.user)
        }
        
        # Score each place
        scored_places = []
        for place in places:
            score = place.rating * 2  # Base score
            
            # Boost if in user's wishlist
            if place.id in user_wishlist:
                score += 2.0
                
            # Boost if user has reviewed similar places highly
            similar_review_avg = Review.objects.filter(
                user=self.user,
                place__category=place.category
            ).aggregate(Avg('rating'))['rating__avg'] or 0
            
            score += similar_review_avg
            
            scored_places.append((place, score))
        
        # Sort by score
        scored_places.sort(key=lambda x: x[1], reverse=True)
        return [p[0] for p in scored_places]
    
    def rank_experiences(self, experiences):
        """
        Rank experiences based on user preferences
        """
        # Similar logic to rank_places but for experiences
        from apps.safar.models import Review, Booking
        
        # Get user's past bookings
        user_bookings = set(Booking.objects.filter(
            user=self.user,
            status='Confirmed'
        ).values_list('experience_id', flat=True))
        
        # Score each experience
        scored_exps = []
        for exp in experiences:
            score = exp.rating * 2
            
            # Boost if user has booked similar experiences
            similar_bookings = Booking.objects.filter(
                user=self.user,
                experience__category=exp.category,
                status='Confirmed'
            ).count()
            
            score += similar_bookings * 0.5
            
            scored_exps.append((exp, score))
        
        scored_exps.sort(key=lambda x: x[1], reverse=True)
        return [e[0] for e in scored_exps]