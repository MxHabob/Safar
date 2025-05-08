import logging
import time
from datetime import timedelta, datetime, time as dt_time
from functools import lru_cache
import random
import numpy as np
from django.db import transaction
from django.contrib.gis.geos import Point, MultiPoint
from django.contrib.gis.measure import D
from django.db.models import Q, F, Count, Avg, Sum
from typing import Dict, List, Optional, Tuple, Union, Any, Set
import json
from decimal import Decimal

from apps.authentication.models import User
from apps.safar.models import (
    Notification, Box, BoxItineraryDay, BoxItineraryItem, 
    Place, Experience, Media, Category
)
from apps.geographic_data.models import City, Region, Country
from apps.core_apps.algorithms_engines.recommendation_engine import RecommendationEngine

logger = logging.getLogger(__name__)

class BoxGenerationError(Exception):
    """Custom exception for box generation errors"""
    pass

class InputValidationError(ValueError):
    """Custom exception for input validation errors"""
    pass

class BoxGenerator:
    """
    Enhanced travel box generator with recommendation engine integration,
    improved naming, and smarter scheduling.
    
    This class generates personalized travel itineraries ("boxes") based on user preferences,
    destination information, and various constraints. It leverages the recommendation engine
    for better activity selection and provides more engaging box names and smarter scheduling.
    """

    # Box name templates for different themes
    BOX_NAME_TEMPLATES = {
        'adventure': [
            "{destination}'s Ultimate Adventure: {duration}-Day Expedition",
            "Thrilling {destination} Adventure: {duration} Days of Exploration",
            "Epic {destination} Quest: {duration}-Day Adventure Journey",
            "{destination} Explorer: {duration}-Day Adventure Package",
            "Wild {destination}: {duration} Days of Adventure"
        ],
        'relaxation': [
            "Serene {destination} Retreat: {duration} Days of Relaxation",
            "Tranquil {destination} Escape: {duration}-Day Relaxation Journey",
            "{destination} Sanctuary: {duration} Days of Pure Relaxation",
            "Peaceful {destination} Getaway: {duration}-Day Rejuvenation",
            "{destination} Bliss: {duration}-Day Relaxation Experience"
        ],
        'cultural': [
            "{destination} Cultural Immersion: {duration}-Day Heritage Tour",
            "Authentic {destination}: {duration}-Day Cultural Experience",
            "{destination} Heritage Discovery: {duration}-Day Cultural Journey",
            "Cultural Treasures of {destination}: {duration}-Day Experience",
            "{destination} Arts & History: {duration}-Day Cultural Tour"
        ],
        'family': [
            "Family Fun in {destination}: {duration}-Day Adventure",
            "{destination} Family Explorer: {duration}-Day Package",
            "Unforgettable Family Time: {duration} Days in {destination}",
            "{destination} Family Memories: {duration}-Day Experience",
            "Family-Friendly {destination}: {duration}-Day Journey"
        ],
        'budget': [
            "{destination} on a Budget: {duration}-Day Smart Travel",
            "Affordable {destination}: {duration}-Day Value Experience",
            "Budget-Friendly {destination}: {duration}-Day Discovery",
            "{destination} Value Explorer: {duration}-Day Budget Package",
            "Smart Traveler's {destination}: {duration}-Day Budget Tour"
        ],
        'luxury': [
            "Luxurious {destination}: {duration} Days of Indulgence",
            "Premium {destination} Experience: {duration}-Day Luxury Journey",
            "Exclusive {destination}: {duration}-Day VIP Experience",
            "{destination} Elegance: {duration}-Day Luxury Package",
            "Opulent {destination}: {duration} Days of Luxury"
        ],
        'romantic': [
            "Romantic {destination}: {duration}-Day Couple's Retreat",
            "{destination} Romance: {duration}-Day Couple's Experience",
            "Enchanting {destination}: {duration} Days for Couples",
            "Love in {destination}: {duration}-Day Romantic Getaway",
            "{destination} for Two: {duration}-Day Romantic Journey"
        ],
        'food': [
            "Culinary Journey: {duration} Days of {destination} Flavors",
            "{destination} Food Explorer: {duration}-Day Gastronomy Tour",
            "Taste of {destination}: {duration}-Day Culinary Adventure",
            "{destination} Gastronomy: {duration}-Day Food Experience",
            "Flavors of {destination}: {duration}-Day Culinary Tour"
        ]
    }

    # Default templates for when theme is not specified
    DEFAULT_BOX_NAME_TEMPLATES = [
        "Discover {destination}: {duration}-Day Personalized Journey",
        "Unforgettable {destination}: {duration}-Day Experience",
        "Explore {destination}: {duration}-Day Custom Adventure",
        "{destination} Highlights: {duration}-Day Personalized Tour",
        "The Best of {destination}: {duration}-Day Journey"
    ]

    # Activity descriptions for different types
    ACTIVITY_DESCRIPTIONS = {
        'cultural': [
            "Immerse yourself in the rich cultural heritage of this iconic site.",
            "Discover the fascinating history and cultural significance of this landmark.",
            "Explore the artistic and historical treasures housed in this cultural gem.",
            "Experience the authentic cultural traditions that make this place special.",
            "Delve into the cultural significance and historical context of this attraction."
        ],
        'outdoor': [
            "Enjoy the natural beauty and fresh air at this stunning outdoor location.",
            "Experience the breathtaking scenery and natural wonders of this outdoor gem.",
            "Connect with nature and enjoy outdoor activities in this beautiful setting.",
            "Take in the panoramic views and natural splendor of this outdoor destination.",
            "Explore the natural landscape and outdoor adventures available here."
        ],
        'leisure': [
            "Relax and unwind in this perfect leisure destination.",
            "Enjoy a peaceful and rejuvenating experience at this leisure spot.",
            "Take time to relax and enjoy the amenities of this leisure destination.",
            "Indulge in relaxation and leisure activities at this wonderful spot.",
            "Unwind and recharge at this ideal leisure location."
        ],
        'shopping': [
            "Discover unique items and local products at this shopping destination.",
            "Explore a variety of shops and find special souvenirs to remember your trip.",
            "Enjoy a premium shopping experience with a wide selection of products.",
            "Find authentic local goods and memorable souvenirs at this shopping venue.",
            "Browse through a diverse range of shops and discover unique treasures."
        ]
    }

    # Time slot descriptions
    TIME_SLOT_DESCRIPTIONS = {
        'morning': [
            "Start your day with this refreshing morning activity.",
            "Enjoy the peaceful morning atmosphere at this location.",
            "Begin your day with this energizing morning experience.",
            "Take advantage of the quiet morning hours at this attraction.",
            "Kickstart your day with this perfect morning activity."
        ],
        'afternoon': [
            "Perfect for a midday break, this afternoon activity offers a great experience.",
            "Spend your afternoon exploring this fascinating attraction.",
            "This afternoon activity provides the perfect midday adventure.",
            "Enjoy the vibrant afternoon atmosphere at this location.",
            "Make the most of your afternoon with this engaging activity."
        ],
        'evening': [
            "Experience the magical evening ambiance at this location.",
            "End your day with this delightful evening activity.",
            "Enjoy the special evening atmosphere and lighting at this attraction.",
            "This evening activity offers a perfect end to your day of exploration.",
            "Take in the evening charm and ambiance of this special place."
        ]
    }

    # Day themes for multi-day trips
    DAY_THEMES = {
        'day1': [
            "Orientation Day: Get acquainted with {destination}",
            "Welcome to {destination}: First Impressions",
            "{destination} Essentials: Your Introduction",
            "Begin Your {destination} Journey",
            "First Day Wonders in {destination}"
        ],
        'middle_days': [
            "Exploring {destination}'s Hidden Gems",
            "Deep Dive into {destination}",
            "{destination} Off the Beaten Path",
            "Authentic {destination} Experiences",
            "Discover More of {destination}"
        ],
        'last_day': [
            "Farewell to {destination}: Final Highlights",
            "Last Day Treasures in {destination}",
            "Completing Your {destination} Experience",
            "Final Day Highlights in {destination}",
            "Memorable Conclusions in {destination}"
        ]
    }

    def __init__(self, user, original_generator=None):
        """
        Initialize the enhanced box generator for a specific user.
        
        Args:
            user (User): The user to generate boxes for
            original_generator: Optional original BoxGenerator instance to wrap
        """
        self.user = user
        self.recommendation_engine = RecommendationEngine(user)
        self.original_generator = original_generator
        
    @transaction.atomic
    def generate_box(self, destination, duration_days, budget=None, start_date=None, theme=None):
        """
        Generate a complete travel box with enhanced naming and scheduling.
        
        Args:
            destination (City|Region|Country): The travel destination
            duration_days (int): Trip duration in days
            budget (float, optional): Total budget for the trip
            start_date (date, optional): Start date for the trip
            theme (str, optional): Theme (e.g., 'adventure', 'relaxation')
            
        Returns:
            Box: The generated travel box
            
        Raises:
            BoxGenerationError: If box generation fails
        """
        try:
            # If we have an original generator, use it for the base generation
            if self.original_generator:
                box = self.original_generator.generate_box(
                    destination=destination,
                    duration_days=duration_days,
                    budget=budget,
                    start_date=start_date,
                    theme=theme
                )
                
                # Enhance the generated box
                self._enhance_box(box, theme)
                return box
            
            # Otherwise, implement our own box generation logic
            # Create the base box with enhanced name
            box = self._create_base_box(
                destination=destination,
                duration_days=duration_days,
                start_date=start_date,
                theme=theme
            )
            
            # Get recommendations from our recommendation engine
            recommendations = self._get_recommendations(destination, duration_days, theme)
            
            # Generate the itinerary with smart scheduling
            self._generate_smart_itinerary(
                box=box,
                recommendations=recommendations,
                budget=budget,
                theme=theme
            )
            
            # Calculate total price
            box.total_price = self._calculate_total_price(box)
            
            # Add media to the box
            self._add_media_to_box(box, recommendations)
            
            # Update metadata
            box.metadata.update({
                'generated': True,
                'algorithm_version': '4.0',
                'theme': theme,
                'generation_date': datetime.now().isoformat(),
                'enhanced': True
            })
            box.save()
            
            # Create notification
            self._create_box_notification(box)
            
            return box
            
        except Exception as e:
            logger.error(f"Error generating enhanced box: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Could not generate enhanced box: {str(e)}")
    
    def _enhance_box(self, box, theme=None):
        """
        Enhance an existing box with better naming and descriptions.
        
        Args:
            box (Box): The box to enhance
            theme (str, optional): Theme of the box
            
        Returns:
            Box: The enhanced box
        """
        try:
            # Enhance the box name
            destination_name = self._get_destination_name(box)
            box.name = self._generate_impressive_box_name(destination_name, box.duration_days, theme)
            
            # Enhance day descriptions and themes
            self._enhance_day_descriptions(box, destination_name)
            
            # Enhance activity descriptions
            self._enhance_activity_descriptions(box)
            
            # Update metadata
            if not box.metadata:
                box.metadata = {}
                
            box.metadata.update({
                'enhanced': True,
                'enhancement_date': datetime.now().isoformat()
            })
            
            box.save()
            return box
            
        except Exception as e:
            logger.error(f"Error enhancing box: {str(e)}", exc_info=True)
            # Return the original box if enhancement fails
            return box
    
    def _create_base_box(self, destination, duration_days, start_date, theme):
        """
        Create the base box object with an impressive name.
        
        Args:
            destination: The travel destination
            duration_days: Trip duration in days
            start_date: Optional start date
            theme: Optional theme
            
        Returns:
            Box: The created box
        """
        try:
            default_category = Category.objects.first()
            destination_name = self._get_destination_name(destination)
            
            box_data = {
                'name': self._generate_impressive_box_name(destination_name, duration_days, theme),
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
    
    def _get_destination_name(self, destination):
        """
        Get the name of a destination, handling both model instances and boxes.
        
        Args:
            destination: A destination object or box
            
        Returns:
            str: The destination name
        """
        if isinstance(destination, (City, Region, Country)):
            return destination.name
        elif isinstance(destination, Box):
            if destination.city:
                return destination.city.name
            elif destination.region:
                return destination.region.name
            elif destination.country:
                return destination.country.name
        
        # Fallback
        return str(destination)
    
    def _generate_impressive_box_name(self, destination_name, duration_days, theme=None):
        """
        Generate an impressive and engaging name for the box.
        
        Args:
            destination_name: Name of the destination
            duration_days: Trip duration in days
            theme: Optional theme
            
        Returns:
            str: Generated box name
        """
        # Select appropriate templates based on theme
        if theme and theme in self.BOX_NAME_TEMPLATES:
            templates = self.BOX_NAME_TEMPLATES[theme]
        else:
            # If no theme or unknown theme, use default templates
            templates = self.DEFAULT_BOX_NAME_TEMPLATES
        
        # Select a random template
        template = random.choice(templates)
        
        # Fill in the template
        return template.format(
            destination=destination_name,
            duration=duration_days
        )
    
    def _get_recommendations(self, destination, duration_days, theme=None):
        """
        Get personalized recommendations for the box.
        
        Args:
            destination: The travel destination
            duration_days: Trip duration in days
            theme: Optional theme
            
        Returns:
            dict: Recommendations dictionary
        """
        # Calculate how many items we need
        # Estimate 3-4 activities per day
        num_items = duration_days * 4
        
        # Prepare filters based on destination
        filters = {}
        if isinstance(destination, City):
            filters['city_id'] = destination.id
        elif isinstance(destination, Region):
            filters['region_id'] = destination.id
        elif isinstance(destination, Country):
            filters['country_id'] = destination.id
        
        # Get recommendations from the recommendation engine
        places = list(self.recommendation_engine.recommend_places(
            limit=num_items,
            filters=filters
        ))
        
        experiences = list(self.recommendation_engine.recommend_experiences(
            limit=num_items // 2,  # Fewer experiences than places
            filters=filters
        ))
        
        return {
            'places': places,
            'experiences': experiences
        }
    
    def _generate_smart_itinerary(self, box, recommendations, budget=None, theme=None):
        """
        Generate a smart itinerary with themed days and balanced activities.
        
        Args:
            box: The box to generate itinerary for
            recommendations: Recommendations dictionary
            budget: Optional budget
            theme: Optional theme
        """
        try:
            # Calculate daily budget if total budget is provided
            daily_budget = None
            if budget:
                daily_budget = float(budget) / box.duration_days
            
            # Get places and experiences from recommendations
            places = recommendations['places']
            experiences = recommendations['experiences']
            
            # Combine all activities
            all_activities = places + experiences
            
            # Shuffle to ensure variety
            random.shuffle(all_activities)
            
            # Create themed days
            destination_name = self._get_destination_name(box)
            
            for day_num in range(1, box.duration_days + 1):
                # Create the day with themed description
                day = self._create_themed_day(box, day_num, destination_name)
                
                # Schedule activities for this day
                self._schedule_day_activities(
                    day=day,
                    activities=all_activities,
                    daily_budget=daily_budget,
                    theme=theme
                )
                
                # Remove scheduled activities from the pool
                scheduled_ids = set()
                for item in day.items.all():
                    if item.place_id:
                        scheduled_ids.add(item.place_id)
                    elif item.experience_id:
                        scheduled_ids.add(item.experience_id)
                
                # Filter out scheduled activities
                all_activities = [
                    activity for activity in all_activities
                    if activity.id not in scheduled_ids
                ]
        
        except Exception as e:
            logger.error(f"Error generating smart itinerary: {str(e)}", exc_info=True)
            raise BoxGenerationError(f"Failed to generate smart itinerary: {str(e)}")
    
    def _create_themed_day(self, box, day_num, destination_name):
        """
        Create a day with a themed description based on its position in the itinerary.
        
        Args:
            box: The box
            day_num: Day number
            destination_name: Name of the destination
            
        Returns:
            BoxItineraryDay: Created day
        """
        # Determine day position (first, middle, last)
        if day_num == 1:
            day_position = 'day1'
        elif day_num == box.duration_days:
            day_position = 'last_day'
        else:
            day_position = 'middle_days'
        
        # Get appropriate templates
        templates = self.DAY_THEMES.get(day_position, self.DAY_THEMES['middle_days'])
        
        # Select a random template and format it
        description = random.choice(templates).format(destination=destination_name)
        
        # Create the day
        return BoxItineraryDay.objects.create(
            box=box,
            day_number=day_num,
            date=box.start_date + timedelta(days=day_num - 1) if box.start_date else None,
            description=description,
            estimated_hours=8  # Default value
        )
    
    def _schedule_day_activities(self, day, activities, daily_budget=None, theme=None):
        """
        Schedule activities for a day with smart time allocation.
        
        Args:
            day: The day to schedule activities for
            activities: Available activities
            daily_budget: Optional daily budget
            theme: Optional theme
        """
        # Define time slots for the day
        time_slots = [
            # Morning slots
            {'start': dt_time(9, 0), 'end': dt_time(11, 0), 'period': 'morning'},
            {'start': dt_time(11, 30), 'end': dt_time(13, 0), 'period': 'morning'},
            # Afternoon slots
            {'start': dt_time(14, 0), 'end': dt_time(16, 0), 'period': 'afternoon'},
            {'start': dt_time(16, 30), 'end': dt_time(18, 0), 'period': 'afternoon'},
            # Evening slot
            {'start': dt_time(19, 0), 'end': dt_time(21, 0), 'period': 'evening'}
        ]
        
        # Adjust number of activities based on theme
        max_activities = 4  # Default
        if theme == 'relaxation':
            max_activities = 3
        elif theme == 'adventure':
            max_activities = 5
        
        # Limit to available activities or max_activities, whichever is smaller
        num_activities = min(len(activities), max_activities)
        
        # Select activities for this day
        day_activities = activities[:num_activities]
        
        # Track remaining budget
        remaining_budget = daily_budget
        
        # Schedule activities in time slots
        for i, activity in enumerate(day_activities):
            if i >= len(time_slots):
                break
                
            slot = time_slots[i]
            
            # Get activity cost
            cost = self._get_activity_cost(activity)
            
            # Check budget constraint
            if remaining_budget is not None:
                if cost > remaining_budget:
                    continue
                remaining_budget -= cost
            
            # Create itinerary item with enhanced description
            self._create_enhanced_itinerary_item(
                day=day,
                activity=activity,
                start_time=slot['start'],
                end_time=slot['end'],
                order=i + 1,
                cost=cost,
                time_period=slot['period']
            )
    
    def _get_activity_cost(self, activity):
        """
        Get the cost of an activity.
        
        Args:
            activity: The activity
            
        Returns:
            float: Activity cost
        """
        if hasattr(activity, 'price_per_person'):
            return float(activity.price_per_person or 0)
        return float(getattr(activity, 'price', 0) or 0)
    
    def _create_enhanced_itinerary_item(self, day, activity, start_time, end_time, order, cost, time_period):
        """
        Create an itinerary item with enhanced descriptions.
        
        Args:
            day: The day
            activity: The activity
            start_time: Start time
            end_time: End time
            order: Order in the day
            cost: Activity cost
            time_period: Time period (morning, afternoon, evening)
            
        Returns:
            BoxItineraryItem: Created item
        """
        # Determine activity type
        activity_type = self._get_activity_type(activity)
        
        # Generate enhanced notes
        notes = self._generate_enhanced_notes(activity, activity_type, time_period)
        
        # Calculate duration in minutes
        duration_minutes = self._calculate_duration_minutes(start_time, end_time)
        
        # Create the item
        item = BoxItineraryItem(
            itinerary_day=day,
            order=order,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            estimated_cost=Decimal(str(cost)),
            notes=notes
        )
        
        # Set the appropriate relationship
        if hasattr(activity, 'price'):  # It's a place
            item.place = activity
        else:  # It's an experience
            item.experience = activity
        
        item.save()
        return item
    
    def _get_activity_type(self, activity):
        """
        Determine the type of an activity.
        
        Args:
            activity: The activity
            
        Returns:
            str: Activity type
        """
        # Try to get activity type from metadata
        if hasattr(activity, 'metadata') and activity.metadata:
            metadata = activity.metadata
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except:
                    metadata = {}
            
            activity_type = metadata.get('activity_type')
            if activity_type in self.ACTIVITY_DESCRIPTIONS:
                return activity_type
        
        # Fallback to category-based determination
        if hasattr(activity, 'category') and activity.category:
            category_name = activity.category.name.lower()
            if 'museum' in category_name or 'historical' in category_name or 'art' in category_name:
                return 'cultural'
            elif 'park' in category_name or 'nature' in category_name or 'outdoor' in category_name:
                return 'outdoor'
            elif 'spa' in category_name or 'relax' in category_name or 'resort' in category_name:
                return 'leisure'
            elif 'shop' in category_name or 'mall' in category_name or 'market' in category_name:
                return 'shopping'
        
        # Default to cultural
        return 'cultural'
    
    def _generate_enhanced_notes(self, activity, activity_type, time_period):
        """
        Generate enhanced notes for an activity.
        
        Args:
            activity: The activity
            activity_type: Type of activity
            time_period: Time period
            
        Returns:
            str: Enhanced notes
        """
        notes = []
        
        # Add activity description
        if activity_type in self.ACTIVITY_DESCRIPTIONS:
            notes.append(random.choice(self.ACTIVITY_DESCRIPTIONS[activity_type]))
        
        # Add time-specific description
        if time_period in self.TIME_SLOT_DESCRIPTIONS:
            notes.append(random.choice(self.TIME_SLOT_DESCRIPTIONS[time_period]))
        
        # Add practical information
        if hasattr(activity, 'metadata') and activity.metadata:
            metadata = activity.metadata
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except:
                    metadata = {}
            
            # Add opening hours
            if 'opening_hours' in metadata:
                notes.append(f"Opening hours: {metadata['opening_hours']}")
            
            # Add tips
            if 'tips' in metadata and metadata['tips']:
                if isinstance(metadata['tips'], list) and metadata['tips']:
                    notes.append(f"Tip: {metadata['tips'][0]}")
                elif isinstance(metadata['tips'], str):
                    notes.append(f"Tip: {metadata['tips']}")
        
        # Add personalization note
        personalization_score = self.recommendation_engine.calculate_personalization_score(activity)
        if personalization_score > 0.7:
            notes.append("This activity was specifically recommended for you based on your preferences.")
        
        return "\n".join(notes)
    
    def _calculate_duration_minutes(self, start_time, end_time):
        """
        Calculate duration in minutes between two time objects.
        
        Args:
            start_time: Start time
            end_time: End time
            
        Returns:
            int: Duration in minutes
        """
        start_minutes = start_time.hour * 60 + start_time.minute
        end_minutes = end_time.hour * 60 + end_time.minute
        
        # Handle crossing midnight
        if end_minutes < start_minutes:
            end_minutes += 24 * 60
            
        return end_minutes - start_minutes
    
    def _calculate_total_price(self, box):
        """
        Calculate the total price of a box.
        
        Args:
            box: The box
            
        Returns:
            Decimal: Total price
        """
        total = Decimal('0.0')
        
        try:
            for day in box.itinerary_days.all():
                day_total = day.items.aggregate(
                    total=Sum('estimated_cost')
                )['total'] or Decimal('0.0')
                
                total += day_total
                        
            return total
        except Exception as e:
            logger.error(f"Error calculating total price: {str(e)}")
            return Decimal('0.0')
    
    def _add_media_to_box(self, box, recommendations):
        """
        Add media to the box from recommended places and experiences.
        
        Args:
            box: The box
            recommendations: Recommendations dictionary
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
            
            # Fetch media for these items
            place_media = Media.objects.filter(
                places__id__in=places_ids
            ).order_by('-created_at')[:10]
            
            experience_media = Media.objects.filter(
                experiences__id__in=experiences_ids
            ).order_by('-created_at')[:10]
            
            # Combine and select the best media
            all_media = list(place_media) + list(experience_media)
            
            # Prioritize photos over videos
            photos = [m for m in all_media if m.type == 'photo']
            videos = [m for m in all_media if m.type == 'video']
            
            # Select a mix of photos and videos
            selected_media = photos[:8] + videos[:2]
            
            # Associate media with the box
            if selected_media:
                box.media.add(*selected_media)
                
        except Exception as e:
            logger.error(f"Error adding media to box: {str(e)}")
            # Don't fail the whole process if media addition fails
    
    def _create_box_notification(self, box):
        """
        Create a notification for the user about their new generated box.
        
        Args:
            box: The box
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
    
    def _enhance_day_descriptions(self, box, destination_name):
        """
        Enhance day descriptions with themed content.
        
        Args:
            box: The box to enhance
            destination_name: Name of the destination
        """
        try:
            days = box.itinerary_days.all().order_by('day_number')
            
            for day in days:
                # Determine day position
                if day.day_number == 1:
                    day_position = 'day1'
                elif day.day_number == box.duration_days:
                    day_position = 'last_day'
                else:
                    day_position = 'middle_days'
                
                # Get appropriate templates
                templates = self.DAY_THEMES.get(day_position, self.DAY_THEMES['middle_days'])
                
                # Select a random template and format it
                description = random.choice(templates).format(destination=destination_name)
                
                # Update day description
                day.description = description
                day.save()
                
        except Exception as e:
            logger.error(f"Error enhancing day descriptions: {str(e)}")
            # Continue even if enhancement fails
    
    def _enhance_activity_descriptions(self, box):
        """
        Enhance activity descriptions with engaging content.
        
        Args:
            box: The box to enhance
        """
        try:
            # Get all itinerary items
            for day in box.itinerary_days.all():
                for item in day.items.all():
                    # Get the activity
                    activity = item.place or item.experience
                    if not activity:
                        continue
                    
                    # Determine activity type
                    activity_type = self._get_activity_type(activity)
                    
                    # Determine time period
                    time_period = self._get_time_period(item.start_time)
                    
                    # Generate enhanced notes
                    notes = self._generate_enhanced_notes(activity, activity_type, time_period)
                    
                    # Update item notes
                    item.notes = notes
                    item.save()
                    
        except Exception as e:
            logger.error(f"Error enhancing activity descriptions: {str(e)}")
            # Continue even if enhancement fails
    
    def _get_time_period(self, time_obj):
        """
        Determine the time period (morning, afternoon, evening) for a time.
        
        Args:
            time_obj: Time object
            
        Returns:
            str: Time period
        """
        hour = time_obj.hour
        
        if 5 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        else:
            return 'evening'

