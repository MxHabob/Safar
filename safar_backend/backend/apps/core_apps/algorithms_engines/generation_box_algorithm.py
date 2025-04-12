import logging
from datetime import timedelta, datetime, time
from django.db import transaction
from django.db.models import Q, Count, F, Value, FloatField
from django.db.models.functions import Coalesce
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.contrib.gis.geos import Point
from apps.authentication.models import User, Notification
from apps.safar.models import (Place, Experience, Box, BoxItineraryDay, BoxItineraryItem)
from apps.geographic_data.models import City, Region, Country
from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine
from sklearn.cluster import DBSCAN
import numpy as np

logger = logging.getLogger(__name__)

class BoxGenerator:
    """
    Smart travel box generator that creates personalized travel itineraries.
    
    Features:
    - Personalized recommendations based on user preferences
    - Intelligent daily scheduling with realistic constraints
    - Geographic clustering for efficient routing
    - Budget awareness
    - Balanced mix of activities and downtime
    - Time-of-day optimization for activities
    - Weather-aware scheduling
    - Popularity-based peak time avoidance
    """

    DEFAULT_CONSTRAINTS = {
        'max_daily_items': 4,           # Max activities per day
        'max_daily_hours': 10,          # Max hours of scheduled activities
        'min_rest_hours': 8,             # Min hours for rest/overnight
        'max_travel_time_minutes': 90,   # Max travel time between activities
        'opening_hours': (9, 20),        # Typical opening hours (9am-8pm)
        'max_daily_budget': None,        # Optional daily budget limit
        'activity_weights': {            # Ideal distribution of activity types
            'cultural': 0.4,
            'outdoor': 0.3,
            'leisure': 0.2,
            'shopping': 0.1
        },
        'time_of_day_preferences': {     # When certain activities are best
            'cultural': ['morning', 'afternoon'],
            'outdoor': ['morning', 'afternoon'],
            'leisure': ['afternoon', 'evening'],
            'shopping': ['afternoon']
        },
        'min_activity_spacing_minutes': 60,  # Minimum time between activities
        'avoid_peak_hours': True,        # Try to avoid peak hours at popular places
    }

    # Time of day definitions (hour ranges)
    TIME_OF_DAY = {
        'morning': (8, 12),
        'afternoon': (12, 17),
        'evening': (17, 22)
    }

    def __init__(self, user, recommendation_engine=None, constraints=None):
        """
        Initialize the box generator for a specific user.
        
        Args:
            user (User): The user to generate boxes for
            recommendation_engine (RecommendationEngine): Optional custom engine
            constraints (dict): Override default scheduling constraints
        """
        if not isinstance(user, User):
            raise ValueError("Must provide a valid User instance")
            
        self.user = user
        self.recommendation_engine = recommendation_engine or RecommendationEngine(user)
        self.constraints = {**self.DEFAULT_CONSTRAINTS, **(constraints or {})}
        
    @transaction.atomic
    def generate_box(self, destination, duration_days, budget=None, start_date=None, theme=None):
        """
        Generate a complete travel box with itinerary.
        
        Args:
            destination (City|Region|Country): The travel destination
            duration_days (int): Trip duration in days
            budget (float): Optional total budget for the trip
            start_date (date): Optional start date for the trip
            theme (str): Optional theme (e.g., 'adventure', 'relaxation')
            
        Returns:
            Box: The generated travel box
            
        Raises:
            ValueError: For invalid inputs
            RuntimeError: If box generation fails
        """
        try:
            # Validate inputs
            self._validate_inputs(destination, duration_days, budget)
            
            # Adjust constraints based on theme
            self._apply_theme_constraints(theme)
            
            # Calculate daily budget if total budget provided
            daily_budget = budget / duration_days if budget else None
            
            # Create base box
            box = self._create_base_box(
                destination=destination,
                duration_days=duration_days,
                start_date=start_date,
                theme=theme
            )
            
            # Get recommendations for this box
            recommendations = self.recommendation_engine.recommend_for_box(
                destination=destination,
                duration_days=duration_days
            )
            
            # Generate optimized itinerary
            itinerary = self._generate_itinerary(
                box=box,
                places=recommendations['places'],
                experiences=recommendations['experiences'],
                daily_budget=daily_budget
            )
            
            # Calculate and set total price
            box.total_price = self._calculate_total_price(itinerary)
            box.save()
            
            # Add metadata about generation
            box.metadata.update({
                'generated': True,
                'algorithm_version': '2.0',
                'constraints_used': self.constraints,
                'theme': theme,
                'generation_date': datetime.now().isoformat()
            })
            box.save()
            
            # Create notification for the user
            self._create_box_notification(box)
            
            logger.info(f"Successfully generated box {box.id} for user {self.user.id}")
            return box
            
        except ValueError as e:
            logger.error(f"Validation error in box generation: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error generating box: {str(e)}", exc_info=True)
            raise RuntimeError("Could not generate box at this time")

    def _create_box_notification(self, box):
        """
        Create a notification for the user about their new generated box.
        Includes a deep link to the box in the metadata.
        """
        try:
            # Generate deep link URL (assuming you have a URL named 'box-detail')
            absolute_deep_link = f"http://localhost:3000/box/{box.id}"
            
            Notification.objects.create(
                user=self.user,
                type="Personalized Box",
                message=f"Your personalized {box.name} is ready!",
                metadata={
                    "box_id": str(box.id),
                    "deep_link": absolute_deep_link,
                    "box_name": box.name,
                    "generated_at": box.created_at.isoformat(),
                    "duration_days": box.duration_days,
                    "total_price": box.total_price
                },
                channels=["app", "email"]  # Or whichever channels you prefer
            )
            
            logger.info(f"Created notification for box {box.id} for user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Failed to create notification for box {box.id}: {str(e)}")
            # Don't fail the whole operation if notification fails
            pass

    def _validate_inputs(self, destination, duration_days, budget):
        """Validate all generation parameters"""
        if not isinstance(destination, (City, Region, Country)):
            raise ValueError("Destination must be a City, Region or Country")
        
        if not isinstance(duration_days, int) or duration_days < 1 or duration_days > 30:
            raise ValueError("Duration must be between 1 and 30 days")
            
        if budget is not None and (not isinstance(budget, (int, float)) or budget <= 0):
            raise ValueError("Budget must be a positive number")

    def _apply_theme_constraints(self, theme):
        """Adjust constraints based on selected theme"""
        if theme == 'adventure':
            self.constraints.update({
                'activity_weights': {'outdoor': 0.6, 'cultural': 0.3, 'leisure': 0.1},
                'max_daily_hours': 12,
                'time_of_day_preferences': {
                    'outdoor': ['morning', 'afternoon'],
                    'cultural': ['afternoon'],
                    'leisure': ['evening']
                }
            })
        elif theme == 'relaxation':
            self.constraints.update({
                'activity_weights': {'leisure': 0.7, 'cultural': 0.2, 'shopping': 0.1},
                'max_daily_items': 3,
                'max_daily_hours': 6,
                'min_activity_spacing_minutes': 120,  # More spacing between activities
                'time_of_day_preferences': {
                    'leisure': ['morning', 'afternoon', 'evening'],
                    'cultural': ['afternoon'],
                    'shopping': ['afternoon']
                }
            })
        elif theme == 'cultural':
            self.constraints.update({
                'activity_weights': {'cultural': 0.7, 'outdoor': 0.2, 'leisure': 0.1},
                'max_travel_time_minutes': 60,  # Keep activities close together
                'time_of_day_preferences': {
                    'cultural': ['morning', 'afternoon'],
                    'outdoor': ['afternoon'],
                    'leisure': ['evening']
                }
            })
        elif theme == 'family':
            self.constraints.update({
                'activity_weights': {'outdoor': 0.4, 'cultural': 0.3, 'leisure': 0.2, 'shopping': 0.1},
                'max_daily_hours': 8,  # Less tiring for kids
                'max_travel_time_minutes': 45,  # Shorter travel times
                'time_of_day_preferences': {
                    'outdoor': ['morning', 'afternoon'],
                    'cultural': ['morning'],
                    'leisure': ['afternoon', 'evening'],
                    'shopping': ['afternoon']
                }
            })
        elif theme == 'budget':
            self.constraints.update({
                'activity_weights': {'outdoor': 0.5, 'cultural': 0.3, 'leisure': 0.1, 'shopping': 0.1},
                'max_daily_budget': budget / duration_days * 0.8 if budget else None,  # 20% buffer
            })

    def _create_base_box(self, destination, duration_days, start_date, theme):
        """Create the base box object with proper metadata"""
        box_data = {
            'name': self._generate_box_name(destination, duration_days, theme),
            'duration_days': duration_days,
            'is_customizable': True,
            'owner': self.user,
            'metadata': {
                'generation_parameters': {
                    'destination': str(destination),
                    'destination_type': type(destination).__name__,
                    'duration_days': duration_days,
                    'theme': theme
                }
            }
        }
        
        # Set geographic fields based on destination type
        if isinstance(destination, City):
            box_data.update({
                'city': destination,
                'region': destination.region,
                'country': destination.country
            })
        elif isinstance(destination, Region):
            box_data.update({
                'region': destination,
                'country': destination.country
            })
        else:
            box_data['country'] = destination
            
        # Set dates if provided
        if start_date:
            box_data.update({
                'start_date': start_date,
                'end_date': start_date + timedelta(days=duration_days - 1)  # End date is inclusive
            })
            
        return Box.objects.create(**box_data)

    def _generate_box_name(self, destination, duration_days, theme):
        """Generate an attractive name for the box"""
        theme_adjectives = {
            'adventure': 'Adventurous',
            'relaxation': 'Relaxing',
            'cultural': 'Cultural',
            'family': 'Family-Friendly',
            'budget': 'Budget-Friendly',
            None: 'Ultimate'
        }
        
        theme_adj = theme_adjectives.get(theme, 'Personalized')
        return f"{theme_adj} {destination.name} {duration_days}-Day Experience"

    def _generate_itinerary(self, box, places, experiences, daily_budget):
        """
        Generate complete itinerary for the box considering:
        - Geographic proximity
        - Opening hours
        - Activity types
        - User preferences
        - Budget constraints
        - Time of day preferences
        - Weather considerations (if available)
        """
        itinerary_days = []
        
        # Combine and prioritize all potential activities
        all_activities = self._combine_and_prioritize_activities(places, experiences)
        
        # Group activities by geographic area for efficient routing
        clustered_activities = self._cluster_activities_by_location_ml(all_activities)
        
        # Check if we have weather data for the destination and dates
        has_weather_data = self._check_weather_data_availability(box)
        
        # Generate each day's itinerary
        for day_num in range(1, box.duration_days + 1):
            # Get weather for this day if available
            weather = self._get_weather_for_day(box, day_num) if has_weather_data else None
            
            day_itinerary = self._generate_day_itinerary(
                box=box,
                day_num=day_num,
                clustered_activities=clustered_activities,
                daily_budget=daily_budget,
                weather=weather
            )
            itinerary_days.append(day_itinerary)
            
            # Remove scheduled activities from consideration
            scheduled_ids = [
                item.place_id or item.experience_id 
                for item in day_itinerary.items.all() 
                if item.place_id or item.experience_id
            ]
            
            # Update clustered_activities to remove scheduled items
            for cluster in clustered_activities:
                cluster['activities'] = [
                    act for act in cluster['activities'] 
                    if getattr(act, 'id', None) not in scheduled_ids
                ]
            
            # Remove empty clusters
            clustered_activities = [c for c in clustered_activities if c['activities']]
        
        return itinerary_days

    def _combine_and_prioritize_activities(self, places, experiences):
        """
        Combine places and experiences into a single prioritized list
        considering user preferences and activity types
        """
        activities = []
        
        # Convert places to activity format
        for place in places:
            activities.append({
                'type': 'place',
                'object': place,
                'duration': place.metadata.get('average_visit_duration', 120),  # Default 2 hours
                'cost': place.price or 0,
                'opening_hours': place.metadata.get('opening_hours'),
                'activity_type': place.metadata.get('activity_type', 'cultural'),
                'popularity': place.metadata.get('popularity_score', 0.5),
                'indoor': place.metadata.get('is_indoor', False)
            })
        
        # Convert experiences to activity format
        for experience in experiences:
            activities.append({
                'type': 'experience',
                'object': experience,
                'duration': experience.duration,
                'cost': experience.price_per_person,
                'opening_hours': experience.schedule,
                'activity_type': experience.metadata.get('activity_type', 'outdoor'),
                'popularity': experience.metadata.get('popularity_score', 0.5),
                'indoor': experience.metadata.get('is_indoor', False)
            })
        
        # Calculate personalization score for each activity
        for activity in activities:
            activity['personalization_score'] = self.recommendation_engine.calculate_personalization_score(activity['object'])
            activity['rating'] = getattr(activity['object'], 'rating', 3.0)
        
        # Sort by personalization score and rating
        return sorted(
            activities,
            key=lambda x: (
                -x['personalization_score'],
                -x['rating']
            )
        )

    def _cluster_activities_by_location_ml(self, activities, max_distance_km=5):
        """
        Group activities by geographic proximity using DBSCAN clustering algorithm
        with Django's GIS functionality for distance calculations
        
        Args:
            activities (list): List of activity dicts
            max_distance_km (int): Maximum distance between activities in a cluster
            
        Returns:
            list: List of clusters with center point and activities
        """
        if not activities:
            return []
            
        # Get only activities with locations
        located_activities = [a for a in activities if hasattr(a['object'], 'location') and a['object'].location]
        
        # If no locations, return one cluster with all activities
        if not located_activities:
            return [{
                'center': None,
                'activities': [a['object'] for a in activities]
            }]
        
        # Extract coordinates for clustering
        coordinates = []
        for activity in located_activities:
            loc = activity['object'].location
            coordinates.append([loc.x, loc.y])  # Longitude, Latitude
        
        # Convert to numpy array
        X = np.array(coordinates)
        
        if len(X) < 2:
            # Not enough points for clustering
            return [{
                'center': located_activities[0]['object'].location,
                'activities': [a['object'] for a in located_activities]
            }]
        
        # Calculate epsilon in degrees (approximate conversion from km)
        # 1 degree latitude ≈ 111 km, but longitude varies with latitude
        avg_lat = np.mean(X[:, 1])
        km_per_degree_lon = 111 * np.cos(np.radians(avg_lat))
        epsilon_lat = max_distance_km / 111.0
        epsilon_lon = max_distance_km / km_per_degree_lon
        
        # Custom distance metric using Django's GIS functionality
        def gis_distance(p1, p2):
            """Calculate distance between two points using Django GIS"""
            point1 = Point(p1[0], p1[1], srid=4326)  # WGS84 SRID
            point2 = Point(p2[0], p2[1], srid=4326)
            # Convert to meters and then to kilometers
            return point1.distance(point2) * 100  # Approximate conversion to km
        
        # Use DBSCAN for clustering with our custom GIS distance metric
        db = DBSCAN(
            eps=max(epsilon_lat, epsilon_lon),
            min_samples=1,
            metric=gis_distance
        ).fit(X)
        
        labels = db.labels_
        
        # Group activities by cluster
        clusters = []
        for label in set(labels):
            cluster_indices = np.where(labels == label)[0]
            cluster_activities = [located_activities[i]['object'] for i in cluster_indices]
            
            # Calculate centroid
            cluster_points = [act.location for act in cluster_activities]
            centroid = self._calculate_centroid(cluster_points)
            
            clusters.append({
                'center': centroid,
                'activities': cluster_activities
            })
        
        # Add any remaining non-located activities to a separate cluster
        non_located = [
            a['object'] for a in activities 
            if not (hasattr(a['object'], 'location') and a['object'].location)
        ]
        if non_located:
            clusters.append({
                'center': None,
                'activities': non_located
            })
            
        return clusters

    def _calculate_centroid(self, points):
        """Calculate geographic centroid of multiple points"""
        if not points:
            return None
            
        from django.contrib.gis.geos import MultiPoint
        multipoint = MultiPoint(points)
        return multipoint.centroid

    def _check_weather_data_availability(self, box):
        """Check if weather data is available for this box's location and dates"""
        # This is a placeholder - implement based on your weather data source
        try:
            if not box.start_date:
                return False
                
            # Check if we have a weather service integration
            # and if we have data for this location and date range
            return False  # Replace with actual implementation
        except Exception as e:
            logger.warning(f"Error checking weather data: {str(e)}")
            return False

    def _get_weather_for_day(self, box, day_num):
        """Get weather forecast for a specific day"""
        # This is a placeholder - implement based on your weather data source
        try:
            if not box.start_date:
                return None
                
            date = box.start_date + timedelta(days=day_num - 1)
            
            # Fetch weather data for this date and location
            # Return None if not available
            return None  # Replace with actual implementation
        except Exception as e:
            logger.warning(f"Error fetching weather data: {str(e)}")
            return None

    def _generate_day_itinerary(self, box, day_num, clustered_activities, daily_budget, weather=None):
        """
        Generate optimized itinerary for a single day considering:
        - Activity types and weights
        - Opening hours
        - Travel time between locations
        - Budget constraints
        - Time of day preferences
        - Weather conditions
        """
        day = BoxItineraryDay.objects.create(
            box=box,
            day_number=day_num,
            date=box.start_date + timedelta(days=day_num - 1) if box.start_date else None
        )
        
        # Add weather information to day metadata if available
        if weather:
            day.metadata = {'weather': weather}
            day.save()
        
        # Initialize scheduling parameters
        selected_items = []
        remaining_hours = self.constraints['max_daily_hours']
        remaining_budget = daily_budget
        activity_counts = {key: 0 for key in self.constraints['activity_weights'].keys()}
        
        # Calculate target counts for each activity type
        target_counts = {
            key: round(val * self.constraints['max_daily_items'])
            for key, val in self.constraints['activity_weights'].items()
        }
        
        # Adjust for weather if available
        if weather and 'condition' in weather:
            self._adjust_for_weather(target_counts, weather)
        
        # Initialize time slots for the day
        time_slots = self._initialize_time_slots(day)
        
        # Select a cluster for this day (geographic focus)
        selected_cluster = self._select_best_cluster_for_day(clustered_activities, day_num, box.duration_days)
        
        if not selected_cluster:
            # No suitable cluster found, use all available activities
            all_activities = []
            for cluster in clustered_activities:
                all_activities.extend(cluster['activities'])
            
            if not all_activities:
                # No activities available
                logger.warning(f"No activities available for day {day_num}")
                return day
                
            # Sort activities by priority
            all_activities.sort(
                key=lambda x: self._activity_priority_score(x, activity_counts, target_counts),
                reverse=True
            )
            
            # Schedule activities
            self._schedule_activities_in_time_slots(
                day=day,
                activities=all_activities,
                time_slots=time_slots,
                activity_counts=activity_counts,
                target_counts=target_counts,
                remaining_budget=remaining_budget
            )
        else:
            # Schedule activities from the selected cluster
            self._schedule_activities_in_time_slots(
                day=day,
                activities=selected_cluster['activities'],
                time_slots=time_slots,
                activity_counts=activity_counts,
                target_counts=target_counts,
                remaining_budget=remaining_budget
            )
        
        return day

    def _adjust_for_weather(self, target_counts, weather):
        """Adjust activity targets based on weather conditions"""
        condition = weather.get('condition', '').lower()
        
        if 'rain' in condition or 'snow' in condition or 'storm' in condition:
            # Increase indoor activities, decrease outdoor
            if 'outdoor' in target_counts and 'cultural' in target_counts:
                target_counts['outdoor'] = max(0, target_counts['outdoor'] - 1)
                target_counts['cultural'] = target_counts['cultural'] + 1
        elif 'sunny' in condition or 'clear' in condition:
            # Increase outdoor activities
            if 'outdoor' in target_counts and 'cultural' in target_counts:
                target_counts['outdoor'] = target_counts['outdoor'] + 1
                target_counts['cultural'] = max(0, target_counts['cultural'] - 1)

    def _initialize_time_slots(self, day):
        """Initialize time slots for scheduling activities"""
        # Default day starts at 9:00 and ends at 20:00
        start_hour, end_hour = self.constraints['opening_hours']
        
        # Create 30-minute time slots
        time_slots = []
        current_time = time(start_hour, 0)  # Start at 9:00
        
        while current_time.hour < end_hour:
            # Create a time slot
            slot = {
                'start_time': current_time,
                'is_available': True,
                'activity': None
            }
            
            # Calculate end time (30 minutes later)
            minutes = current_time.minute + 30
            hour = current_time.hour + minutes // 60
            minutes = minutes % 60
            
            if hour < 24:  # Ensure we don't go past midnight
                slot['end_time'] = time(hour, minutes)
                time_slots.append(slot)
            
            # Move to next slot
            current_time = slot['end_time']
        
        return time_slots

    def _select_best_cluster_for_day(self, clustered_activities, day_num, total_days):
        """Select the best geographic cluster for a specific day"""
        if not clustered_activities:
            return None
            
        # For single-day trips, use the highest priority cluster
        if total_days == 1:
            return max(clustered_activities, key=lambda c: sum(
                self._get_activity_priority(a) for a in c['activities']
            ))
        
        # For multi-day trips, try to distribute clusters across days
        # Sort clusters by priority
        sorted_clusters = sorted(
            clustered_activities,
            key=lambda c: sum(self._get_activity_priority(a) for a in c['activities']),
            reverse=True
        )
        
        # Distribute clusters evenly across days
        cluster_index = (day_num - 1) % len(sorted_clusters)
        return sorted_clusters[cluster_index]

    def _get_activity_priority(self, activity):
        """Calculate priority score for an activity"""
        personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
        rating = getattr(activity, 'rating', 3.0)
        return (personalization_score * 0.7) + (rating * 0.3)

    def _schedule_activities_in_time_slots(self, day, activities, time_slots, activity_counts, target_counts, remaining_budget):
        """Schedule activities in available time slots"""
        # Sort activities by priority score
        sorted_activities = sorted(
            activities,
            key=lambda x: self._activity_priority_score(x, activity_counts, target_counts),
            reverse=True
        )
        
        # Track scheduled items
        scheduled_items = []
        
        # First pass: schedule activities based on time of day preferences
        for activity in sorted_activities:
            if len(scheduled_items) >= self.constraints['max_daily_items']:
                break
                
            activity_type = getattr(activity, 'metadata', {}).get('activity_type', 'cultural')
            preferred_times = self.constraints['time_of_day_preferences'].get(activity_type, ['morning', 'afternoon'])
            
            # Find suitable time slot
            suitable_slot = self._find_suitable_time_slot(
                activity=activity,
                time_slots=time_slots,
                preferred_times=preferred_times
            )
            
            if suitable_slot:
                # Check budget constraint
                cost = self._get_activity_cost(activity)
                if remaining_budget is not None and cost > remaining_budget:
                    continue
                
                # Create itinerary item
                item = self._create_itinerary_item(
                    day=day,
                    activity=activity,
                    start_time=suitable_slot['start_time'],
                    end_time=suitable_slot['end_time'],
                    order=len(scheduled_items) + 1,
                    cost=cost
                )
                
                scheduled_items.append(item)
                activity_counts[activity_type] = activity_counts.get(activity_type, 0) + 1
                
                if remaining_budget is not None:
                    remaining_budget -= cost
        
        # Second pass: fill any remaining slots
        if len(scheduled_items) < self.constraints['max_daily_items']:
            for activity in sorted_activities:
                if activity in [item.place or item.experience for item in scheduled_items]:
                    continue
                    
                if len(scheduled_items) >= self.constraints['max_daily_items']:
                    break
                
                # Find any available time slot
                suitable_slot = self._find_suitable_time_slot(
                    activity=activity,
                    time_slots=time_slots,
                    preferred_times=None  # Any time is fine
                )
                
                if suitable_slot:
                    # Check budget constraint
                    cost = self._get_activity_cost(activity)
                    if remaining_budget is not None and cost > remaining_budget:
                        continue
                    
                    # Create itinerary item
                    item = self._create_itinerary_item(
                        day=day,
                        activity=activity,
                        start_time=suitable_slot['start_time'],
                        end_time=suitable_slot['end_time'],
                        order=len(scheduled_items) + 1,
                        cost=cost
                    )
                    
                    scheduled_items.append(item)
                    activity_type = getattr(activity, 'metadata', {}).get('activity_type', 'cultural')
                    activity_counts[activity_type] = activity_counts.get(activity_type, 0) + 1
                    
                    if remaining_budget is not None:
                        remaining_budget -= cost
        
        # Bulk create items
        BoxItineraryItem.objects.bulk_create(scheduled_items)

    def _find_suitable_time_slot(self, activity, time_slots, preferred_times=None):
        """Find a suitable time slot for an activity"""
        duration_minutes = self._get_activity_duration(activity)
        slots_needed = max(1, duration_minutes // 30)
        
        # Get opening hours for the activity
        opening_hours = self._get_activity_opening_hours(activity)
        
        # Filter time slots by preferred times of day
        if preferred_times:
            preferred_slots = []
            for slot in time_slots:
                if not slot['is_available']:
                    continue
                    
                hour = slot['start_time'].hour
                for time_of_day in preferred_times:
                    start_hour, end_hour = self.TIME_OF_DAY[time_of_day]
                    if start_hour <= hour < end_hour:
                        preferred_slots.append(slot)
                        break
         
                        preferred_slots.append(slot)
                        break
        else:
            preferred_slots = [slot for slot in time_slots if slot['is_available']]
        
        # Find consecutive available slots
        for i in range(len(preferred_slots) - slots_needed + 1):
            consecutive_slots = preferred_slots[i:i+slots_needed]
            
            # Check if all slots are available and consecutive
            if all(slot['is_available'] for slot in consecutive_slots):
                # Check if slots are within opening hours
                start_time = consecutive_slots[0]['start_time']
                end_time = consecutive_slots[-1]['end_time']
                
                if opening_hours and not self._is_within_opening_hours(start_time, end_time, opening_hours):
                    continue
                
                # Mark slots as used
                for slot in consecutive_slots:
                    slot['is_available'] = False
                    slot['activity'] = activity
                
                return {
                    'start_time': start_time,
                    'end_time': end_time
                }
        
        return None

    def _is_within_opening_hours(self, start_time, end_time, opening_hours):
        """Check if a time range is within opening hours"""
        if not opening_hours:
            return True
            
        # Parse opening hours
        try:
            open_time = time(opening_hours[0], 0)  # e.g., 9:00
            close_time = time(opening_hours[1], 0)  # e.g., 17:00
            
            return open_time <= start_time and end_time <= close_time
        except (IndexError, TypeError):
            # If opening hours format is invalid, assume always open
            return True

    def _create_itinerary_item(self, day, activity, start_time, end_time, order, cost):
        """Create an itinerary item for an activity"""
        duration_minutes = self._get_activity_duration(activity)
        
        item = BoxItineraryItem(
            itinerary_day=day,
            order=order,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            estimated_cost=cost,
            notes=self._generate_activity_notes(activity)
        )
        
        # Set either place or experience
        if hasattr(activity, 'price'):  # Place
            item.place = activity
        else:  # Experience
            item.experience = activity
        
        return item

    def _activity_priority_score(self, activity, current_counts, target_counts):
        """
        Calculate priority score for an activity based on:
        - How much we need its activity type
        - Its personalization score
        - Its rating
        - Weather compatibility (if applicable)
        """
        activity_type = getattr(activity, 'metadata', {}).get('activity_type', 'cultural')
        type_need = max(0, target_counts.get(activity_type, 0) - current_counts.get(activity_type, 0))
        
        personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
        rating = getattr(activity, 'rating', 3.0)  # Default to average if no rating
        
        # Calculate weather compatibility
        weather_score = 1.0
        if hasattr(activity, 'metadata') and 'is_indoor' in activity.metadata:
            is_indoor = activity.metadata['is_indoor']
            # Weather score would be calculated based on current weather
            # This is a placeholder
            weather_score = 1.0
        
        return (type_need * 0.4) + (personalization_score * 0.3) + (rating * 0.2) + (weather_score * 0.1)

    def _get_activity_duration(self, activity):
        """Get estimated duration for an activity in minutes"""
        if hasattr(activity, 'duration'):  # Experience
            return activity.duration
        return getattr(activity, 'metadata', {}).get('average_visit_duration', 120)  # Default 2 hours for places

    def _get_activity_cost(self, activity):
        """Get cost for an activity"""
        if hasattr(activity, 'price_per_person'):  # Experience
            return activity.price_per_person
        return getattr(activity, 'price', 0) or 0  # Place

    def _get_activity_opening_hours(self, activity):
        """Get opening hours for an activity"""
        if hasattr(activity, 'opening_hours'):
            return activity.opening_hours
        return getattr(activity, 'metadata', {}).get('opening_hours')

    def _generate_activity_notes(self, activity):
        """Generate helpful notes for an activity"""
        notes = []
        
        if hasattr(activity, 'opening_hours'):
            notes.append(f"Opening hours: {activity.opening_hours}")
        elif hasattr(activity, 'metadata') and 'opening_hours' in activity.metadata:
            notes.append(f"Opening hours: {activity.metadata['opening_hours']}")
        
        if hasattr(activity, 'metadata') and activity.metadata.get('tips'):
            notes.append(f"Tip: {activity.metadata['tips'][0]}")
        
        if hasattr(activity, 'metadata') and activity.metadata.get('popularity_score', 0) > 0.7:
            notes.append("This is a popular attraction. Consider visiting early to avoid crowds.")
            
        return "\n".join(notes) if notes else None

    def _calculate_total_price(self, itinerary_days):
        """Calculate total price of all itinerary items"""
        total = 0.0
        
        for day in itinerary_days:
            for item in day.items.all():
                if item.estimated_cost:
                    total += item.estimated_cost
                    
        return round(total, 2)

    def optimize_existing_box(self, box):
        """
        Optimize an existing box's itinerary considering:
        - User preferences
        - Updated availability
        - Better activity combinations
        - Weather forecast (if available)
        """
        try:
            with transaction.atomic():
                # Delete existing itinerary
                box.itinerary_days.all().delete()
                
                # Regenerate with current recommendations
                destination = box.city or box.region or box.country
                return self.generate_box(
                    destination=destination,
                    duration_days=box.duration_days,
                    budget=box.total_price,
                    start_date=box.start_date,
                    theme=box.metadata.get('theme')
                )
                
        except Exception as e:
            logger.error(f"Error optimizing box {box.id}: {str(e)}")
            raise RuntimeError("Could not optimize box")

    def duplicate_and_modify_box(self, original_box, modifications):
        """
        Create a modified version of an existing box
        
        Args:
            original_box (Box): The box to duplicate
            modifications (dict): Changes to apply (duration, dates, etc.)
            
        Returns:
            Box: The new modified box
        """
        try:
            with transaction.atomic():
                # Create new box with modified properties
                new_box = Box.objects.create(
                    name=f"{original_box.name} (Modified)",
                    duration_days=modifications.get('duration_days', original_box.duration_days),
                    start_date=modifications.get('start_date', original_box.start_date),
                    end_date=modifications.get('end_date', original_box.end_date),
                    city=original_box.city,
                    region=original_box.region,
                    country=original_box.country,
                    is_customizable=True,
                    owner=self.user,
                    metadata={
                        **original_box.metadata,
                        'original_box_id': original_box.id,
                        'modifications': modifications
                    }
                )
                
                # Copy itinerary with adjustments
                for old_day in original_box.itinerary_days.order_by('day_number'):
                    new_day = BoxItineraryDay.objects.create(
                        box=new_box,
                        day_number=old_day.day_number,
                        date=(new_box.start_date + timedelta(days=old_day.day_number - 1)
                            if new_box.start_date else None
                    ))
                    
                    for old_item in old_day.items.order_by('order'):
                        BoxItineraryItem.objects.create(
                            itinerary_day=new_day,
                            place=old_item.place,
                            experience=old_item.experience,
                            order=old_item.order,
                            start_time=old_item.start_time,
                            end_time=old_item.end_time,
                            duration_minutes=old_item.duration_minutes,
                            estimated_cost=old_item.estimated_cost,
                            notes=old_item.notes,
                            is_optional=old_item.is_optional
                        )
                
                return new_box
                
        except Exception as e:
            logger.error(f"Error duplicating box {original_box.id}: {str(e)}")
            raise RuntimeError("Could not duplicate box")
