import logging
from datetime import timedelta, datetime, time
from django.db import transaction
from django.contrib.gis.geos import Point
from apps.authentication.models import User
from apps.safar.models import (Notification,Box, BoxItineraryDay, BoxItineraryItem)
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
        'max_daily_items': 4,
        'max_daily_hours': 10,
        'min_rest_hours': 8,
        'max_travel_time_minutes': 90,
        'opening_hours': (9, 20),
        'max_daily_budget': None,
        'activity_weights': {
            'cultural': 0.4,
            'outdoor': 0.3,
            'leisure': 0.2,
            'shopping': 0.1
        },
        'time_of_day_preferences': {
            'cultural': ['morning', 'afternoon'],
            'outdoor': ['morning', 'afternoon'],
            'leisure': ['afternoon', 'evening'],
            'shopping': ['afternoon']
        },
        'min_activity_spacing_minutes': 60,
        'avoid_peak_hours': True,
    }

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

            self._validate_inputs(destination, duration_days, budget)
            
            self._apply_theme_constraints(theme)
            
            daily_budget = budget / duration_days if budget else None
            
            box = self._create_base_box(
                destination=destination,
                duration_days=duration_days,
                start_date=start_date,
                theme=theme
            )
            
            recommendations = self.recommendation_engine.recommend_for_box(
                destination=destination,
                duration_days=duration_days
            )
            
            itinerary = self._generate_itinerary(
                box=box,
                places=recommendations['places'],
                experiences=recommendations['experiences'],
                daily_budget=daily_budget
            )
            
            box.total_price = self._calculate_total_price(itinerary)
            box.save()
            
            box.metadata.update({
                'generated': True,
                'algorithm_version': '2.0',
                'constraints_used': self.constraints,
                'theme': theme,
                'generation_date': datetime.now().isoformat()
            })
            box.save()
            
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
                channels=["app", "email"]
            )
            
            logger.info(f"Created notification for box {box.id} for user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Failed to create notification for box {box.id}: {str(e)}")
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
                'min_activity_spacing_minutes': 120,
                'time_of_day_preferences': {
                    'leisure': ['morning', 'afternoon', 'evening'],
                    'cultural': ['afternoon'],
                    'shopping': ['afternoon']
                }
            })
        elif theme == 'cultural':
            self.constraints.update({
                'activity_weights': {'cultural': 0.7, 'outdoor': 0.2, 'leisure': 0.1},
                'max_travel_time_minutes': 60,
                'time_of_day_preferences': {
                    'cultural': ['morning', 'afternoon'],
                    'outdoor': ['afternoon'],
                    'leisure': ['evening']
                }
            })
        elif theme == 'family':
            self.constraints.update({
                'activity_weights': {'outdoor': 0.4, 'cultural': 0.3, 'leisure': 0.2, 'shopping': 0.1},
                'max_daily_hours': 8,
                'max_travel_time_minutes': 45,
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
                # 'max_daily_budget': budget / duration_days * 0.8 if budget else None,  # 20% buffer
            })

    def _create_base_box(self, destination, duration_days, start_date, theme):
        """Create the base box object with proper metadata"""
        from apps.safar.models import Category

        default_category = Category.objects.first()
        box_data = {
            'name': self._generate_box_name(destination, duration_days, theme),
            'duration_days': duration_days,
            'is_customizable': True,
            # 'owner': self.user,
            'category': default_category,
            'metadata': {
                'generation_parameters': {
                    'destination': str(destination),
                    'destination_type': type(destination).__name__,
                    'duration_days': duration_days,
                    'theme': theme
                }
            }
        }
        
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
            
        if start_date:
            box_data.update({
                'start_date': start_date,
                'end_date': start_date + timedelta(days=duration_days - 1)
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
        
        all_activities = self._combine_and_prioritize_activities(places, experiences)
        
        clustered_activities = self._cluster_activities_by_location_ml(all_activities)

        has_weather_data = self._check_weather_data_availability(box)
        
        for day_num in range(1, box.duration_days + 1):
            weather = self._get_weather_for_day(box, day_num) if has_weather_data else None
            
            day_itinerary = self._generate_day_itinerary(
                box=box,
                day_num=day_num,
                clustered_activities=clustered_activities,
                daily_budget=daily_budget,
                weather=weather
            )
            itinerary_days.append(day_itinerary)
            
            scheduled_ids = [
                item.place_id or item.experience_id 
                for item in day_itinerary.items.all() 
                if item.place_id or item.experience_id
            ]
            
            for cluster in clustered_activities:
                cluster['activities'] = [
                    act for act in cluster['activities'] 
                    if getattr(act, 'id', None) not in scheduled_ids
                ]
            
            clustered_activities = [c for c in clustered_activities if c['activities']]
        
        return itinerary_days

    def _combine_and_prioritize_activities(self, places, experiences):
        activities = []
        
        for place in places:
            place_meta = getattr(place, 'metadata', {}) or {}
            activities.append({
                'type': 'place',
                'object': place,
                'duration': place_meta.get('average_visit_duration', 120),
                'cost': getattr(place, 'price', 0),
                'opening_hours': place_meta.get('opening_hours'),
                'activity_type': place_meta.get('activity_type', 'cultural'),
                'popularity': place_meta.get('popularity_score', 0.5),
                'indoor': place_meta.get('is_indoor', False)
            })
        
        for experience in experiences:
            exp_meta = getattr(experience, 'metadata', {}) or {}
            activities.append({
                'type': 'experience',
                'object': experience,
                'duration': getattr(experience, 'duration', 120),
                'cost': getattr(experience, 'price_per_person', 0),
                'opening_hours': getattr(experience, 'schedule', None),
                'activity_type': exp_meta.get('activity_type', 'outdoor'),
                'popularity': exp_meta.get('popularity_score', 0.5),
                'indoor': exp_meta.get('is_indoor', False)
            })

        for activity in activities:
            activity['personalization_score'] = self.recommendation_engine.calculate_personalization_score(activity['object'])
            activity['rating'] = getattr(activity['object'], 'rating', 3.0)
        
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
            
        located_activities = [a for a in activities if hasattr(a['object'], 'location') and a['object'].location]
        
        if not located_activities:
            return [{
                'center': None,
                'activities': [a['object'] for a in activities]
            }]
        
        coordinates = []
        for activity in located_activities:
            loc = activity['object'].location
            coordinates.append([loc.x, loc.y])
        
        X = np.array(coordinates)
        
        if len(X) < 2:
            return [{
                'center': located_activities[0]['object'].location,
                'activities': [a['object'] for a in located_activities]
            }]

        avg_lat = np.mean(X[:, 1])
        km_per_degree_lon = 111 * np.cos(np.radians(avg_lat))
        epsilon_lat = max_distance_km / 111.0
        epsilon_lon = max_distance_km / km_per_degree_lon
        
        def gis_distance(p1, p2):
            """Calculate distance between two points using Django GIS"""
            point1 = Point(p1[0], p1[1], srid=4326)
            point2 = Point(p2[0], p2[1], srid=4326)
            return point1.distance(point2) * 100
 
        db = DBSCAN(
            eps=max(epsilon_lat, epsilon_lon),
            min_samples=1,
            metric=gis_distance
        ).fit(X)
        
        labels = db.labels_
 
        clusters = []
        for label in set(labels):
            cluster_indices = np.where(labels == label)[0]
            cluster_activities = [located_activities[i]['object'] for i in cluster_indices]

            cluster_points = [act.location for act in cluster_activities]
            centroid = self._calculate_centroid(cluster_points)
            
            clusters.append({
                'center': centroid,
                'activities': cluster_activities
            })

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
        try:
            if not box.start_date:
                return False

            return False
        except Exception as e:
            logger.warning(f"Error checking weather data: {str(e)}")
            return False

    def _get_weather_for_day(self, box, day_num):
        """Get weather forecast for a specific day"""
        try:
            if not box.start_date:
                return None
                
            date = box.start_date + timedelta(days=day_num - 1)

            return None
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
        
        if weather:
            day.metadata = {'weather': weather}
            day.save()

        selected_items = []
        remaining_hours = self.constraints['max_daily_hours']
        remaining_budget = daily_budget
        activity_counts = {key: 0 for key in self.constraints['activity_weights'].keys()}
        
        target_counts = {
            key: round(val * self.constraints['max_daily_items'])
            for key, val in self.constraints['activity_weights'].items()
        }
        
        if weather and 'condition' in weather:
            self._adjust_for_weather(target_counts, weather)

        time_slots = self._initialize_time_slots(day)

        selected_cluster = self._select_best_cluster_for_day(clustered_activities, day_num, box.duration_days)
        
        if not selected_cluster:
            all_activities = []
            for cluster in clustered_activities:
                all_activities.extend(cluster['activities'])
            
            if not all_activities:
                logger.warning(f"No activities available for day {day_num}")
                return day
                
            all_activities.sort(
                key=lambda x: self._activity_priority_score(x, activity_counts, target_counts),
                reverse=True
            )

            self._schedule_activities_in_time_slots(
                day=day,
                activities=all_activities,
                time_slots=time_slots,
                activity_counts=activity_counts,
                target_counts=target_counts,
                remaining_budget=remaining_budget
            )
        else:
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
            if 'outdoor' in target_counts and 'cultural' in target_counts:
                target_counts['outdoor'] = max(0, target_counts['outdoor'] - 1)
                target_counts['cultural'] = target_counts['cultural'] + 1
        elif 'sunny' in condition or 'clear' in condition:
            if 'outdoor' in target_counts and 'cultural' in target_counts:
                target_counts['outdoor'] = target_counts['outdoor'] + 1
                target_counts['cultural'] = max(0, target_counts['cultural'] - 1)

    def _initialize_time_slots(self, day):
        """Initialize time slots for scheduling activities"""
        start_hour, end_hour = self.constraints['opening_hours']
        
        time_slots = []
        current_time = time(start_hour, 0)
        
        while current_time.hour < end_hour:
            slot = {
                'start_time': current_time,
                'is_available': True,
                'activity': None
            }

            minutes = current_time.minute + 30
            hour = current_time.hour + minutes // 60
            minutes = minutes % 60
            
            if hour < 24:
                slot['end_time'] = time(hour, minutes)
                time_slots.append(slot)
            
            current_time = slot['end_time']
        
        return time_slots

    def _select_best_cluster_for_day(self, clustered_activities, day_num, total_days):
        """Select the best geographic cluster for a specific day"""
        if not clustered_activities:
            return None
            
        if total_days == 1:
            return max(clustered_activities, key=lambda c: sum(
                self._get_activity_priority(a) for a in c['activities']
            ))

        sorted_clusters = sorted(
            clustered_activities,
            key=lambda c: sum(self._get_activity_priority(a) for a in c['activities']),
            reverse=True
        )

        cluster_index = (day_num - 1) % len(sorted_clusters)
        return sorted_clusters[cluster_index]

    def _get_activity_priority(self, activity):
        """Calculate priority score for an activity"""
        personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
        rating = getattr(activity, 'rating', 3.0)
        return (personalization_score * 0.7) + (rating * 0.3)

    def _schedule_activities_in_time_slots(self, day, activities, time_slots, activity_counts, target_counts, remaining_budget):
        """Schedule activities in available time slots"""
        sorted_activities = sorted(
            activities,
            key=lambda x: self._activity_priority_score(x, activity_counts, target_counts),
            reverse=True
        )

        scheduled_items = []

        for activity in sorted_activities:
            if len(scheduled_items) >= self.constraints['max_daily_items']:
                break
                
            activity_type = getattr(activity, 'metadata', {}).get('activity_type', 'cultural')
            preferred_times = self.constraints['time_of_day_preferences'].get(activity_type, ['morning', 'afternoon'])

            suitable_slot = self._find_suitable_time_slot(
                activity=activity,
                time_slots=time_slots,
                preferred_times=preferred_times
            )
            
            if suitable_slot:
                cost = self._get_activity_cost(activity)
                if remaining_budget is not None and cost > remaining_budget:
                    continue

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

        if len(scheduled_items) < self.constraints['max_daily_items']:
            for activity in sorted_activities:
                if activity in [item.place or item.experience for item in scheduled_items]:
                    continue
                    
                if len(scheduled_items) >= self.constraints['max_daily_items']:
                    break
       
                suitable_slot = self._find_suitable_time_slot(
                    activity=activity,
                    time_slots=time_slots,
                    preferred_times=None
                )
                
                if suitable_slot:
                    cost = self._get_activity_cost(activity)
                    if remaining_budget is not None and cost > remaining_budget:
                        continue
                    
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

        BoxItineraryItem.objects.bulk_create(scheduled_items)

    def _find_suitable_time_slot(self, activity, time_slots, preferred_times=None):
        """Find a suitable time slot for an activity"""
        duration_minutes = self._get_activity_duration(activity)
        slots_needed = max(1, duration_minutes // 30)

        opening_hours = self._get_activity_opening_hours(activity)

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
        
        for i in range(len(preferred_slots) - slots_needed + 1):
            consecutive_slots = preferred_slots[i:i+slots_needed]
            
            if all(slot['is_available'] for slot in consecutive_slots):
                start_time = consecutive_slots[0]['start_time']
                end_time = consecutive_slots[-1]['end_time']
                
                if opening_hours and not self._is_within_opening_hours(start_time, end_time, opening_hours):
                    continue
                
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
            
        try:
            open_time = time(opening_hours[0], 0)
            close_time = time(opening_hours[1], 0)
            
            return open_time <= start_time and end_time <= close_time
        except (IndexError, TypeError):
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
        
        if hasattr(activity, 'price'):
            item.place = activity
        else: 
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
        rating = getattr(activity, 'rating', 3.0)
        
        weather_score = 1.0
        if hasattr(activity, 'metadata') and 'is_indoor' in activity.metadata:
            is_indoor = activity.metadata['is_indoor']
            weather_score = 1.0
        
        return (type_need * 0.4) + (personalization_score * 0.3) + (rating * 0.2) + (weather_score * 0.1)

    def _get_activity_duration(self, activity):
        """Get estimated duration for an activity in minutes"""
        if hasattr(activity, 'duration'):
            return activity.duration
        return getattr(activity, 'metadata', {}).get('average_visit_duration', 120)

    def _get_activity_cost(self, activity):
        """Get cost for an activity"""
        if hasattr(activity, 'price_per_person'):
            return activity.price_per_person
        return getattr(activity, 'price', 0) or 0 

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
                box.itinerary_days.all().delete()

                destination = box.city or box.region or box.country
                return self.generate_box(
                    destination=destination,
                    duration_days=box.duration_days,
                    budget=box.total_price,
                    start_date=box.start_date,
                    category=category,
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
                new_box = Box.objects.create(
                    name=f"{original_box.name} (Modified)",
                    duration_days=modifications.get('duration_days', original_box.duration_days),
                    start_date=modifications.get('start_date', original_box.start_date),
                    end_date=modifications.get('end_date', original_box.end_date),
                    city=original_box.city,
                    region=original_box.region,
                    country=original_box.country,
                    is_customizable=True,
                    # owner=self.user,
                    metadata={
                        **original_box.metadata,
                        'original_box_id': original_box.id,
                        'modifications': modifications
                    }
                )
                
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
