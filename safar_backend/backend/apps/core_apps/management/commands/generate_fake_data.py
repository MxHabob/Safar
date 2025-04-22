import math
import random
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point, MultiPolygon, Polygon
from django.db import transaction
from faker import Faker
from phonenumber_field.phonenumber import PhoneNumber
from apps.authentication.models import User, UserProfile, UserInteraction, UserLoginLog, PointsTransaction, InteractionType
from apps.geographic_data.models import City, Country, Region
from apps.safar.models import (
    Category, Media, Discount, Message, Notification, 
    Payment, Place, Experience, Flight, Booking, 
    Review, Wishlist, Box, BoxItineraryDay, BoxItineraryItem,
    SmsLog, PushNotificationLog
)

logger = logging.getLogger(__name__)
fake = Faker()

class Command(BaseCommand):
    help = 'Generates comprehensive and consistent fake data for the travel booking system'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50, help='Number of fake users to create')
        parser.add_argument('--places', type=int, default=20, help='Number of fake places to create')
        parser.add_argument('--experiences', type=int, default=15, help='Number of fake experiences to create')
        parser.add_argument('--flights', type=int, default=10, help='Number of fake flights to create')
        parser.add_argument('--boxes', type=int, default=5, help='Number of fake travel boxes to create')
        parser.add_argument('--bookings', type=int, default=30, help='Number of fake bookings to create')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before generation')
        parser.add_argument('--seed', type=int, help='Random seed for reproducible data generation')
        parser.add_argument('--safe-mode', action='store_true', help='Run in safe mode with smaller transactions')
        parser.add_argument('--step-by-step', action='store_true', help='Confirm each step before proceeding')
        parser.add_argument('--skip-errors', action='store_true', help='Continue even if some steps fail')

    def handle(self, *args, **options):
        if options.get('seed'):
            random.seed(options['seed'])
            fake.seed_instance(options['seed'])
            self.stdout.write(self.style.SUCCESS(f"Using random seed: {options['seed']}"))
        
        if options['clear']:
            if options.get('step_by_step'):
                confirm = input("Are you sure you want to clear existing data? This cannot be undone. (y/n): ")
                if confirm.lower() != 'y':
                    self.stdout.write(self.style.WARNING('Data clearing aborted.'))
                    return
            self.clear_existing_data()
        
        self.stdout.write(self.style.SUCCESS('Starting data generation...'))

        results = {}
        
        safe_mode = options.get('safe_mode', False)
        step_by_step = options.get('step_by_step', False)
        skip_errors = options.get('skip_errors', False)
        
        steps = [
            ('Base data', self.generate_base_data),
            ('Users', lambda: self.generate_users(options['users'], safe_mode)),
            ('Media', lambda: self.generate_media(results.get('users', []), 100, safe_mode)),
            ('Places', lambda: self.generate_places(options['places'], results, safe_mode)),
            ('Experiences', lambda: self.generate_experiences(options['experiences'], results, safe_mode)),
            ('Flights', lambda: self.generate_flights(options['flights'], results, safe_mode)),
            ('Boxes', lambda: self.generate_boxes(options['boxes'], results, safe_mode)),
            ('Bookings', lambda: self.generate_bookings(options['bookings'], results, safe_mode)),
            ('Discounts', lambda: self.generate_discounts(results, safe_mode)),
            ('Payments', lambda: self.generate_payments(results, safe_mode)),
            ('Reviews', lambda: self.generate_reviews(results, safe_mode)),
            ('User Interactions', lambda: self.generate_user_interactions(results, safe_mode)),
            ('Login Logs', lambda: self.generate_login_logs(results, safe_mode)),
            ('Points Transactions', lambda: self.generate_points_transactions(results, safe_mode)),
            ('Messages', lambda: self.generate_messages(results, safe_mode)),
            ('Notifications', lambda: self.generate_notifications(results, safe_mode)),
            ('Wishlists', lambda: self.generate_wishlists(results, safe_mode)),
            ('Notification Logs', lambda: self.generate_notification_logs(results, safe_mode))
        ]
        
        for step_name, step_function in steps:
            if step_by_step:
                confirm = input(f"\nReady to generate {step_name}? (y/n): ")
                if confirm.lower() != 'y':
                    self.stdout.write(self.style.WARNING(f'Skipping {step_name} generation.'))
                    continue
            
            self.stdout.write(f"\nGenerating {step_name}...")
            try:
                step_result = step_function()
                if isinstance(step_result, dict):
                    results.update(step_result)
                elif step_result is not None:
                    results[step_name.lower().replace(' ', '_')] = step_result
                self.stdout.write(self.style.SUCCESS(f'{step_name} generation complete.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error generating {step_name}: {str(e)}'))
                if not skip_errors:
                    if step_by_step:
                        confirm = input(f"An error occurred. Continue anyway? (y/n): ")
                        if confirm.lower() != 'y':
                            self.stdout.write(self.style.ERROR('Aborting data generation due to error.'))
                            raise
                    else:
                        self.stdout.write(self.style.ERROR('Aborting data generation due to error.'))
                        raise
                else:
                    self.stdout.write(self.style.WARNING('Continuing despite error...'))
        
        self.display_summary(results)

    def generate_base_data(self):
        """Generate base data (categories, countries, regions, cities, interaction types)"""
        results = {}
        
        try:
            with transaction.atomic():
                results['categories'] = self.create_categories()
                self.stdout.write(self.style.SUCCESS('Created categories successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating categories: {str(e)}'))
            results['categories'] = []
        
        try:
            with transaction.atomic():
                countries, regions, cities = self.create_geographic_hierarchy()
                results['countries'] = countries
                results['regions'] = regions
                results['cities'] = cities
                self.stdout.write(self.style.SUCCESS('Created geographic data successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating geographic data: {str(e)}'))
            results['countries'] = []
            results['regions'] = []
            results['cities'] = []
        
        try:
            with transaction.atomic():
                results['interaction_types'] = self.create_interaction_types()
                self.stdout.write(self.style.SUCCESS('Created interaction types successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating interaction types: {str(e)}'))
            results['interaction_types'] = []
        
        return results
    
    def generate_users(self, count, safe_mode=False):
        """Generate users with proper error handling"""
        users = []
        countries = Country.objects.all()
        regions = Region.objects.all()
        cities = City.objects.all()
        
        if not cities.exists():
            self.stdout.write(self.style.ERROR('No cities available - cannot create users'))
            return users
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        user = self.create_single_user(countries, regions, cities)
                        if user:
                            users.append(user)
                            self.stdout.write(f'Created user {i+1}/{count}: {user.email}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating user {i+1}: {str(e)}'))
        else:
            try:
                with transaction.atomic():
                    users = self.create_users_batch(count, countries, regions, cities)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating users: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to safe mode for user creation'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            user = self.create_single_user(countries, regions, cities)
                            if user:
                                users.append(user)
                                self.stdout.write(f'Created user {i+1}/{count}: {user.email}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating user {i+1}: {str(e)}'))
        
        if not users:
            self.stdout.write(self.style.WARNING('Failed to create any users'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users'))
        
        return users
    
    def generate_media(self, users, count, safe_mode=False):
        """Generate media items"""
        media_items = []
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping media generation'))
            return media_items
        
        if safe_mode:
            batch_size = 20
            for i in range(0, count, batch_size):
                try:
                    with transaction.atomic():
                        batch_count = min(batch_size, count - i)
                        batch = self.create_media(users, count=batch_count)
                        media_items.extend(batch)
                        self.stdout.write(f'Created media items {i+1}-{i+batch_count}/{count}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating media batch: {str(e)}'))
        else:
            try:
                with transaction.atomic():
                    media_items = self.create_media(users, count=count)
                    self.stdout.write(f'Created {len(media_items)} media items')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating media: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to batch mode for media creation'))
                batch_size = 20
                for i in range(0, count, batch_size):
                    try:
                        with transaction.atomic():
                            batch_count = min(batch_size, count - i)
                            batch = self.create_media(users, count=batch_count)
                            media_items.extend(batch)
                            self.stdout.write(f'Created media items {i+1}-{i+batch_count}/{count}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating media batch: {str(e)}'))
        
        return media_items
    
    def generate_places(self, count, results, safe_mode=False):
        """Generate places"""
        places = []
        categories = results.get('categories', [])
        users = results.get('users', [])
        media_items = results.get('media', [])
        countries = results.get('countries', [])
        regions = results.get('regions', [])
        cities = results.get('cities', [])
        
        if not categories or not users or not cities:
            self.stdout.write(self.style.WARNING('Missing required data - skipping places generation'))
            return places
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        place = self.create_single_place(categories, users, media_items, countries, regions, cities)
                        if place:
                            places.append(place)
                            self.stdout.write(f'Created place {i+1}/{count}: {place.name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating place {i+1}: {str(e)}'))
        else:
            try:
                places = []
                for i in range(count):
                    place = self.create_single_place(categories, users, media_items, countries, regions, cities)
                    if place:
                        places.append(place)
                        self.stdout.write(f'Created place {i+1}/{count}: {place.name}')
                self.stdout.write(f'Created {len(places)} places')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating places: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for places'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            place = self.create_single_place(categories, users, media_items, countries, regions, cities)
                            if place:
                                places.append(place)
                                self.stdout.write(f'Created place {i+1}/{count}: {place.name}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating place {i+1}: {str(e)}'))
        
        return places
    
    def generate_experiences(self, count, results, safe_mode=False):
        """Generate experiences"""
        experiences = []
        categories = results.get('categories', [])
        users = results.get('users', [])
        media_items = results.get('media', [])
        places = results.get('places', [])
        
        if not categories or not users or not places:
            self.stdout.write(self.style.WARNING('Missing required data - skipping experiences generation'))
            return experiences
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        experience = self.create_single_experience(categories, users, media_items, places)
                        if experience:
                            experiences.append(experience)
                            self.stdout.write(f'Created experience {i+1}/{count}: {experience.title}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating experience {i+1}: {str(e)}'))
        else:
            try:
                experiences = []
                for i in range(count):
                    experience = self.create_single_experience(categories, users, media_items, places)
                    if experience:
                        experiences.append(experience)
                        self.stdout.write(f'Created experience {i+1}/{count}: {experience.title}')
                self.stdout.write(f'Created {len(experiences)} experiences')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating experiences: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for experiences'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            experience = self.create_single_experience(categories, users, media_items, places)
                            if experience:
                                experiences.append(experience)
                                self.stdout.write(f'Created experience {i+1}/{count}: {experience.title}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating experience {i+1}: {str(e)}'))
        
        return experiences
    
    def generate_flights(self, count, results, safe_mode=False):
        """Generate flights"""
        flights = []
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        flight = self.create_single_flight()
                        if flight:
                            flights.append(flight)
                            self.stdout.write(f'Created flight {i+1}/{count}: {flight.flight_number}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating flight {i+1}: {str(e)}'))
        else:
            try:
                flights = []
                for i in range(count):
                    flight = self.create_single_flight()
                    if flight:
                        flights.append(flight)
                        self.stdout.write(f'Created flight {i+1}/{count}: {flight.flight_number}')
                self.stdout.write(f'Created {len(flights)} flights')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating flights: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for flights'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            flight = self.create_single_flight()
                            if flight:
                                flights.append(flight)
                                self.stdout.write(f'Created flight {i+1}/{count}: {flight.flight_number}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating flight {i+1}: {str(e)}'))
        
        return flights
    
    def generate_boxes(self, count, results, safe_mode=False):
        """Generate travel boxes"""
        boxes = []
        categories = results.get('categories', [])
        media_items = results.get('media', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        countries = results.get('countries', [])
        cities = results.get('cities', [])
        
        if not places or not experiences:
            self.stdout.write(self.style.WARNING('Missing required data - skipping boxes generation'))
            return boxes
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        box = self.create_single_box(categories, media_items, places, experiences, countries, cities)
                        if box:
                            boxes.append(box)
                            self.stdout.write(f'Created box {i+1}/{count}: {box.name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating box {i+1}: {str(e)}'))
        else:
            try:
                boxes = []
                for i in range(count):
                    box = self.create_single_box(categories, media_items, places, experiences, countries, cities)
                    if box:
                        boxes.append(box)
                        self.stdout.write(f'Created box {i+1}/{count}: {box.name}')
                self.stdout.write(f'Created {len(boxes)} boxes')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating boxes: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for boxes'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            box = self.create_single_box(categories, media_items, places, experiences, countries, cities)
                            if box:
                                boxes.append(box)
                                self.stdout.write(f'Created box {i+1}/{count}: {box.name}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating box {i+1}: {str(e)}'))
        
        return boxes
    
    def generate_bookings(self, count, results, safe_mode=False):
        """Generate bookings"""
        bookings = []
        users = results.get('users', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        flights = results.get('flights', [])
        boxes = results.get('boxes', [])
        
        if not users or not (places or experiences or flights or boxes):
            self.stdout.write(self.style.WARNING('Missing required data - skipping bookings generation'))
            return bookings
        
        if safe_mode:
            for i in range(count):
                try:
                    with transaction.atomic():
                        booking = self.create_single_booking(users, places, experiences, flights, boxes)
                        if booking:
                            bookings.append(booking)
                            entity_type = next((k for k in ['place', 'experience', 'flight', 'box'] 
                                          if getattr(booking, k) is not None), "unknown")
                            self.stdout.write(f'Created booking {i+1}/{count}: {entity_type} booking for {booking.user.email}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating booking {i+1}: {str(e)}'))
        else:
            try:
                bookings = []
                for i in range(count):
                    booking = self.create_single_booking(users, places, experiences, flights, boxes)
                    if booking:
                        bookings.append(booking)
                        entity_type = next((k for k in ['place', 'experience', 'flight', 'box'] 
                                      if getattr(booking, k) is not None), "unknown")
                        self.stdout.write(f'Created booking {i+1}/{count}: {entity_type} booking for {booking.user.email}')
                self.stdout.write(f'Created {len(bookings)} bookings')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating bookings: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for bookings'))
                for i in range(count):
                    try:
                        with transaction.atomic():
                            booking = self.create_single_booking(users, places, experiences, flights, boxes)
                            if booking:
                                bookings.append(booking)
                                entity_type = next((k for k in ['place', 'experience', 'flight', 'box'] 
                                              if getattr(booking, k) is not None), "unknown")
                                self.stdout.write(f'Created booking {i+1}/{count}: {entity_type} booking for {booking.user.email}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating booking {i+1}: {str(e)}'))
        
        return bookings
    
    def generate_discounts(self, results, safe_mode=False):
        """Generate discounts"""
        users = results.get('users', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        flights = results.get('flights', [])
        boxes = results.get('boxes', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping discounts generation'))
            return []
        
        try:
            discounts = []
            for i in range(10):  # Create 10 discounts
                discount = self.create_single_discount(users, places, experiences, flights, boxes)
                if discount:
                    discounts.append(discount)
            self.stdout.write(f'Created {len(discounts)} discounts')
            return discounts
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating discounts: {str(e)}'))
            return []
    
    def generate_payments(self, results, safe_mode=False):
        """Generate payments for bookings"""
        bookings = results.get('bookings', [])
        
        if not bookings:
            self.stdout.write(self.style.WARNING('No bookings available - skipping payments generation'))
            return []
        
        payments = []
        
        if safe_mode:
            for booking in bookings:
                if booking.status == "Confirmed":
                    try:
                        with transaction.atomic():
                            payment = self.create_single_payment(booking)
                            if payment:
                                payments.append(payment)
                                self.stdout.write(f'Created payment for booking {booking.id}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating payment for booking {booking.id}: {str(e)}'))
        else:
            try:
                for booking in bookings:
                    if booking.status == "Confirmed":
                        payment = self.create_single_payment(booking)
                        if payment:
                            payments.append(payment)
                self.stdout.write(f'Created {len(payments)} payments')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating payments: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to individual creation for payments'))
                for booking in bookings:
                    if booking.status == "Confirmed":
                        try:
                            with transaction.atomic():
                                payment = self.create_single_payment(booking)
                                if payment:
                                    payments.append(payment)
                                    self.stdout.write(f'Created payment for booking {booking.id}')
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'Error creating payment for booking {booking.id}: {str(e)}'))
        
        return payments
    
    def generate_reviews(self, results, safe_mode=False):
        """Generate reviews"""
        users = results.get('users', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        flights = results.get('flights', [])
        
        if not users or not (places or experiences or flights):
            self.stdout.write(self.style.WARNING('Missing required data - skipping reviews generation'))
            return []
        
        reviews = []
        
        if safe_mode:
            if places:
                for place in random.sample(places, min(10, len(places))):
                    try:
                        with transaction.atomic():
                            place_reviews = self.create_reviews_for_entity(users, place=place)
                            reviews.extend(place_reviews)
                            self.stdout.write(f'Created {len(place_reviews)} reviews for place {place.name}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating reviews for place {place.id}: {str(e)}'))
            
            if experiences:
                for exp in random.sample(experiences, min(8, len(experiences))):
                    try:
                        with transaction.atomic():
                            exp_reviews = self.create_reviews_for_entity(users, experience=exp)
                            reviews.extend(exp_reviews)
                            self.stdout.write(f'Created {len(exp_reviews)} reviews for experience {exp.title}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating reviews for experience {exp.id}: {str(e)}'))
            
            if flights:
                for flight in random.sample(flights, min(5, len(flights))):
                    try:
                        with transaction.atomic():
                            flight_reviews = self.create_reviews_for_entity(users, flight=flight)
                            reviews.extend(flight_reviews)
                            self.stdout.write(f'Created {len(flight_reviews)} reviews for flight {flight.flight_number}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating reviews for flight {flight.id}: {str(e)}'))
        else:
            try:
                if places:
                    for place in random.sample(places, min(10, len(places))):
                        place_reviews = self.create_reviews_for_entity(users, place=place)
                        reviews.extend(place_reviews)
                        self.stdout.write(f'Created {len(place_reviews)} reviews for place {place.name}')
                
                if experiences:
                    for exp in random.sample(experiences, min(8, len(experiences))):
                        exp_reviews = self.create_reviews_for_entity(users, experience=exp)
                        reviews.extend(exp_reviews)
                        self.stdout.write(f'Created {len(exp_reviews)} reviews for experience {exp.title}')
                
                if flights:
                    for flight in random.sample(flights, min(5, len(flights))):
                        flight_reviews = self.create_reviews_for_entity(users, flight=flight)
                        reviews.extend(flight_reviews)
                        self.stdout.write(f'Created {len(flight_reviews)} reviews for flight {flight.flight_number}')
                
                self.stdout.write(f'Created {len(reviews)} reviews')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating reviews: {str(e)}'))
                self.stdout.write(self.style.WARNING('Falling back to batch creation for reviews'))

                if places:
                    for place in random.sample(places, min(10, len(places))):
                        try:
                            with transaction.atomic():
                                place_reviews = self.create_reviews_for_entity(users, place=place)
                                reviews.extend(place_reviews)
                                self.stdout.write(f'Created {len(place_reviews)} reviews for place {place.name}')
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'Error creating reviews for place {place.id}: {str(e)}'))
                
                if experiences:
                    for exp in random.sample(experiences, min(8, len(experiences))):
                        try:
                            with transaction.atomic():
                                exp_reviews = self.create_reviews_for_entity(users, experience=exp)
                                reviews.extend(exp_reviews)
                                self.stdout.write(f'Created {len(exp_reviews)} reviews for experience {exp.title}')
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'Error creating reviews for experience {exp.id}: {str(e)}'))
                
                if flights:
                    for flight in random.sample(flights, min(5, len(flights))):
                        try:
                            with transaction.atomic():
                                flight_reviews = self.create_reviews_for_entity(users, flight=flight)
                                reviews.extend(flight_reviews)
                                self.stdout.write(f'Created {len(flight_reviews)} reviews for flight {flight.flight_number}')
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'Error creating reviews for flight {flight.id}: {str(e)}'))
        
        return reviews
    
    def generate_user_interactions(self, results, safe_mode=False):
        """Generate user interactions"""
        users = results.get('users', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        reviews = results.get('reviews', [])
        bookings = results.get('bookings', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping user interactions generation'))
            return []
        
        try:
            interactions = []
            for user in users:
                # Generate view interactions for places
                if places:
                    for place in random.sample(places, min(5, len(places))):
                        interaction = UserInteraction(
                            user=user,
                            content_type=place.get_content_type(),
                            object_id=place.id,
                            interaction_type='view_place',
                            metadata={
                                'timestamp': timezone.now().isoformat(),
                                'session_id': fake.uuid4()
                            },
                            device_type=random.choice(['mobile', 'desktop', 'tablet'])
                        )
                        interaction.save()
                        interactions.append(interaction)
                
                # Generate interactions for experiences
                if experiences:
                    for exp in random.sample(experiences, min(3, len(experiences))):
                        interaction = UserInteraction(
                            user=user,
                            content_type=exp.get_content_type(),
                            object_id=exp.id,
                            interaction_type='view_experience',
                            metadata={
                                'timestamp': timezone.now().isoformat(),
                                'session_id': fake.uuid4()
                            },
                            device_type=random.choice(['mobile', 'desktop', 'tablet'])
                        )
                        interaction.save()
                        interactions.append(interaction)
                
                # Generate wishlist interactions
                if places:
                    for place in random.sample(places, min(2, len(places))):
                        interaction = UserInteraction(
                            user=user,
                            content_type=place.get_content_type(),
                            object_id=place.id,
                            interaction_type='wishlist_add',
                            metadata={
                                'timestamp': timezone.now().isoformat(),
                                'session_id': fake.uuid4()
                            },
                            device_type=random.choice(['mobile', 'desktop', 'tablet'])
                        )
                        interaction.save()
                        interactions.append(interaction)
            
            self.stdout.write(f'Created {len(interactions)} user interactions')
            return interactions
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating user interactions: {str(e)}'))
            return []
    
    def generate_login_logs(self, results, safe_mode=False):
        """Generate login logs"""
        users = results.get('users', [])
        countries = results.get('countries', [])
        cities = results.get('cities', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping login logs generation'))
            return []
        
        try:
            login_logs = []
            for user in users:
                # Generate 1-5 login logs per user
                for _ in range(random.randint(1, 5)):
                    country = random.choice(countries) if countries else None
                    city = random.choice(cities) if cities else None
                    
                    login_log = UserLoginLog(
                        user=user,
                        ip_address=fake.ipv4(),
                        user_agent=fake.user_agent(),
                        login_status=random.choices(['success', 'failed'], weights=[9, 1])[0],
                        session_id=fake.uuid4(),
                        country=country.name if country else '',
                        city=city.name if city else ''
                    )
                    login_log.save()
                    login_logs.append(login_log)
            
            self.stdout.write(f'Created {len(login_logs)} login logs')
            return login_logs
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating login logs: {str(e)}'))
            return []
    
    def generate_points_transactions(self, results, safe_mode=False):
        """Generate points transactions"""
        users = results.get('users', [])
        interactions = results.get('user_interactions', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping points transactions generation'))
            return []
        
        try:
            points_transactions = []
            for user in users:
                # Generate 1-5 points transactions per user
                for _ in range(random.randint(1, 5)):
                    action = random.choice([
                        'profile_complete', 'booking_complete', 'review_added',
                        'referral', 'daily_login', 'promotion'
                    ])
                    
                    points = random.randint(10, 100) if action in ['booking_complete', 'referral'] else random.randint(5, 25)
                    
                    transaction = PointsTransaction(
                        user=user,
                        action=action,
                        points=points,
                        metadata={
                            'timestamp': timezone.now().isoformat(),
                            'description': f'Points earned for {action.replace("_", " ")}'
                        },
                        balance_after=user.points + points
                    )
                    
                    # Link to an interaction if available
                    if interactions:
                        user_interactions = [i for i in interactions if i.user == user]
                        if user_interactions:
                            transaction.interaction = random.choice(user_interactions)
                    
                    transaction.save()
                    
                    # Update user points
                    user.points += points
                    user.save(update_fields=['points'])
                    
                    points_transactions.append(transaction)
            
            self.stdout.write(f'Created {len(points_transactions)} points transactions')
            return points_transactions
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating points transactions: {str(e)}'))
            return []
    
    def generate_messages(self, results, safe_mode=False):
        """Generate messages"""
        users = results.get('users', [])
        bookings = results.get('bookings', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping messages generation'))
            return []
        
        try:
            messages = []
            # Generate messages between users
            for _ in range(20):  # Create 20 random messages
                sender = random.choice(users)
                receiver = random.choice([u for u in users if u != sender])
                
                # Optionally link to a booking
                booking = random.choice(bookings) if bookings and random.random() < 0.5 else None
                
                message = Message(
                    sender=sender,
                    receiver=receiver,
                    booking=booking,
                    message_text=fake.paragraph(),
                    is_read=random.choice([True, False])
                )
                message.save()
                messages.append(message)
            
            self.stdout.write(f'Created {len(messages)} messages')
            return messages
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating messages: {str(e)}'))
            return []
    
    def generate_notifications(self, results, safe_mode=False):
        """Generate notifications"""
        users = results.get('users', [])
        bookings = results.get('bookings', [])
        payments = results.get('payments', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping notifications generation'))
            return []
        
        try:
            notifications = []
            for user in users:
                for _ in range(random.randint(1, 5)):
                    notification_type = random.choice([
                        "Booking Update", "Payment", "New Box", "Personalized Box",
                        "Discount", "Points", "Message", "General"
                    ])
                    
                    notification = Notification(
                        user=user,
                        type=notification_type,
                        message=fake.sentence(),
                        metadata={
                            'timestamp': timezone.now().isoformat(),
                            'priority': random.choice(['high', 'medium', 'low'])
                        },
                        status=random.choice(['pending', 'sent', 'delivered']),
                        channels=['email', 'push'] if random.random() < 0.5 else ['email'],
                        is_read=random.choice([True, False])
                    )
                    notification.save()
                    notifications.append(notification)
            
            self.stdout.write(f'Created {len(notifications)} notifications')
            return notifications
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating notifications: {str(e)}'))
            return []
    
    def generate_wishlists(self, results, safe_mode=False):
        """Generate wishlists"""
        users = results.get('users', [])
        places = results.get('places', [])
        experiences = results.get('experiences', [])
        flights = results.get('flights', [])
        boxes = results.get('boxes', [])
        
        if not users:
            self.stdout.write(self.style.WARNING('No users available - skipping wishlists generation'))
            return []
        
        try:
            wishlists = []
            for user in users:
                # Add places to wishlist
                if places:
                    for place in random.sample(places, min(3, len(places))):
                        wishlist = Wishlist(
                            user=user,
                            place=place
                        )
                        wishlist.save()
                        wishlists.append(wishlist)
                
                # Add experiences to wishlist
                if experiences:
                    for exp in random.sample(experiences, min(2, len(experiences))):
                        wishlist = Wishlist(
                            user=user,
                            experience=exp
                        )
                        wishlist.save()
                        wishlists.append(wishlist)
                
                # Add flights to wishlist
                if flights:
                    for flight in random.sample(flights, min(1, len(flights))):
                        wishlist = Wishlist(
                            user=user,
                            flight=flight
                        )
                        wishlist.save()
                        wishlists.append(wishlist)
                
                # Add boxes to wishlist
                if boxes:
                    for box in random.sample(boxes, min(1, len(boxes))):
                        wishlist = Wishlist(
                            user=user,
                            box=box
                        )
                        wishlist.save()
                        wishlists.append(wishlist)
            
            self.stdout.write(f'Created {len(wishlists)} wishlists')
            return wishlists
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating wishlists: {str(e)}'))
            return []
    
    def generate_notification_logs(self, results, safe_mode=False):
        """Generate notification logs (SMS and push)"""
        users = results.get('users', [])
        notifications = results.get('notifications', [])
        
        if not users or not notifications:
            self.stdout.write(self.style.WARNING('Missing required data - skipping notification logs generation'))
            return {'sms_logs': [], 'push_logs': []}
        
        sms_logs = []
        push_logs = []
        
        try:
            # Generate SMS logs
            for _ in range(15):  # Create 15 SMS logs
                user = random.choice(users)
                
                sms_log = SmsLog(
                    to_number=f"+1{fake.numerify('##########')}",
                    message=fake.sentence(),
                    status=random.choice(['pending', 'success', 'failed']),
                    provider='twilio',
                    provider_message_id=fake.uuid4() if random.random() < 0.8 else None,
                    error_message=fake.sentence() if random.random() < 0.2 else None
                )
                sms_log.save()
                sms_logs.append(sms_log)
            
            self.stdout.write(f'Created {len(sms_logs)} SMS logs')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating SMS logs: {str(e)}'))
        
        try:
            # Generate push notification logs
            for notification in random.sample(notifications, min(20, len(notifications))):
                push_log = PushNotificationLog(
                    user=notification.user,
                    title=f"Notification: {notification.type}",
                    message=notification.message,
                    data=str(notification.metadata),
                    status=random.choice(['pending', 'success', 'failed']),
                    provider='firebase',
                    provider_message_id=fake.uuid4() if random.random() < 0.8 else None,
                    error_message=fake.sentence() if random.random() < 0.2 else None
                )
                push_log.save()
                push_logs.append(push_log)
            
            self.stdout.write(f'Created {len(push_logs)} push notification logs')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating push notification logs: {str(e)}'))
        
        return {'sms_logs': sms_logs, 'push_logs': push_logs}
    
    def clear_existing_data(self):
        """Clear existing data from all models in smaller, safer transactions"""
        models_to_clear = [
            Wishlist, Review, Payment, Booking, 
            BoxItineraryItem, BoxItineraryDay, Box,
            Flight, Experience, Place, Discount,
            Media, UserInteraction, Message, Notification,
            SmsLog, PushNotificationLog, PointsTransaction, UserLoginLog,
            InteractionType, UserProfile, User
        ]
        
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        for model in models_to_clear:
            try:
                with transaction.atomic():
                    count = model.objects.count()
                    if count > 100:
                        batch_size = 100
                        self.stdout.write(f'Clearing {count} {model.__name__} records in batches...')
                        for _ in range(0, count, batch_size):
                            with transaction.atomic():
                                ids = model.objects.values_list('id', flat=True)[:batch_size]
                                model.objects.filter(id__in=list(ids)).delete()
                    else:
                        model.objects.all().delete()
                    self.stdout.write(f'Cleared {count} {model.__name__} records')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error clearing {model.__name__}: {str(e)}'))

    def create_single_user(self, countries, regions, cities):
        """Create a single user with profile"""
        if not cities:
            return None
            
        try:
            roles = ["guest", "owner", "organization", "developer"]
            membership_levels = ["bronze", "silver", "gold", "platinum"]
            
            email = fake.unique.email()
            role = random.choice(roles)
            
            username = f"{fake.user_name()}_{random.randint(1000,9999)}"
            while User.objects.filter(username=username).exists():
                username = f"{fake.user_name()}_{random.randint(1000,9999)}"
            
            city = random.choice(cities)
            country = city.country
            region = city.region
            
            user = User(
                email=email,
                username=username,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                role=role,
                language=self.get_language_for_country(country),
                timezone=city.timezone or "UTC",
                preferred_language=self.get_language_for_country(country),
                preferred_currency=country.currency if country and hasattr(country, 'currency') and country.currency else "USD",
                membership_level=random.choice(membership_levels),
                is_active=True,
                is_profile_public=random.choice([True, False]),
                points=random.randint(0, 5000)
            )
            user.set_password('Password123-')
            user.save()
            
            profile = self.create_user_profile(user, country, region, city)
            if not profile:
                user.delete()
                return None
                
            return user
        except Exception as e:
            logger.warning(f'Error creating single user: {str(e)}')
            return None

    def create_users_batch(self, count, countries, regions, cities):
        """Generate realistic users with complete profiles"""
        if not cities:
            self.stdout.write(self.style.ERROR('No cities available - cannot assign locations to users'))
            return []     

        roles = ["guest", "owner", "organization", "developer"]
        membership_levels = ["bronze", "silver", "gold", "platinum"]
        users = []
        created_count = 0
        attempt_limit = count * 2     

        for _ in range(attempt_limit):
            if created_count >= count:
                break
                
            try:
                email = fake.unique.email()
                role = random.choice(roles)
                
                username = f"{fake.user_name()}_{random.randint(1000,9999)}"
                while User.objects.filter(username=username).exists():
                    username = f"{fake.user_name()}_{random.randint(1000,9999)}"
                
                city = random.choice(cities)
                country = city.country
                region = city.region
                
                user = User(
                    email=email,
                    username=username,
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    role=role,
                    language=self.get_language_for_country(country),
                    timezone=city.timezone or "UTC",
                    preferred_language=self.get_language_for_country(country),
                    preferred_currency=country.currency if country and hasattr(country, 'currency') and country.currency else "USD",
                    membership_level=random.choice(membership_levels),
                    is_active=True,
                    is_profile_public=random.choice([True, False]),
                    points=random.randint(0, 5000)
                )
                user.set_password('Password123-')
                user.save()
                
                try:
                    profile = self.create_user_profile(user, country, region, city)
                    if not profile:
                        user.delete()
                        continue
                    
                    users.append(user)
                    created_count += 1
                    self.stdout.write(f'Created {role} user: {email} in {city.name}, {country.name}')
                    
                except Exception as profile_error:
                    logger.error(f'Profile creation failed for {email}: {str(profile_error)}')
                    user.delete()
                    continue
                
            except Exception as e:
                logger.warning(f'Error creating user: {str(e)}')
                continue
        
        if created_count < count:
            self.stdout.write(self.style.WARNING(f'Only created {created_count} of {count} requested users'))
        
        return users

    def get_language_for_country(self, country):
        """Return a plausible language code based on country"""
        if hasattr(country, 'languages') and country.languages and len(country.languages) > 0:
            return country.languages[0]
        else:
            return "en"

    def create_user_profile(self, user, country, region, city): 
        """Create a complete user profile with consistent geographic data""" 
        try: 
            phone_number = None 
            if country and hasattr(country, 'iso_code') and country.iso_code: 
                try: 
                    phone_number = PhoneNumber.from_string( 
                        fake.phone_number(), 
                        region=country.iso_code 
                    ) 
                except Exception: 
                    phone_number = None 
        except Exception: 
            phone_number = None 

        location = None
        if city and hasattr(city, 'geometry'):
            city_point = city.geometry
            try:
                random_lat_offset = random.uniform(-0.05, 0.05)
                random_lon_offset = random.uniform(-0.05, 0.05)
                location = Point(
                    float(city_point.x) + random_lon_offset,
                    float(city_point.y) + random_lat_offset
                )
            except (TypeError, AttributeError):
                location = None

        travel_interests = random.sample([
            "adventure", "culture", "beach", "food", 
            "history", "shopping", "nature", "luxury"
        ], k=random.randint(2, 5))

        travel_history = []
        for _ in range(random.randint(1, 5)):
            visited_countries = Country.objects.exclude(id=country.id)
            if visited_countries.exists():
                visited_country = random.choice(visited_countries)
                travel_history.append({
                    "country": visited_country.name,
                    "year": random.randint(datetime.now().year - 10, datetime.now().year),
                    "duration_days": random.randint(3, 21)
                })

        languages = ["en", "fr", "es", "de", "ja", "zh"]
        proficiency_levels = ["native", "fluent", "intermediate", "basic"]
        language_proficiency = {}
        
        language_proficiency[user.preferred_language] = random.choice(["native", "fluent"])
        
        for _ in range(random.randint(0, 3)):
            lang = random.choice([l for l in languages if l not in language_proficiency])
            if lang:
                language_proficiency[lang] = random.choice(proficiency_levels)

        profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'bio': fake.text(max_nb_chars=300),
                'phone_number': phone_number,
                'location': location,
                'country': country,
                'region': region,
                'city': city,
                'postal_code': fake.postcode(),
                'address': fake.street_address(),
                'date_of_birth': fake.date_of_birth(minimum_age=18, maximum_age=80),
                'gender': random.choice(["male", "female", "prefer_not_to_say"]),
                'travel_interests': travel_interests,
                'travel_history': travel_history,
                'language_proficiency': language_proficiency,
                'privacy_consent': True,
                'consent_date': timezone.now(),
                'wants_push_notifications': random.choice([True, False]),
                'wants_sms_notifications': random.choice([True, False])
            }
        )
        
        preferred_countries = Country.objects.all()
        if preferred_countries.exists():
            profile.preferred_countries.set(random.sample(
                list(preferred_countries), 
                min(random.randint(1, 3), preferred_countries.count())
            ))
        
        return profile

    def create_geographic_hierarchy(self):
        """Create a consistent geographic hierarchy with countries, regions, and cities"""
        countries = []
        regions = []
        cities = []
        
        country_data = [
            {
                "name": "United States",
                "iso_code": "US",
                "iso3_code": "USA",
                "phone_code": "+1",
                "capital": "Washington D.C.",
                "currency": "USD",
                "languages": ["en"],
                "geometry": self.create_simple_multipolygon(-98.5795, 39.8283),
                "centroid": Point(-98.5795, 39.8283),
                "bounding_box": self.create_simple_polygon(-125.0, 24.0, -66.0, 49.0)
            },
            {
                "name": "United Kingdom",
                "iso_code": "GB",
                "iso3_code": "GBR",
                "phone_code": "+44",
                "capital": "London",
                "currency": "GBP",
                "languages": ["en"],
                "geometry": self.create_simple_multipolygon(-3.4360, 55.3781),
                "centroid": Point(-3.4360, 55.3781),
                "bounding_box": self.create_simple_polygon(-8.0, 49.0, 2.0, 61.0)
            },
            {
                "name": "France",
                "iso_code": "FR",
                "iso3_code": "FRA",
                "phone_code": "+33",
                "capital": "Paris",
                "currency": "EUR",
                "languages": ["fr"],
                "geometry": self.create_simple_multipolygon(2.2137, 46.2276),
                "centroid": Point(2.2137, 46.2276),
                "bounding_box": self.create_simple_polygon(-5.0, 41.0, 9.0, 51.0)
            },
            {
                "name": "Japan",
                "iso_code": "JP",
                "iso3_code": "JPN",
                "phone_code": "+81",
                "capital": "Tokyo",
                "currency": "JPY",
                "languages": ["ja"],
                "geometry": self.create_simple_multipolygon(138.2529, 36.2048),
                "centroid": Point(138.2529, 36.2048),
                "bounding_box": self.create_simple_polygon(129.0, 31.0, 146.0, 46.0)
            },
            {
                "name": "Australia",
                "iso_code": "AU",
                "iso3_code": "AUS",
                "phone_code": "+61",
                "capital": "Canberra",
                "currency": "AUD",
                "languages": ["en"],
                "geometry": self.create_simple_multipolygon(133.7751, -25.2744),
                "centroid": Point(133.7751, -25.2744),
                "bounding_box": self.create_simple_polygon(113.0, -43.0, 154.0, -10.0)
            }
        ]
        
        for data in country_data:
            try:
                with transaction.atomic():
                    country, created = Country.objects.get_or_create(
                        name=data["name"],
                        defaults=data
                    )
                    countries.append(country)
                    if created:
                        self.stdout.write(f'Created country: {country.name}')
                    else:
                        self.stdout.write(f'Using existing country: {country.name}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating country {data["name"]}: {str(e)}'))
                continue
                
            region_data = []
            if country.name == "United States":
                region_data = [
                    {"name": "California", "code": "CA", "admin_level": 1},
                    {"name": "New York", "code": "NY", "admin_level": 1},
                    {"name": "Florida", "code": "FL", "admin_level": 1},
                    {"name": "Texas", "code": "TX", "admin_level": 1}
                ]
            elif country.name == "United Kingdom":
                region_data = [
                    {"name": "England", "code": "ENG", "admin_level": 1},
                    {"name": "Scotland", "code": "SCT", "admin_level": 1}
                ]
            elif country.name == "France":
                region_data = [
                    {"name": "Île-de-France", "code": "IDF", "admin_level": 1},
                    {"name": "Provence-Alpes-Côte d'Azur", "code": "PACA", "admin_level": 1}
                ]
            elif country.name == "Japan":
                region_data = [
                    {"name": "Tokyo", "code": "TK", "admin_level": 1},
                    {"name": "Osaka", "code": "OS", "admin_level": 1}
                ]
            elif country.name == "Australia":
                region_data = [
                    {"name": "New South Wales", "code": "NSW", "admin_level": 1},
                    {"name": "Victoria", "code": "VIC", "admin_level": 1}
                ]
                
            for r_data in region_data:
                try:
                    with transaction.atomic():
                        offset_x = random.uniform(-2, 2)
                        offset_y = random.uniform(-2, 2)
                        centroid = Point(country.centroid.x + offset_x, country.centroid.y + offset_y)
                        bounding_box = self.create_simple_polygon(
                            centroid.x - 1, centroid.y - 1, 
                            centroid.x + 1, centroid.y + 1
                        )
                        geometry = self.create_simple_multipolygon(centroid.x, centroid.y)
                        
                        region, created = Region.objects.get_or_create(
                            country=country,
                            name=r_data["name"],
                            defaults={
                                "code": r_data["code"],
                                "admin_level": r_data["admin_level"],
                                "centroid": centroid,
                                "bounding_box": bounding_box,
                                "geometry": geometry
                            }  
                        )
                        regions.append(region)
                        if created:
                            self.stdout.write(f'Created region: {region.name} in {country.name}')
                        else:
                            self.stdout.write(f'Using existing region: {region.name} in {country.name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating region {r_data["name"]}: {str(e)}'))
                    continue

                city_data = []
                if region.name == "California":
                    city_data = [
                        {"name": "Los Angeles", "coords": (-118.2437, 34.0522), "population": 3990000},
                        {"name": "San Francisco", "coords": (-122.4194, 37.7749), "population": 880000}
                    ]
                elif region.name == "New York":
                    city_data = [
                        {"name": "New York City", "coords": (-74.0060, 40.7128), "population": 8400000},
                        {"name": "Buffalo", "coords": (-78.8784, 42.8864), "population": 255000}
                    ]
                elif region.name == "Florida":
                    city_data = [
                        {"name": "Miami", "coords": (-80.1918, 25.7617), "population": 470000},
                        {"name": "Orlando", "coords": (-81.3792, 28.5383), "population": 285000}
                    ]
                elif region.name == "Texas":
                    city_data = [
                        {"name": "Houston", "coords": (-95.3698, 29.7604), "population": 2310000},
                        {"name": "Austin", "coords": (-97.7431, 30.2672), "population": 950000}
                    ]
                elif region.name == "England":
                    city_data = [
                        {"name": "London", "coords": (-0.1278, 51.5074), "population": 8900000},
                        {"name": "Manchester", "coords": (-2.2426, 53.4808), "population": 550000}
                    ]
                elif region.name == "Scotland":
                    city_data = [
                        {"name": "Edinburgh", "coords": (-3.1883, 55.9533), "population": 490000},
                        {"name": "Glasgow", "coords": (-4.2518, 55.8642), "population": 600000}
                    ]
                elif region.name == "Île-de-France":
                    city_data = [
                        {"name": "Paris", "coords": (2.3522, 48.8566), "population": 2140000},
                        {"name": "Versailles", "coords": (2.1300, 48.8044), "population": 85000}
                    ]
                elif region.name == "Provence-Alpes-Côte d'Azur":
                    city_data = [
                        {"name": "Nice", "coords": (7.2620, 43.7102), "population": 340000},
                        {"name": "Marseille", "coords": (5.3698, 43.2965), "population": 860000}
                    ]
                elif region.name == "Tokyo":
                    city_data = [
                        {"name": "Tokyo", "coords": (139.6917, 35.6895), "population": 9270000},
                        {"name": "Yokohama", "coords": (139.6380, 35.4437), "population": 3720000}
                    ]
                elif region.name == "Osaka":
                    city_data = [
                        {"name": "Osaka", "coords": (135.5023, 34.6937), "population": 2690000},
                        {"name": "Kyoto", "coords": (135.7681, 35.0116), "population": 1470000}
                    ]
                elif region.name == "New South Wales":
                    city_data = [
                        {"name": "Sydney", "coords": (151.2093, -33.8688), "population": 5230000},
                        {"name": "Newcastle", "coords": (151.7795, -32.9283), "population": 430000}
                    ]
                elif region.name == "Victoria":
                    city_data = [
                        {"name": "Melbourne", "coords": (144.9631, -37.8136), "population": 5080000},
                        {"name": "Geelong", "coords": (144.3503, -38.1499), "population": 190000}
                    ]
                
                for c_data in city_data:
                    try:
                        with transaction.atomic():
                            geometry = Point(c_data["coords"][0], c_data["coords"][1])
                            bounding_box = self.create_simple_polygon(
                                c_data["coords"][0] - 0.1, c_data["coords"][1] - 0.1,
                                c_data["coords"][0] + 0.1, c_data["coords"][1] + 0.1
                            )
                            
                            city, created = City.objects.get_or_create(
                                name=c_data["name"],
                                country=country,
                                region=region,
                                defaults={
                                    "name_ascii": c_data["name"],
                                    "population": c_data["population"],
                                    "timezone": self.get_timezone_for_coords(c_data["coords"][0], c_data["coords"][1]),
                                    "geometry": geometry,
                                    "bounding_box": bounding_box,
                                    "feature_code": "PPLA" if "capital" in c_data and c_data["capital"] else "PPL"
                                }
                            )
                            cities.append(city)
                            if created:
                                self.stdout.write(f'Created city: {city.name} in {region.name}, {country.name}')
                            else:
                                self.stdout.write(f'Using existing city: {city.name} in {region.name}, {country.name}')
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error creating city {c_data["name"]}: {str(e)}'))
                        continue
        
        return countries, regions, cities

    def create_simple_multipolygon(self, x, y):
        """Create a simple MultiPolygon for testing purposes"""
        polygon = self.create_simple_polygon(x - 0.5, y - 0.5, x + 0.5, y + 0.5)
        return MultiPolygon(polygon)

    def create_simple_polygon(self, min_x, min_y, max_x, max_y):
        """Create a simple rectangular polygon"""
        coords = (
            (min_x, min_y),
            (min_x, max_y),
            (max_x, max_y),
            (max_x, min_y),
            (min_x, min_y)
        )
        return Polygon(coords)

    def get_timezone_for_coords(self, lon, lat):
        """Return a plausible timezone string based on coordinates"""
        if -130 < lon < -60:
            if lat > 40:
                return "America/New_York"
            else:
                return "America/Los_Angeles"
        elif -10 < lon < 40:
            return "Europe/London"
        elif 40 < lon < 160:
            if lat > 0:
                return "Asia/Tokyo"
            else:
                return "Australia/Sydney"
        else:
            return "UTC"

    def create_categories(self):
        """Create standard categories for the system"""
        categories = [
            ("Hotel", "Lodging in hotels of various classes"),
            ("Apartment", "Self-contained rental units"),
            ("Villa", "Luxury private residences"),
            ("Restaurant", "Dining establishments"),
            ("Museum", "Cultural institutions"),
            ("Adventure", "Outdoor activities"),
            ("Cultural", "Local cultural experiences"),
            ("Wellness", "Spa and relaxation"),
            ("Flight", "Air travel services"),
            ("Package", "Curated travel experiences")
        ]
        
        created = []
        for name, desc in categories:
            try:
                obj, created_new = Category.objects.get_or_create(
                    name=name,
                    defaults={'description': desc}
                )
                created.append(obj)
                if created_new:
                    self.stdout.write(f'Created category: {name}')
                else:
                    self.stdout.write(f'Using existing category: {name}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating category {name}: {str(e)}'))
        
        return created

    def create_interaction_types(self):
        """Create standard interaction types with point values"""
        interaction_types = [
            {
                "code": "view_place",
                "name": "View Place",
                "description": "User viewed a place details",
                "points_value": 1,
                "daily_limit": 10,
                "category": "engagement"
            },
            {
                "code": "view_experience",
                "name": "View Experience",
                "description": "User viewed an experience details",
                "points_value": 1,
                "daily_limit": 10,
                "category": "engagement"
            },
            {
                "code": "booking_complete",
                "name": "Complete Booking",
                "description": "User completed a booking",
                "points_value": 50,
                "daily_limit": 3,
                "category": "transaction"
            },
            {
                "code": "review_added",
                "name": "Add Review",
                "description": "User added a review",
                "points_value": 20,
                "daily_limit": 5,
                "category": "content"
            },
            {
                "code": "wishlist_add",
                "name": "Add to Wishlist",
                "description": "User added item to wishlist",
                "points_value": 5,
                "daily_limit": 10,
                "category": "engagement"
            },
            {
                "code": "profile_complete",
                "name": "Complete Profile",
                "description": "User completed their profile",
                "points_value": 25,
                "daily_limit": 1,
                "category": "account"
            },
            {
                "code": "referral",
                "name": "Refer a Friend",
                "description": "User referred a friend who signed up",
                "points_value": 100,
                "daily_limit": 5,
                "category": "referral"
            }
        ]
        
        created_types = []
        for type_data in interaction_types:
            try:
                interaction_type, created = InteractionType.objects.get_or_create(
                    code=type_data["code"],
                    defaults={
                        "name": type_data["name"],
                        "description": type_data["description"],
                        "points_value": type_data["points_value"],
                        "daily_limit": type_data["daily_limit"],
                        "category": type_data["category"]
                    }
                )
                created_types.append(interaction_type)
                if created:
                    self.stdout.write(f'Created interaction type: {interaction_type.name}')
                else:
                    self.stdout.write(f'Using existing interaction type: {interaction_type.name}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating interaction type {type_data["code"]}: {str(e)}'))
        
        return created_types

    def create_media(self, users, count):
        """Generate media items with realistic types and consistent metadata"""
        media_types = {
            'photo': [
                'hotel', 'apartment', 'beach', 'mountain',
                'city', 'restaurant', 'museum', 'pool'
            ],
            'video': [
                'tour', 'experience', 'destination', 'hotel'
            ]
        }
        
        media = []
        for _ in range(count):
            try:
                media_type = random.choice(['photo', 'video'])
                tag = random.choice(media_types[media_type])
                uploader = random.choice(users)
                
                file_uuid = fake.uuid4()
                extension = "mp4" if media_type == "video" else random.choice(["jpg", "png", "webp"])
                filename = f"{tag}_{file_uuid}.{extension}"
                
                media_item = Media.objects.create(
                    url=f"https://travel-media.example.com/{media_type}s/{filename}",
                    type=media_type,
                    uploaded_by=uploader
                )
                media.append(media_item)
            except Exception as e:
                logger.warning(f'Error creating media: {str(e)}')
        
        return media

    def create_single_place(self, categories, users, media_items, countries, regions, cities):
        """Create a single place"""
        place_categories = [c for c in categories if c.name in ["Hotel", "Apartment", "Villa", "Restaurant", "Museum"]]
        owners = [u for u in users if u.role in ["owner", "organization"]]
        
        if not place_categories or not owners or not cities:
            return None
            
        try:
            city = random.choice(cities)
            country = city.country
            region = city.region
            
            category = random.choice(place_categories)
            owner = random.choice(owners)
            
            name_prefix = ""
            if category.name == "Hotel":
                name_prefix = random.choice(["Grand", "Royal", "Plaza", "Luxury", "Comfort"])
            elif category.name == "Apartment":
                name_prefix = random.choice(["Modern", "Cozy", "Urban", "Elegant", "Central"])
            elif category.name == "Villa":
                name_prefix = random.choice(["Seaside", "Mountain", "Luxury", "Private", "Family"])
            elif category.name == "Restaurant":
                name_prefix = random.choice(["Gourmet", "Traditional", "Fusion", "Bistro", "Café"])
            elif category.name == "Museum":
                name_prefix = random.choice(["National", "Modern", "Historical", "Science", "Art"])
            
            name = f"{name_prefix} {fake.company()} {category.name}"
            while Place.objects.filter(name=name).exists():
                name = f"{name_prefix} {fake.company()} {category.name}"    

            city_point = city.geometry
            random_lat_offset = random.uniform(-0.03, 0.03)
            random_lon_offset = random.uniform(-0.03, 0.03)
            location = Point(
                float(city_point.x) + random_lon_offset,
                float(city_point.y) + random_lat_offset
            )    

            base_price = 0
            if category.name == "Hotel":
                base_price = random.uniform(80, 500)
            elif category.name == "Apartment":
                base_price = random.uniform(50, 300)
            elif category.name == "Villa":
                base_price = random.uniform(200, 1000)
            elif category.name == "Restaurant":
                base_price = random.uniform(20, 100)
            elif category.name == "Museum":
                base_price = random.uniform(10, 30)
            
            population_factor = 1.0
            if city.population:
                if city.population > 5000000:
                    population_factor = 1.5
                elif city.population > 1000000:
                    population_factor = 1.3
                elif city.population > 500000:
                    population_factor = 1.1
            
            price = round(base_price * population_factor, 2)

            amenities = []
            if category.name == "Hotel":
                amenities = random.sample([
                    'wifi', 'pool', 'gym', 'parking', 'restaurant',
                    'breakfast', 'aircon', 'spa', 'room_service', 'bar'
                ], k=random.randint(4, 8))
            elif category.name == "Apartment":
                amenities = random.sample([
                    'wifi', 'kitchen', 'washer', 'dryer', 'aircon',
                    'parking', 'elevator', 'balcony', 'workspace', 'tv'
                ], k=random.randint(3, 7))
            elif category.name == "Villa":
                amenities = random.sample([
                    'wifi', 'pool', 'garden', 'parking', 'kitchen',
                    'bbq', 'aircon', 'security', 'laundry', 'terrace'
                ], k=random.randint(5, 9))
            elif category.name == "Restaurant":
                amenities = random.sample([
                    'wifi', 'outdoor_seating', 'bar', 'private_dining',
                    'takeaway', 'delivery', 'vegetarian', 'vegan', 'gluten_free'
                ], k=random.randint(3, 6))
            elif category.name == "Museum":
                amenities = random.sample([
                    'wifi', 'guided_tours', 'gift_shop', 'cafe',
                    'wheelchair_access', 'audio_guide', 'parking', 'lockers'
                ], k=random.randint(3, 6))

            place = Place(
                category=category,
                owner=owner,
                name=name,
                description='\n'.join(fake.paragraphs(nb=2)),
                location=location,
                country=country,
                region=region,
                city=city,
                rating=round(random.uniform(3.0, 5.0), 1),
                is_available=random.choices([True, False], weights=[8, 2])[0],
                price=price,
                currency=country.currency,
                metadata={
                    'amenities': amenities,
                    'check_in_time': f"{random.randint(12, 15)}:00",
                    'check_out_time': f"{random.randint(10, 12)}:00",
                    'year_built': random.randint(1950, 2020),
                    'last_renovation': random.randint(2010, 2023),
                    'size_sqm': random.randint(30, 500),
                    'max_occupancy': random.randint(1, 10)
                }
            )
            place.save()
            
            if media_items:
                relevant_media = [m for m in media_items if 
                                 (category.name.lower() in m.url.lower()) or 
                                 (any(tag in m.url.lower() for tag in ['hotel', 'apartment', 'villa', 'restaurant', 'museum']))]
                
                if relevant_media:
                    place.media.set(random.sample(relevant_media, min(3, len(relevant_media))))
                else:
                    place.media.set(random.sample(media_items, min(3, len(media_items))))
            
            return place
        except Exception as e:
            logger.error(f'Error creating single place: {str(e)}', exc_info=True)
            return None

    def create_single_experience(self, categories, users, media_items, places):
        """Create a single experience"""
        experience_categories = [c for c in categories if c.name in ["Adventure", "Cultural", "Wellness"]]
        owners = [u for u in users if u.role in ["owner", "organization"]]
        
        if not experience_categories or not owners or not places:
            return None
            
        try:
            place = random.choice(places)
            
            category = random.choice(experience_categories)
            owner = random.choice(owners)
            
            title_prefix = ""
            if category.name == "Adventure":
                title_prefix = random.choice(["Exciting", "Thrilling", "Extreme", "Wild", "Epic"])
            elif category.name == "Cultural":
                title_prefix = random.choice(["Authentic", "Traditional", "Local", "Heritage", "Historical"])
            elif category.name == "Wellness":
                title_prefix = random.choice(["Relaxing", "Pampering", "Serene", "Tranquil", "Healing"])
            
            title = f"{title_prefix} {fake.catch_phrase()} Experience"
            while Experience.objects.filter(title=title).exists():
                title = f"{title_prefix} {fake.catch_phrase()} Experience"

            # Base price based on category
            price_per_person = 0
            if category.name == "Adventure":
                price_per_person = random.uniform(50, 300)
            elif category.name == "Cultural":
                price_per_person = random.uniform(20, 150)
            elif category.name == "Wellness":
                price_per_person = random.uniform(80, 250)
            
            # Adjust price based on city population
            population_factor = 1.0
            if place.city and place.city.population:
                if place.city.population > 5000000:
                    population_factor = 1.4
                elif place.city.population > 1000000:
                    population_factor = 1.2
                elif place.city.population > 500000:
                    population_factor = 1.1
            
            price_per_person = round(price_per_person * population_factor, 2)

            # Create schedule
            schedule = []
            for i in range(random.randint(1, 3)):
                day = {
                    "day": i + 1,
                    "activities": []
                }
                
                for j in range(random.randint(2, 5)):
                    start_hour = 8 + j * 2
                    end_hour = start_hour + random.randint(1, 2)
                    
                    activity = {
                        "time": f"{start_hour:02d}:00 - {end_hour:02d}:00",
                        "description": fake.sentence(),
                        "location": fake.word()
                    }
                    day["activities"].append(activity)
                
                schedule.append(day)

            experience = Experience(
                category=category,
                place=place,
                owner=owner,
                title=title,
                description='\n'.join(fake.paragraphs(nb=3)),
                price_per_person=price_per_person,
                currency=place.currency,
                duration=random.randint(60, 480),
                capacity=random.randint(1, 20),
                schedule=schedule,
                rating=round(random.uniform(3.5, 5.0), 1),
                is_available=random.choices([True, False], weights=[9, 1])[0]
            )
            experience.save()
            
            # Add media
            if media_items:
                relevant_media = [m for m in media_items if 
                                (category.name.lower() in m.url.lower()) or 
                                (any(tag in m.url.lower() for tag in ['adventure', 'cultural', 'wellness']))]
                
                if relevant_media:
                    experience.media.set(random.sample(relevant_media, min(3, len(relevant_media))))
                else:
                    experience.media.set(random.sample(media_items, min(3, len(media_items))))
            
            return experience
        except Exception as e:
            logger.error(f'Error creating single experience: {str(e)}', exc_info=True)
            return None

    def create_single_flight(self):
        """Create a single flight"""
        try:
            # Generate realistic flight number
            airline_code = random.choice(['AA', 'DL', 'UA', 'BA', 'LH', 'AF', 'EK', 'SQ'])
            flight_number = f"{airline_code}{random.randint(100, 9999)}"
            
            # Create realistic departure and arrival airports
            departure_airport = random.choice(['JFK', 'LAX', 'LHR', 'CDG', 'NRT', 'SYD'])
            arrival_airports = [a for a in ['JFK', 'LAX', 'LHR', 'CDG', 'NRT', 'SYD'] if a != departure_airport]
            arrival_airport = random.choice(arrival_airports)
            
            # Map airports to cities
            airport_to_city = {
                'JFK': 'New York',
                'LAX': 'Los Angeles',
                'LHR': 'London',
                'CDG': 'Paris',
                'NRT': 'Tokyo',
                'SYD': 'Sydney'
            }
            
            arrival_city = airport_to_city.get(arrival_airport, 'Unknown')
            
            # Create realistic departure and arrival times
            departure_time = timezone.now() + timedelta(days=random.randint(1, 30))
            flight_duration = random.randint(1, 15)  # hours
            arrival_time = departure_time + timedelta(hours=flight_duration)
            
            # Generate realistic pricing
            base_price = 100 + (flight_duration * 50)  # $100 base + $50 per hour
            price = round(base_price * random.uniform(0.8, 1.5), 2)  # Add some variability
            
            # Create baggage policy
            baggage_policy = {
                'checked': {
                    'allowed': random.randint(1, 2),
                    'weight_kg': random.choice([20, 23, 25, 30]),
                    'extra_fee': round(random.uniform(25, 100), 2)
                },
                'carry_on': {
                    'allowed': 1,
                    'weight_kg': random.choice([7, 8, 10]),
                    'dimensions_cm': '55x40x20'
                }
            }
            
            flight = Flight(
                airline=airline_code,
                flight_number=flight_number,
                departure_airport=departure_airport,
                arrival_airport=arrival_airport,
                airline_url=f"https://{airline_code.lower()}.com",
                arrival_city=arrival_city,
                departure_time=departure_time,
                arrival_time=arrival_time,
                price=price,
                currency="USD",
                duration=flight_duration * 60,
                baggage_policy=baggage_policy
            )
            flight.save()
            return flight
        except Exception as e:
            logger.error(f'Error creating single flight: {str(e)}', exc_info=True)
            return None

    def create_single_box(self, categories, media_items, places, experiences, countries, cities):
        """Create a single box (travel package)"""
        box_categories = [c for c in categories if c.name in ["Package"]]
        
        if not box_categories or not places or not experiences:
            return None
            
        try:
            category = random.choice(box_categories)
            
            # Choose a destination city and country
            city = random.choice(cities)
            country = city.country
            
            # Generate a name
            name_prefix = random.choice(["Ultimate", "Exclusive", "Premium", "Luxury", "Adventure"])
            name_suffix = random.choice(["Getaway", "Experience", "Escape", "Tour", "Journey"])
            name = f"{name_prefix} {city.name} {name_suffix}"
            
            # Set duration
            duration_days = random.randint(3, 14)
            
            # Calculate price based on included experiences and places
            base_price = random.uniform(500, 2000)
            
            # Create the box
            box = Box(
                category=category,
                name=name,
                description='\n'.join(fake.paragraphs(nb=3)),
                total_price=base_price,
                currency="USD",
                country=country,
                city=city,
                duration_days=duration_days,
                duration_hours=0,
                metadata={
                    'highlights': fake.sentences(nb=5),
                    'included': ['accommodation', 'breakfast', 'guided tours'],
                    'excluded': ['flights', 'travel insurance', 'personal expenses']
                },
                start_date=timezone.now() + timedelta(days=random.randint(30, 90)),
                is_customizable=random.choice([True, False]),
                max_group_size=random.randint(4, 20),
                tags=['featured'] if random.random() < 0.2 else []
            )
            box.save()
            
            # Set end date based on duration
            box.end_date = box.start_date + timedelta(days=duration_days)
            box.save(update_fields=['end_date'])
            
            # Add media
            if media_items:
                box.media.set(random.sample(media_items, min(4, len(media_items))))
            
            # Create itinerary days
            for day in range(1, duration_days + 1):
                itinerary_day = BoxItineraryDay(
                    box=box,
                    day_number=day,
                    date=box.start_date + timedelta(days=day-1) if box.start_date else None,
                    description=fake.paragraph(),
                    estimated_hours=random.randint(4, 10)
                )
                itinerary_day.save()
                
                # Add items to each day
                num_items = random.randint(2, 5)
                for i in range(num_items):
                    start_hour = 8 + i * 3
                    end_hour = start_hour + random.randint(1, 3)
                    
                    # Randomly choose between place and experience
                    if random.random() < 0.5 and places:
                        place = random.choice(places)
                        experience = None
                    elif experiences:
                        place = None
                        experience = random.choice(experiences)
                    else:
                        place = random.choice(places)
                        experience = None
                    
                    item = BoxItineraryItem(
                        itinerary_day=itinerary_day,
                        place=place,
                        experience=experience,
                        start_time=f"{start_hour:02d}:00",
                        end_time=f"{end_hour:02d}:00",
                        duration_minutes=(end_hour - start_hour) * 60,
                        order=i + 1,
                        notes=fake.sentence(),
                        is_optional=random.random() < 0.2,
                        estimated_cost=random.randint(10, 100) if random.random() < 0.5 else None
                    )
                    item.save()
            
            return box
        except Exception as e:
            logger.error(f'Error creating single box: {str(e)}', exc_info=True)
            return None

    def create_single_booking(self, users, places, experiences, flights, boxes):
        """Create a single booking"""
        if not users:
            return None
            
        try:
            user = random.choice(users)
            booking_type = random.choices(
                ['place', 'experience', 'flight', 'box'],
                weights=[4, 3, 2, 1]
            )[0]
            
            booking = Booking(
                user=user,
                status=random.choices(
                    ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
                    weights=[1, 6, 1, 2]
                )[0],
                booking_date=fake.date_time_between(start_date='-30d', end_date='now'),
                total_price=0, 
                currency='USD',
                group_size=random.randint(1, 4),
            )
            
            if booking_type == 'place' and places:
                place = random.choice(places)
                booking.place = place
                booking.total_price = place.price * booking.group_size
                booking.currency = place.currency
                check_in = fake.date_time_between(start_date='+1d', end_date='+30d')
                booking.check_in = check_in
                booking.check_out = check_in + timezone.timedelta(days=random.randint(1, 7))
                
            elif booking_type == 'experience' and experiences:
                experience = random.choice(experiences)
                booking.experience = experience
                booking.total_price = experience.price_per_person * booking.group_size
                booking.currency = experience.currency
                
            elif booking_type == 'flight' and flights:
                flight = random.choice(flights)
                booking.flight = flight
                booking.total_price = flight.price * booking.group_size
                booking.currency = flight.currency
                
            elif booking_type == 'box' and boxes:
                box = random.choice(boxes)
                booking.box = box
                booking.total_price = box.total_price * booking.group_size
                booking.currency = box.currency
            
            else:
                
                return None
                
            booking.save()
            return booking
        except Exception as e:
            logger.error(f'Error creating single booking: {str(e)}', exc_info=True)
            return None

    def create_single_discount(self, users, places, experiences, flights, boxes):
        """Create a single discount"""
        try:
            # Choose discount type and amount
            discount_type = random.choice(["Percentage", "Fixed"])
            if discount_type == "Percentage":
                amount = random.randint(5, 50)  # 5-50% discount
            else:
                amount = random.randint(10, 200)  # $10-$200 discount
            
            # Set validity period
            valid_from = timezone.now()
            valid_to = valid_from + timezone.timedelta(days=random.randint(30, 90))
            
            # Create discount code
            code_prefix = random.choice(["SUMMER", "WINTER", "SPRING", "FALL", "HOLIDAY", "SPECIAL"])
            code = f"{code_prefix}{random.randint(100, 999)}"
            
            # Create the discount
            discount = Discount(
                code=code,
                discount_type=discount_type,
                amount=amount,
                valid_from=valid_from,
                valid_to=valid_to,
                is_active=True,
                min_purchase_amount=random.randint(50, 200) if random.random() < 0.5 else None,
                max_discount_amount=random.randint(100, 500) if discount_type == "Percentage" and random.random() < 0.7 else None,
                max_uses=random.randint(10, 100) if random.random() < 0.8 else None,
                uses_count=0,
                metadata={
                    'campaign': f"Campaign {random.randint(1, 10)}",
                    'notes': fake.sentence()
                }
            )
            
            if users:
                discount.created_by = random.choice(users)
            
            discount.save()
            
            if places and random.random() < 0.7:
                discount.applicable_places.set(random.sample(places, min(3, len(places))))
            
            if experiences and random.random() < 0.5:
                discount.applicable_experiences.set(random.sample(experiences, min(2, len(experiences))))
            
            if flights and random.random() < 0.3:
                discount.applicable_flights.set(random.sample(flights, min(2, len(flights))))
            
            if boxes and random.random() < 0.4:
                discount.applicable_boxes.set(random.sample(boxes, min(1, len(boxes))))
            
            if users and random.random() < 0.3:
                discount.target_users.set(random.sample(users, min(5, len(users))))
            
            return discount
        except Exception as e:
            logger.error(f'Error creating discount: {str(e)}', exc_info=True)
            return None

    def create_single_payment(self, booking):
        """Create a payment for a booking"""
        try:
            payment_methods = ["Credit Card", "PayPal", "Bank Transfer", "Apple Pay", "Google Pay"]
            payment_statuses = ["Pending", "Completed", "Failed", "Refunded"]
            
            if booking.status == "Confirmed":
                status_weights = [1, 8, 1, 0]
            elif booking.status == "Cancelled":
                status_weights = [1, 2, 2, 5]
            else:
                status_weights = [5, 3, 2, 0]
            
            payment = Payment(
                user=booking.user,
                booking=booking,
                amount=booking.total_price,
                currency=booking.currency,
                payment_method=random.choice(payment_methods),
                payment_status=random.choices(payment_statuses, weights=status_weights)[0],
                transaction_id=fake.uuid4()
            )
            payment.save()
            return payment
        except Exception as e:
            logger.error(f'Error creating payment: {str(e)}', exc_info=True)
            return None

    def create_reviews_for_entity(self, users, place=None, experience=None, flight=None):
        """Create reviews for a specific entity"""
        if not users:
            return []
            
        reviews = []
        num_reviews = random.randint(1, 10)
        
        for _ in range(num_reviews):
            try:
                user = random.choice(users)
                
                if place:
                    rating = random.choices([3, 4, 5], weights=[1, 2, 7])[0]
                    review = Review(
                        user=user,
                        place=place,
                        rating=rating,
                        review_text=fake.paragraph()
                    )
                elif experience:
                    rating = random.choices([3, 4, 5], weights=[1, 3, 6])[0]
                    review = Review(
                        user=user,
                        experience=experience,
                        rating=rating,
                        review_text=fake.paragraph()
                    )
                elif flight:
                    rating = random.choices([2, 3, 4, 5], weights=[2, 3, 3, 2])[0]
                    review = Review(
                        user=user,
                        flight=flight,
                        rating=rating,
                        review_text=fake.paragraph()
                    )
                else:
                    continue
                    
                review.save()
                reviews.append(review)
            except Exception as e:
                logger.error(f'Error creating review: {str(e)}')
                
        return reviews

    def display_summary(self, results):
        """Display final summary of created data"""
        self.stdout.write(self.style.SUCCESS("\n=== Data Generation Complete! ===\n"))
        self.stdout.write(self.style.SUCCESS("Summary of Created Data:"))
        
        entities = [
            ("Users", results.get('users', [])),
            ("Places", results.get('places', [])),
            ("Experiences", results.get('experiences', [])),
            ("Flights", results.get('flights', [])),
            ("Travel Boxes", results.get('boxes', [])),
            ("Bookings", results.get('bookings', [])),
            ("Discounts", results.get('discounts', [])),
            ("Payments", results.get('payments', [])),
            ("Reviews", results.get('reviews', [])),
            ("Messages", results.get('messages', [])),
            ("Notifications", results.get('notifications', [])),
            ("Wishlists", results.get('wishlists', [])),
            ("User Interactions", results.get('user_interactions', [])),
            ("Login Logs", results.get('login_logs', [])),
            ("Points Transactions", results.get('points_transactions', [])),
            ("SMS Logs", results.get('notification_logs', {}).get('sms_logs', [])),
            ("Push Notification Logs", results.get('notification_logs', {}).get('push_logs', []))
        ]
        
        for name, items in entities:
            count = len(items) if items else 0
            self.stdout.write(f"{name}: {count}")
        
        self.stdout.write(self.style.SUCCESS("\nThis data is for development purposes only."))