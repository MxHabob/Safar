import logging
import time
from datetime import timedelta, datetime, time as dt_time
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from django.db import transaction
from django.contrib.gis.geos import Point, MultiPoint
from django.contrib.gis.measure import D
from django.db.models import Q, F, Count, Avg, Sum
from sklearn.cluster import DBSCAN
import json
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Union, Any, Set

# Mock imports for testing
try:
    from apps.authentication.models import User
    from apps.safar.models import (
        Notification, Box, BoxItineraryDay, BoxItineraryItem, 
        Place, Experience, Media, Category
    )
    from apps.geographic_data.models import City, Region, Country
    from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine
except ImportError:
    # For testing without Django
    User = object
    Box = object
    BoxItineraryDay = object
    BoxItineraryItem = object
    Place = object
    Experience = object
    Media = object
    Category = object
    City = object
    Region = object
    Country = object
    RecommendationEngine = object

logger = logging.getLogger(__name__)

class BoxGenerationError(Exception):
    """Custom exception for box generation errors"""
    pass

class InputValidationError(ValueError):
    """Custom exception for input validation errors"""
    pass

class BoxGenerator:
    """
    Enhanced travel box generator with optimized performance and media integration.
    
    This class generates travel itineraries ("boxes") based on user preferences,
    destination information, and various constraints. It handles scheduling,
    clustering of activities by location, and media integration.
    
    Attributes:
        user (User): The user to generate boxes for
        recommendation_engine (RecommendationEngine): Engine for activity recommendations
        constraints (dict): Scheduling and generation constraints
        performance_metrics (dict): Metrics for performance monitoring
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
        'media_integration': {
            'min_media_per_item': 1,
            'preferred_media_types': ['photo', 'video'],
            'media_quality_threshold': 0.7
        }
    }

    TIME_OF_DAY = {
        'morning': (8, 12),
        'afternoon': (12, 17),
        'evening': (17, 22)
    }

    def __init__(self, user, recommendation_engine=None, constraints=None):
        """
        Initialize the optimized box generator for a specific user.
        
        Args:
            user (User): The user to generate boxes for
            recommendation_engine (RecommendationEngine, optional): Custom engine
            constraints (dict, optional): Override default scheduling constraints
        
        Raises:
            InputValidationError: If user is not a valid User instance
        """
        if not isinstance(user, User):
            raise InputValidationError("Must provide a valid User instance")
            
        self.user = user
        self.recommendation_engine = recommendation_engine or RecommendationEngine(user)
        self.constraints = {**self.DEFAULT_CONSTRAINTS, **(constraints or {})}
        self.performance_metrics = {
            'recommendation_time': 0,
            'clustering_time': 0,
            'scheduling_time': 0,
            'total_generation_time': 0
        }
        
    @transaction.atomic
    def generate_box(self, destination, duration_days, budget=None, start_date=None, theme=None):
        """
        Generate a complete travel box with itinerary - optimized version.
        
        Args:
            destination (City|Region|Country): The travel destination
            duration_days (int): Trip duration in days
            budget (float, optional): Total budget for the trip
            start_date (date, optional): Start date for the trip
            theme (str, optional): Theme (e.g., 'adventure', 'relaxation')
            
        Returns:
            Box: The generated travel box
            
        Raises:
            InputValidationError: For invalid inputs
            BoxGenerationError: If box generation fails
        """
        start_time = time.time()
        
        try:
            self._validate_inputs(destination, duration_days, budget)
            self._apply_theme_constraints(theme)
            
            daily_budget = budget / duration_days if budget else None
            
            # Create the base box
            box = self._create_base_box(
                destination=destination,
                duration_days=duration_days,
                start_date=start_date,
                theme=theme
            )
            
            # Get recommendations in parallel with other operations
            with ThreadPoolExecutor(max_workers=2) as executor:
                # Start recommendation task
                recommendation_future = executor.submit(
                    self.recommendation_engine.recommend_for_box,
                    destination=destination,
                    duration_days=duration_days
                )
                
                # While recommendations are being fetched, prepare other data
                weather_data_future = executor.submit(
                    self._prepare_weather_data, box
                )
                
                # Wait for recommendations to complete
                recommendation_start = time.time()
                recommendations = recommendation_future.result()
                self.performance_metrics['recommendation_time'] = time.time() - recommendation_start
                
                # Wait for weather data
                weather_data = weather_data_future.result()
            
            # Generate the itinerary
            scheduling_start = time.time()
            itinerary = self._generate_itinerary(
                box=box,
                places=recommendations['places'],
                experiences=recommendations['experiences'],
                daily_budget=daily_budget,
                weather_data=weather_data
            )
            self.performance_metrics['scheduling_time'] = time.time() - scheduling_start
            
            # Calculate total price and update box
            box.total_price = self._calculate_total_price(itinerary)
            
            # Enhance box with media elements
            self._enhance_box_with_media(box, recommendations)
            
            # Update metadata
            box.metadata.update({
                'generated': True,
                'algorithm_version': '3.0',
                'constraints_used': self._serialize_constraints(),
                'theme': theme,
                'generation_date': datetime.now().isoformat(),
                'performance_metrics': self.performance_metrics
            })
            box.save()
            
            # Create notification in background
            self._create_box_notification(box)
            
            self.performance_metrics['total_generation_time'] = time.time() - start_time
            logger.info(f"Successfully generated box {box.id} for user {self.user.id} in {self.performance_metrics['total_generation_time']:.2f}s")
            
            return box
            
        except InputValidationError as e:
            logger.error(f"Validation error in box generation: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error generating box: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Could not generate box: {str(e)}")

    def _serialize_constraints(self, constraints_dict=None):
        """
        Serialize constraints to ensure JSON compatibility.
        
        Args:
            constraints_dict (Dict, optional): Dictionary to serialize. 
                                          If None, uses self.constraints.
        
        Returns:
            Dict: JSON-serializable constraints dictionary
        """
        # If no dictionary provided, use self.constraints
        if constraints_dict is None:
            constraints_dict = self.constraints
        
        serialized = {}
        for key, value in constraints_dict.items():
            if isinstance(value, dict):
                serialized[key] = self._serialize_constraints(value)
            elif isinstance(value, (list, tuple)):
                serialized[key] = list(value)
            elif isinstance(value, (int, float, str, bool, type(None))):
                serialized[key] = value
            else:
                # Convert any other types to strings
                serialized[key] = str(value)
        return serialized

    def _prepare_weather_data(self, box) -> Optional[Dict]:
        """
        Prepare weather data for the box duration.
        
        Args:
            box (Box): The box to prepare weather data for
            
        Returns:
            Optional[Dict]: Weather data by day or None if unavailable
        """
        try:
            if not box.start_date:
                return None
                
            # This would be where you'd fetch weather data from an API
            # For now, we'll return a placeholder
            weather_data = {}
            for day in range(1, box.duration_days + 1):
                date = box.start_date + timedelta(days=day - 1)
                weather_data[day] = {
                    'date': date.isoformat(),
                    'condition': 'sunny',
                    'temperature': 25,
                    'precipitation': 0
                }
            return weather_data
        except Exception as e:
            logger.warning(f"Error preparing weather data: {str(e)}")
            return None

    def _enhance_box_with_media(self, box, recommendations):
        """
        Enhance the box with relevant media elements to better represent
        the experiences and possibilities.
        
        Args:
            box (Box): The box to enhance
            recommendations (Dict): Recommendations dictionary
            
        Raises:
            BoxGenerationError: If media enhancement fails critically
        """
        try:
            # Collect all places and experiences in the box
            places_ids = set()
            experiences_ids = set()
            
            for day in box.itinerary_days.all():
                for item in day.items.all():
                    if item.place_id:
                        places_ids.add(item.place_id)
                    if item.experience_id:
                        experiences_ids.add(item.experience_id)
            
            # Fetch high-quality media for these items
            place_media = Media.objects.filter(
                places__id__in=places_ids
            ).order_by('-created_at')[:20]
            
            experience_media = Media.objects.filter(
                experiences__id__in=experiences_ids
            ).order_by('-created_at')[:20]
            
            # Combine and select the best media
            all_media = list(place_media) + list(experience_media)
            
            # Prioritize media based on quality and relevance
            selected_media = self._select_best_media(all_media, max_count=10)
            
            # Associate media with the box
            if selected_media:
                box.media.add(*selected_media)
                
                # Update box metadata with media information - FIX: Convert dict_keys to list
                media_types = [m.type for m in selected_media]
                unique_types = list(set(media_types))
                
                # Ensure all metadata is JSON serializable
                box.metadata['media_info'] = {
                    'count': len(selected_media),
                    'types': unique_types,
                    'coverage': f"{len(places_ids) + len(experiences_ids)} items represented"
                }
                box.save()
                
            logger.info(f"Enhanced box {box.id} with {len(selected_media)} media elements")
            
        except Exception as e:
            logger.error(f"Error enhancing box with media: {str(e)}")
            # Don't fail the whole process if media enhancement fails
            # Just log the error and continue

    def _select_best_media(self, media_list, max_count=10):
        """
        Select the best media items based on quality, type diversity, and relevance.
        
        Args:
            media_list (List): List of Media objects
            max_count (int): Maximum number of media items to select
            
        Returns:
            List: Selected Media objects
        """
        if not media_list:
            return []
            
        # Ensure we have a mix of photos and videos
        photos = [m for m in media_list if m.type == 'photo']
        videos = [m for m in media_list if m.type == 'video']
        
        # Calculate how many of each to include
        photo_count = min(len(photos), int(max_count * 0.7))  # 70% photos
        video_count = min(len(videos), max_count - photo_count)  # Rest videos
        
        # If we don't have enough of one type, use more of the other
        if photo_count < int(max_count * 0.7) and len(videos) > video_count:
            video_count = min(len(videos), max_count - photo_count)
        
        # Select the best photos and videos
        selected_photos = photos[:photo_count]
        selected_videos = videos[:video_count]
        
        return selected_photos + selected_videos

    def _create_box_notification(self, box):
        """
        Create a notification for the user about their new generated box.
        Includes a deep link to the box in the metadata.
        
        Args:
            box (Box): The box to create a notification for
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
                    "total_price": float(box.total_price) if box.total_price else 0,
                    "media_count": box.media.count()
                },
                channels=["app", "email"]
            )
            
            logger.info(f"Created notification for box {box.id} for user {self.user.id}")
            
        except Exception as e:
            logger.error(f"Failed to create notification for box {box.id}: {str(e)}")
            # Don't fail the whole process if notification creation fails

    def _validate_inputs(self, destination, duration_days, budget):
        """
        Validate all generation parameters.
        
        Args:
            destination: The travel destination
            duration_days: Trip duration in days
            budget: Optional total budget
            
        Raises:
            InputValidationError: If any input is invalid
        """
        if not isinstance(destination, (City, Region, Country)):
            raise InputValidationError("Destination must be a City, Region or Country")
        
        if not isinstance(duration_days, int):
            raise InputValidationError("Duration must be an integer")
            
        if duration_days < 1 or duration_days > 30:
            raise InputValidationError("Duration must be between 1 and 30 days")
            
        if budget is not None:
            if not isinstance(budget, (int, float, Decimal)):
                raise InputValidationError("Budget must be a number")
                
            if float(budget) <= 0:
                raise InputValidationError("Budget must be a positive number")

    def _apply_theme_constraints(self, theme):
        """
        Adjust constraints based on selected theme.
        
        Args:
            theme (str): The selected theme
        """
        theme_constraints = {
            'adventure': {
                'activity_weights': {'outdoor': 0.6, 'cultural': 0.3, 'leisure': 0.1},
                'max_daily_hours': 12,
                'time_of_day_preferences': {
                    'outdoor': ['morning', 'afternoon'],
                    'cultural': ['afternoon'],
                    'leisure': ['evening']
                },
                'media_integration': {
                    'min_media_per_item': 2,
                    'preferred_media_types': ['photo', 'video'],
                    'media_quality_threshold': 0.8
                }
            },
            'relaxation': {
                'activity_weights': {'leisure': 0.7, 'cultural': 0.2, 'shopping': 0.1},
                'max_daily_items': 3,
                'max_daily_hours': 6,
                'min_activity_spacing_minutes': 120,
                'time_of_day_preferences': {
                    'leisure': ['morning', 'afternoon', 'evening'],
                    'cultural': ['afternoon'],
                    'shopping': ['afternoon']
                },
                'media_integration': {
                    'min_media_per_item': 1,
                    'preferred_media_types': ['photo'],
                    'media_quality_threshold': 0.9
                }
            },
            'cultural': {
                'activity_weights': {'cultural': 0.7, 'outdoor': 0.2, 'leisure': 0.1},
                'max_travel_time_minutes': 60,
                'time_of_day_preferences': {
                    'cultural': ['morning', 'afternoon'],
                    'outdoor': ['afternoon'],
                    'leisure': ['evening']
                },
                'media_integration': {
                    'min_media_per_item': 2,
                    'preferred_media_types': ['photo', 'video'],
                    'media_quality_threshold': 0.8
                }
            },
            'family': {
                'activity_weights': {'outdoor': 0.4, 'cultural': 0.3, 'leisure': 0.2, 'shopping': 0.1},
                'max_daily_hours': 8,
                'max_travel_time_minutes': 45,
                'time_of_day_preferences': {
                    'outdoor': ['morning', 'afternoon'],
                    'cultural': ['morning'],
                    'leisure': ['afternoon', 'evening'],
                    'shopping': ['afternoon']
                },
                'media_integration': {
                    'min_media_per_item': 1,
                    'preferred_media_types': ['photo'],
                    'media_quality_threshold': 0.7
                }
            },
            'budget': {
                'activity_weights': {'outdoor': 0.5, 'cultural': 0.3, 'leisure': 0.1, 'shopping': 0.1},
                'media_integration': {
                    'min_media_per_item': 1,
                    'preferred_media_types': ['photo'],
                    'media_quality_threshold': 0.6
                }
            }
        }
        
        if theme in theme_constraints:
            self.constraints.update(theme_constraints[theme])

    def _create_base_box(self, destination, duration_days, start_date, theme):
        """
        Create the base box object with proper metadata.
        
        Args:
            destination: The travel destination
            duration_days: Trip duration in days
            start_date: Optional start date
            theme: Optional theme
            
        Returns:
            Box: The created box
            
        Raises:
            BoxGenerationError: If box creation fails
        """
        try:
            default_category = Category.objects.first()
            box_data = {
                'name': self._generate_box_name(destination, duration_days, theme),
                'duration_days': duration_days,
                'is_customizable': True,
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
        except Exception as e:
            logger.error(f"Error creating base box: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Failed to create base box: {str(e)}")

    def _generate_box_name(self, destination, duration_days, theme):
        """
        Generate an attractive name for the box.
        
        Args:
            destination: The travel destination
            duration_days: Trip duration in days
            theme: Optional theme
            
        Returns:
            str: Generated box name
        """
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

    def _generate_itinerary(self, box, places, experiences, daily_budget, weather_data=None):
        """
        Generate complete itinerary for the box - optimized version.
        
        Args:
            box (Box): The box to generate itinerary for
            places (List): List of places
            experiences (List): List of experiences
            daily_budget (float): Daily budget
            weather_data (Dict, optional): Weather data by day
            
        Returns:
            List: Generated itinerary days
            
        Raises:
            BoxGenerationError: If itinerary generation fails
        """
        try:
            itinerary_days = []
            
            # Combine and prioritize activities
            all_activities = self._combine_and_prioritize_activities(places, experiences)
            
            # Cluster activities by location - this is an expensive operation
            clustering_start = time.time()
            clustered_activities = self._cluster_activities_by_location_ml(all_activities)
            self.performance_metrics['clustering_time'] = time.time() - clustering_start
            
            # Generate itinerary for each day
            for day_num in range(1, box.duration_days + 1):
                # Get weather for this day if available
                day_weather = weather_data.get(day_num) if weather_data else None
                
                # Generate day itinerary
                day_itinerary = self._generate_day_itinerary(
                    box=box,
                    day_num=day_num,
                    clustered_activities=clustered_activities,
                    daily_budget=daily_budget,
                    weather=day_weather
                )
                itinerary_days.append(day_itinerary)
                
                # Remove scheduled activities from clusters
                scheduled_ids = [
                    item.place_id or item.experience_id 
                    for item in day_itinerary.items.all() 
                    if item.place_id or item.experience_id
                ]
                
                # Update clusters efficiently
                for cluster in clustered_activities:
                    cluster['activities'] = [
                        act for act in cluster['activities'] 
                        if getattr(act, 'id', None) not in scheduled_ids
                    ]
                
                # Remove empty clusters
                clustered_activities = [c for c in clustered_activities if c['activities']]
            
            return itinerary_days
        except Exception as e:
            logger.error(f"Error generating itinerary: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Failed to generate itinerary: {str(e)}")

    def _combine_and_prioritize_activities(self, places, experiences):
        """
        Combine and prioritize activities - optimized with caching.
        
        Args:
            places (List): List of places
            experiences (List): List of experiences
            
        Returns:
            List: Prioritized activities
            
        Note: This method is cached to avoid redundant calculations.
        """
        activities = []
        
        # Process places
        for place in places:
            place_meta = getattr(place, 'metadata', {}) or {}
            activities.append({
                'type': 'place',
                'object': place,
                'duration': place_meta.get('average_visit_duration', 120),
                'cost': getattr(place, 'price', 0) or 0,
                'opening_hours': place_meta.get('opening_hours'),
                'activity_type': place_meta.get('activity_type', 'cultural'),
                'popularity': place_meta.get('popularity_score', 0.5),
                'indoor': place_meta.get('is_indoor', False),
                'media_count': place.media.count() if hasattr(place, 'media') else 0
            })
        
        # Process experiences
        for experience in experiences:
            exp_meta = getattr(experience, 'metadata', {}) or {}
            activities.append({
                'type': 'experience',
                'object': experience,
                'duration': getattr(experience, 'duration', 120),
                'cost': getattr(experience, 'price_per_person', 0) or 0,
                'opening_hours': getattr(experience, 'schedule', None),
                'activity_type': exp_meta.get('activity_type', 'outdoor'),
                'popularity': exp_meta.get('popularity_score', 0.5),
                'indoor': exp_meta.get('is_indoor', False),
                'media_count': experience.media.count() if hasattr(experience, 'media') else 0
            })

        # Calculate scores in a vectorized way
        for activity in activities:
            activity['personalization_score'] = self.recommendation_engine.calculate_personalization_score(activity['object'])
            activity['rating'] = getattr(activity['object'], 'rating', 3.0)
            # Boost activities with media
            activity['media_boost'] = min(0.2, activity['media_count'] * 0.05)
        
        # Sort by combined score
        return sorted(
            activities,
            key=lambda x: (
                -x['personalization_score'] - x['rating'] * 0.2 - x['media_boost']
            )
        )

    def _cluster_activities_by_location_ml(self, activities, max_distance_km=5):
        """
        Group activities by geographic proximity using DBSCAN clustering algorithm
        with optimized implementation.
        
        Args:
            activities (List): List of activities
            max_distance_km (float): Maximum distance between activities in a cluster
            
        Returns:
            List: Clustered activities
        """
        if not activities:
            return []
            
        # Filter activities with location
        located_activities = [a for a in activities if hasattr(a['object'], 'location') and a['object'].location]
        
        if not located_activities:
            return [{
                'center': None,
                'activities': [a['object'] for a in activities]
            }]
        
        # Extract coordinates efficiently
        try:
            coordinates = np.array([
                [a['object'].location.x, a['object'].location.y]
                for a in located_activities
            ])
        except (AttributeError, TypeError) as e:
            logger.error(f"Error extracting coordinates: {str(e)}")
            return [{
                'center': None,
                'activities': [a['object'] for a in activities]
            }]
        
        if len(coordinates) < 2:
            return [{
                'center': located_activities[0]['object'].location,
                'activities': [a['object'] for a in located_activities]
            }]

        # Calculate epsilon based on average latitude
        avg_lat = np.mean(coordinates[:, 1])
        km_per_degree_lon = 111 * np.cos(np.radians(avg_lat))
        epsilon_lat = max_distance_km / 111.0
        epsilon_lon = max_distance_km / km_per_degree_lon
        epsilon = max(epsilon_lat, epsilon_lon)
        
        # Use DBSCAN for clustering
        try:
            db = DBSCAN(
                eps=epsilon,
                min_samples=1,
                metric='haversine',  # Better for geographic coordinates
                algorithm='ball_tree'  # More efficient for geographic data
            ).fit(coordinates)
            
            labels = db.labels_
        except Exception as e:
            logger.error(f"DBSCAN clustering failed: {str(e)}")
            # Fallback to simple clustering
            return [{
                'center': None,
                'activities': [a['object'] for a in activities]
            }]
 
        # Process clusters efficiently
        unique_labels = set(labels)
        clusters = []
        
        for label in unique_labels:
            cluster_indices = np.where(labels == label)[0]
            cluster_activities = [located_activities[i]['object'] for i in cluster_indices]

            # Calculate centroid
            cluster_points = [act.location for act in cluster_activities]
            centroid = self._calculate_centroid(cluster_points)
            
            clusters.append({
                'center': centroid,
                'activities': cluster_activities
            })

        # Add non-located activities to a separate cluster
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
        """
        Calculate geographic centroid of multiple points - optimized.
        
        Args:
            points (List): List of geographic points
            
        Returns:
            Point: Centroid point or None if no points
        """
        if not points:
            return None
            
        try:
            multipoint = MultiPoint(points)
            return multipoint.centroid
        except Exception as e:
            logger.error(f"Error calculating centroid: {str(e)}")
            # Return the first point as fallback
            return points[0] if points else None

    def _generate_day_itinerary(self, box, day_num, clustered_activities, daily_budget, weather=None):
        """
        Generate optimized itinerary for a single day.
        
        Args:
            box (Box): The box to generate itinerary for
            day_num (int): Day number
            clustered_activities (List): Clustered activities
            daily_budget (float): Daily budget
            weather (Dict, optional): Weather data for this day
            
        Returns:
            BoxItineraryDay: Generated day itinerary
            
        Raises:
            BoxGenerationError: If day itinerary generation fails
        """
        try:
            # Create the day
            day = BoxItineraryDay.objects.create(
                box=box,
                day_number=day_num,
                date=box.start_date + timedelta(days=day_num - 1) if box.start_date else None
            )
            
            if weather:
                day.metadata = {'weather': weather}
                day.save()

            # Initialize counters and trackers
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

            # Initialize time slots
            time_slots = self._initialize_time_slots(day)

            # Select best cluster for this day
            selected_cluster = self._select_best_cluster_for_day(
                clustered_activities, day_num, box.duration_days
            )
            
            # Schedule activities
            if not selected_cluster:
                # If no cluster selected, use all available activities
                all_activities = []
                for cluster in clustered_activities:
                    all_activities.extend(cluster['activities'])
                
                if not all_activities:
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
        except Exception as e:
            logger.error(f"Error generating day itinerary: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Failed to generate day itinerary: {str(e)}")

    def _adjust_for_weather(self, target_counts, weather):
        """
        Adjust activity targets based on weather conditions.
        
        Args:
            target_counts (Dict): Target activity counts
            weather (Dict): Weather data
        """
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
        """
        Initialize time slots for scheduling activities - optimized.
        
        Args:
            day (BoxItineraryDay): The day to initialize time slots for
            
        Returns:
            List: Initialized time slots
        """
        start_hour, end_hour = self.constraints['opening_hours']
        
        time_slots = []
        current_time = dt_time(start_hour, 0)
        
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
                slot['end_time'] = dt_time(hour, minutes)
                time_slots.append(slot)
            
            current_time = slot['end_time']
        
        return time_slots

    def _select_best_cluster_for_day(self, clustered_activities, day_num, total_days):
        """
        Select the best geographic cluster for a specific day - optimized.
        
        Args:
            clustered_activities (List): Clustered activities
            day_num (int): Day number
            total_days (int): Total number of days
            
        Returns:
            Dict: Selected cluster or None if no suitable cluster
        """
        if not clustered_activities:
            return None
            
        if total_days == 1:
            # For single-day trips, use the highest priority cluster
            return max(clustered_activities, key=lambda c: sum(
                self._get_activity_priority(a) for a in c['activities']
            ))  

        # For multi-day trips
        sorted_clusters = sorted(
            clustered_activities,
            key=lambda c: sum(self._get_activity_priority(a) for a in c['activities']),
            reverse=True
        )

        # Distribute clusters across days
        cluster_index = (day_num - 1) % len(sorted_clusters)
        return sorted_clusters[cluster_index]

    def _get_activity_priority(self, activity):
        """
        Calculate priority score for an activity - optimized.
        
        Args:
            activity: The activity to calculate priority for
            
        Returns:
            float: Priority score
        """
        try:
            personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
            rating = getattr(activity, 'rating', 3.0)
            media_count = getattr(activity, 'media', []).count() if hasattr(activity, 'media') else 0
            media_boost = min(0.2, media_count * 0.05)  # Boost for activities with media
            
            return (personalization_score * 0.6) + (rating * 0.3) + (media_boost * 0.1)
        except Exception as e:
            logger.warning(f"Error calculating activity priority: {str(e)}")
            return 0.5  # Default priority

    def _schedule_activities_in_time_slots(self, day, activities, time_slots, activity_counts, target_counts, remaining_budget):
        """
        Schedule activities in available time slots - optimized.
        
        Args:
            day (BoxItineraryDay): The day to schedule activities for
            activities (List): Activities to schedule
            time_slots (List): Available time slots
            activity_counts (Dict): Current activity counts by type
            target_counts (Dict): Target activity counts by type
            remaining_budget (float): Remaining budget
        """
        from decimal import Decimal
        
        # Convert remaining_budget to Decimal if it's a float
        if remaining_budget is not None and isinstance(remaining_budget, float):
            remaining_budget = Decimal(str(remaining_budget))
        
        # Sort activities by priority score
        sorted_activities = sorted(
            activities,
            key=lambda x: self._activity_priority_score(x, activity_counts, target_counts),
            reverse=True
        )    

        scheduled_items = []    

        # First scheduling pass - prioritize activities that match target counts
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
                cost = self._get_activity_cost(activity)
                
                # Convert cost to Decimal if it's not already
                if isinstance(cost, float):
                    cost = Decimal(str(cost))
                
                # Check budget constraint
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
                
                # Update remaining budget
                if remaining_budget is not None:
                    remaining_budget -= cost

        # Second scheduling pass - fill remaining slots with any available activities
        if len(scheduled_items) < self.constraints['max_daily_items']:
            for activity in sorted_activities:
                # Skip already scheduled activities
                if activity in [item.place or item.experience for item in scheduled_items]:
                    continue
                    
                if len(scheduled_items) >= self.constraints['max_daily_items']:
                    break
       
                # Find any available time slot
                suitable_slot = self._find_suitable_time_slot(
                    activity=activity,
                    time_slots=time_slots,
                    preferred_times=None
                )
                
                if suitable_slot:
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
                    
                    # Update remaining budget
                    if remaining_budget is not None:
                        remaining_budget -= cost

        # Bulk create all items at once for better performance
        try:
            BoxItineraryItem.objects.bulk_create(scheduled_items)
        except Exception as e:
            logger.error(f"Error bulk creating itinerary items: {str(e)}")
            # Fallback to individual creation
            for item in scheduled_items:
                try:
                    item.save()
                except Exception as inner_e:
                    logger.error(f"Error saving individual itinerary item: {str(inner_e)}")

    def _find_suitable_time_slot(self, activity, time_slots, preferred_times=None):
        """
        Find a suitable time slot for an activity - optimized.
        
        Args:
            activity: The activity to find a slot for
            time_slots (List): Available time slots
            preferred_times (List, optional): Preferred times of day
            
        Returns:
            Dict: Suitable time slot or None if no suitable slot found
        """
        duration_minutes = self._get_activity_duration(activity)
        slots_needed = max(1, duration_minutes // 30)

        opening_hours = self._get_activity_opening_hours(activity)

        # Filter slots by time of day preference
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
        else:
            preferred_slots = [slot for slot in time_slots if slot['is_available']]
        
        # Find consecutive available slots
        for i in range(len(preferred_slots) - slots_needed + 1):
            consecutive_slots = preferred_slots[i:i+slots_needed]
            
            if all(slot['is_available'] for slot in consecutive_slots):
                start_time = consecutive_slots[0]['start_time']
                end_time = consecutive_slots[-1]['end_time']
                
                # Check if within opening hours
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
        """
        Check if a time range is within opening hours.
        
        Args:
            start_time (time): Start time
            end_time (time): End time
            opening_hours (tuple): Opening hours tuple (start, end)
            
        Returns:
            bool: True if within opening hours, False otherwise
        """
        if not opening_hours:
            return True
            
        try:
            open_time = dt_time(opening_hours[0], 0)
            close_time = dt_time(opening_hours[1], 0)
            
            return open_time <= start_time and end_time <= close_time
        except (IndexError, TypeError) as e:
            logger.warning(f"Invalid opening hours format: {str(e)}")
            return True

    def _create_itinerary_item(self, day, activity, start_time, end_time, order, cost):
        """
        Create an itinerary item for an activity.
        
        Args:
            day (BoxItineraryDay): The day to create item for
            activity: The activity
            start_time (time): Start time
            end_time (time): End time
            order (int): Order in the day
            cost (Decimal): Activity cost
            
        Returns:
            BoxItineraryItem: Created itinerary item
        """
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
        
        # Set the appropriate relationship
        if hasattr(activity, 'price'):
            item.place = activity
        else: 
            item.experience = activity
        
        return item

    def _activity_priority_score(self, activity, current_counts, target_counts):
        """
        Calculate priority score for an activity - optimized with additional factors.
        
        Args:
            activity: The activity to calculate priority for
            current_counts (Dict): Current activity counts by type
            target_counts (Dict): Target activity counts by type
            
        Returns:
            float: Priority score
        """
        try:
            activity_type = getattr(activity, 'metadata', {}).get('activity_type', 'cultural')
            
            # Calculate how much we need this activity type
            type_need = max(0, target_counts.get(activity_type, 0) - current_counts.get(activity_type, 0))
            
            # Get personalization score
            personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
            
            # Get rating
            rating = getattr(activity, 'rating', 3.0)
            
            # Media boost - activities with media are preferred
            media_count = getattr(activity, 'media', []).count() if hasattr(activity, 'media') else 0
            media_boost = min(0.2, media_count * 0.05)
            
            # Weather compatibility
            weather_score = 1.0
            if hasattr(activity, 'metadata') and 'is_indoor' in activity.metadata:
                is_indoor = activity.metadata['is_indoor']
                weather_score = 1.0  # Placeholder for weather compatibility logic
            
            # Calculate final score with weighted components
            return (
                (type_need * 0.4) + 
                (personalization_score * 0.25) + 
                (rating * 0.15) + 
                (weather_score * 0.1) +
                (media_boost * 0.1)
            )
        except Exception as e:
            logger.warning(f"Error calculating activity priority score: {str(e)}")
            return 0.5  # Default priority

    def _get_activity_duration(self, activity):
        """
        Get estimated duration for an activity in minutes.
        
        Args:
            activity: The activity
            
        Returns:
            int: Duration in minutes
        """
        if hasattr(activity, 'duration'):
            return activity.duration
        return getattr(activity, 'metadata', {}).get('average_visit_duration', 120)

    def _get_activity_cost(self, activity):
        """
        Get cost for an activity.
        
        Args:
            activity: The activity
            
        Returns:
            Decimal: Activity cost
        """
        if hasattr(activity, 'price_per_person'):
            return activity.price_per_person or 0
        return getattr(activity, 'price', 0) or 0 

    def _get_activity_opening_hours(self, activity):
        """
        Get opening hours for an activity.
        
        Args:
            activity: The activity
            
        Returns:
            tuple: Opening hours tuple (start, end) or None
        """
        if hasattr(activity, 'opening_hours'):
            return activity.opening_hours
        return getattr(activity, 'metadata', {}).get('opening_hours')

    def _generate_activity_notes(self, activity):
        """
        Generate helpful notes for an activity - enhanced with media info.
        
        Args:
            activity: The activity
            
        Returns:
            str: Generated notes or None if no notes
        """
        notes = []
        
        # Add opening hours
        if hasattr(activity, 'opening_hours'):
            notes.append(f"Opening hours: {activity.opening_hours}")
        elif hasattr(activity, 'metadata') and 'opening_hours' in activity.metadata:
            notes.append(f"Opening hours: {activity.metadata['opening_hours']}")
        
        # Add tips
        if hasattr(activity, 'metadata') and activity.metadata.get('tips'):
            tips = activity.metadata.get('tips')
            if isinstance(tips, list) and tips:
                notes.append(f"Tip: {tips[0]}")
        
        # Add popularity note
        if hasattr(activity, 'metadata') and activity.metadata.get('popularity_score', 0) > 0.7:
            notes.append("This is a popular attraction. Consider visiting early to avoid crowds.")
        
        # Add media note
        if hasattr(activity, 'media') and activity.media.exists():
            media_count = activity.media.count()
            photo_count = activity.media.filter(type='photo').count()
            video_count = activity.media.filter(type='video').count()
            
            if media_count > 0:
                media_note = f"Media available: {photo_count} photos"
                if video_count > 0:
                    media_note += f", {video_count} videos"
                notes.append(media_note)
            
        return "\n".join(notes) if notes else None

    def _calculate_total_price(self, itinerary_days):
        """
        Calculate total price of all itinerary items - optimized.
        
        Args:
            itinerary_days (List): Itinerary days
            
        Returns:
            float: Total price
        """
        from decimal import Decimal

        total = Decimal('0.0')
        
        try:
            for day in itinerary_days:
                day_total = day.items.aggregate(
                    total=Sum('estimated_cost')
                )['total'] or Decimal('0.0')
                
                total += day_total
                        
            return round(float(total), 2)
        except Exception as e:
            logger.error(f"Error calculating total price: {str(e)}")
            return 0.0

    def optimize_existing_box(self, box):
        """
        Optimize an existing box's itinerary - enhanced version.
        
        Args:
            box (Box): The box to optimize
            
        Returns:
            Box: Optimized box
            
        Raises:
            BoxGenerationError: If optimization fails
        """
        try:
            with transaction.atomic():
                # Store original box data for comparison
                original_price = box.total_price
                original_metadata = box.metadata.copy() if box.metadata else {}
                
                # Delete existing itinerary
                box.itinerary_days.all().delete()

                # Get destination
                destination = box.city or box.region or box.country
                
                # Generate new box
                optimized_box = self.generate_box(
                    destination=destination,
                    duration_days=box.duration_days,
                    budget=box.total_price,
                    start_date=box.start_date,
                    theme=box.metadata.get('theme')
                )
                
                # Update optimization metrics
                box.metadata['optimization'] = {
                    'original_price': float(original_price) if original_price else 0,
                    'optimized_price': float(optimized_box.total_price) if optimized_box.total_price else 0,
                    'price_difference_percent': (
                        ((float(optimized_box.total_price) - float(original_price)) / float(original_price) * 100)
                        if original_price and float(original_price) > 0 else 0
                    ),
                    'optimization_date': datetime.now().isoformat(),
                    'performance_metrics': self.performance_metrics
                }
                
                box.save()
                
                return optimized_box
                
        except Exception as e:
            logger.error(f"Error optimizing box {box.id}: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Could not optimize box: {str(e)}")

    def duplicate_and_modify_box(self, original_box, modifications):
        """
        Create a modified version of an existing box - enhanced version.
        
        Args:
            original_box (Box): The box to duplicate
            modifications (Dict): Modifications to apply
            
        Returns:
            Box: Duplicated and modified box
            
        Raises:
            BoxGenerationError: If duplication fails
        """
        try:
            with transaction.atomic():
                # Create new box with modifications
                new_box = Box.objects.create(
                    name=f"{original_box.name} (Modified)",
                    duration_days=modifications.get('duration_days', original_box.duration_days),
                    start_date=modifications.get('start_date', original_box.start_date),
                    end_date=modifications.get('end_date', original_box.end_date),
                    city=original_box.city,
                    region=original_box.region,
                    country=original_box.country,
                    is_customizable=True,
                    category=original_box.category,
                    metadata={
                        **(original_box.metadata or {}),
                        'original_box_id': str(original_box.id),
                        'modifications': modifications,
                        'duplication_date': datetime.now().isoformat()
                    }
                )
                
                # Copy media
                if original_box.media.exists():
                    new_box.media.add(*original_box.media.all())
                
                # Copy itinerary days and items
                for old_day in original_box.itinerary_days.order_by('day_number'):
                    new_day = BoxItineraryDay.objects.create(
                        box=new_box,
                        day_number=old_day.day_number,
                        date=(new_box.start_date + timedelta(days=old_day.day_number - 1)
                            if new_box.start_date else None),
                        description=old_day.description,
                        estimated_hours=old_day.estimated_hours,
                        metadata=old_day.metadata
                    )
                    
                    # Copy items
                    items_to_create = []
                    for old_item in old_day.items.order_by('order'):
                        new_item = BoxItineraryItem(
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
                        items_to_create.append(new_item)
                    
                    # Bulk create items for better performance
                    BoxItineraryItem.objects.bulk_create(items_to_create)
                
                # Calculate total price
                new_box.total_price = self._calculate_total_price(
                    new_box.itinerary_days.all()
                )
                new_box.save()
                
                return new_box
                
        except Exception as e:
            logger.error(f"Error duplicating box {original_box.id}: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Could not duplicate box: {str(e)}")