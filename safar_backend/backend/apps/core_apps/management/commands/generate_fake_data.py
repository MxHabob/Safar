import random
import logging
from datetime import time, timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import transaction
from faker import Faker
from django.contrib.contenttypes.models import ContentType
from django.db import models
from phonenumber_field.phonenumber import PhoneNumber
from apps.authentication.models import User, UserProfile, UserInteraction
from apps.geographic_data.models import City, Country, Region
from apps.safar.models import (
    Category, Media, Discount, Message, Notification, 
    Payment, Place, Experience, Flight, Booking, 
    Review, Wishlist, Box, BoxItineraryDay, BoxItineraryItem
)

logger = logging.getLogger(__name__)
fake = Faker()

class Command(BaseCommand):
    help = 'Generates comprehensive fake data for the travel booking system'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50, help='Number of fake users to create')
        parser.add_argument('--places', type=int, default=20, help='Number of fake places to create')
        parser.add_argument('--experiences', type=int, default=15, help='Number of fake experiences to create')
        parser.add_argument('--flights', type=int, default=10, help='Number of fake flights to create')
        parser.add_argument('--boxes', type=int, default=0, help='Number of fake travel boxes to create')
        parser.add_argument('--bookings', type=int, default=30, help='Number of fake bookings to create')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before generation')
        parser.add_argument('--seed', type=int, help='Random seed for reproducible data generation')

    def handle(self, *args, **options):
        # Set random seed if provided
        if options.get('seed'):
            random.seed(options['seed'])
            fake.seed_instance(options['seed'])
            self.stdout.write(self.style.SUCCESS(f"Using random seed: {options['seed']}"))
        
        if options['clear']:
            self.clear_existing_data()
        
        self.stdout.write(self.style.SUCCESS('Starting data generation...'))
        
        # Use transaction to ensure data consistency
        with transaction.atomic():
            try:
                # 1. First create essential base data with proper validation
                categories = self.create_categories()
                country, region, cities = self.ensure_geographic_data()
                
                # 2. Create users - ensure we have owners for places/experiences
                users = self.create_users(options['users'], cities)
                if not users:
                    raise Exception("Failed to create users - cannot proceed")
                
                # 3. Create media items
                media_items = self.create_media(users, count=100)
                
                # 4. Create places with proper validation
                places = self.create_places(
                    options['places'], 
                    categories, 
                    users, 
                    media_items, 
                    cities
                )
                
                # 5. Create experiences with proper validation
                experiences = self.create_experiences(
                    options['experiences'], 
                    categories, 
                    users, 
                    media_items, 
                    places, 
                    cities
                )
                
                # 6. Create flights with proper city handling
                flights = self.create_flights(options['flights'], cities)
                
                # 7. Create boxes only if we have places and experiences
                boxes = []
                if places and experiences:
                    boxes = self.create_boxes(
                        options['boxes'], 
                        categories, 
                        users, 
                        media_items, 
                        places, 
                        experiences, 
                        cities
                    )
                
                # 8. Create bookings only if we have bookable entities
                bookings = []
                if places or experiences or flights or boxes:
                    bookings = self.create_bookings(
                        options['bookings'], 
                        users, 
                        places, 
                        experiences, 
                        flights, 
                        boxes
                    )
                
                # Create supporting entities
                discounts = self.create_discounts(places, experiences, flights, boxes)
                payments = self.create_payments(bookings) if bookings else []
                reviews = self.create_reviews(users, places, experiences, flights)
                
                # Create user interactions based on reviews and bookings
                interactions = self.create_user_interactions(users, places, experiences, reviews, bookings)
                
                messages = self.create_messages(users, bookings)
                notifications = self.create_notifications(users, bookings)
                wishlists = self.create_wishlists(users, places, experiences, flights, boxes)
                
                self.display_summary(
                    users, places, experiences, flights, boxes,
                    bookings, discounts, payments, reviews,
                    messages, notifications, wishlists, interactions
                )
                
            except Exception as e:
                logger.error(f'Data generation failed: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Data generation failed: {str(e)}'))
                # Transaction will be rolled back automatically

    def clear_existing_data(self):
        """Clear existing data from all models"""
        models_to_clear = [
            Wishlist, Review, Payment, Booking, 
            BoxItineraryItem, BoxItineraryDay, Box,
            Flight, Experience, Place, Discount,
            Media, UserInteraction, Message, Notification,
            UserProfile, User
        ]
        
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        for model in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f'Cleared {count} {model.__name__} records')

    def ensure_geographic_data(self):
        """Ensure we have basic geographic data that matches the actual model structure"""
        # First check if any countries exist
        if not Country.objects.exists():
            # Create sample country if none exists
            country = Country.objects.create(
                name="United States",
                code="US",
                phone_code="+1",
                currency="USD",
                languages=["en"]
            )
            self.stdout.write(self.style.SUCCESS(f'Created country: {country.name}'))
        else:
            country = Country.objects.first()
    
        # Create sample region if none exists
        if not Region.objects.exists():
            region = Region.objects.create(
                name="California",
                country=country
            )
            self.stdout.write(self.style.SUCCESS(f'Created region: {region.name}'))
        else:
            region = Region.objects.first()
    
        # Create sample cities if none exist
        if not City.objects.exists():
            cities_data = [
                {"name": "Los Angeles", "geometry": Point(-118.2437, 34.0522)},
                {"name": "San Francisco", "geometry": Point(-122.4194, 37.7749)},
                {"name": "New York", "geometry": Point(-74.0060, 40.7128)},
                {"name": "Chicago", "geometry": Point(-87.6298, 41.8781)},
                {"name": "Miami", "geometry": Point(-80.1918, 25.7617)}
            ]    
        
            cities = []
            for city_data in cities_data:
                city = City.objects.create(
                    name=city_data["name"],
                    region=region,
                    country=country,
                    geometry=city_data["geometry"]
                )
                cities.append(city)
                self.stdout.write(self.style.SUCCESS(f'Created city: {city.name}'))
        else:
            cities = list(City.objects.all())
    
        return country, region, cities

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
            obj, created_new = Category.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )
            created.append(obj)
            if created_new:
                self.stdout.write(f'Created category: {name}')
            else:
                self.stdout.write(f'Using existing category: {name}')
        
        return created

    def create_users(self, count, cities):
        """Generate realistic users with complete profiles"""
        if not cities:
            self.stdout.write(self.style.ERROR('No cities available - cannot assign locations to users'))
            return []
        
        roles = ["guest", "owner", "organization", "developer"]
        users = []
        created_count = 0
        attempt_limit = count * 2  # Allow some retries for uniqueness

        for _ in range(attempt_limit):
            if created_count >= count:
                break
                
            try:
                email = fake.unique.email()
                role = random.choice(roles)
                city = random.choice(cities)
                
                user = User.objects.create(
                    email=email,
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    role=role,
                    preferred_currency=random.choice(["USD", "EUR", "GBP"]),
                    membership_level=random.choice(["bronze", "silver", "gold"]),
                    is_active=True
                )
                user.set_password('Password123-')
                user.save()
                
                # Create detailed profile
                try:
                    self.create_user_profile(user, city)
                except Exception as profile_error:
                    logger.error(f'Profile creation failed for {email}: {str(profile_error)}', exc_info=True)
                    self.stdout.write(self.style.WARNING(f'Profile creation failed for {email}: {str(profile_error)}'))
                    # Delete user if profile fails
                    user.delete()
                    continue
                
                users.append(user)
                created_count += 1
                self.stdout.write(f'Created {role} user: {email}')
                
            except Exception as e:
                logger.warning(f'Error creating user: {str(e)}')
                continue
        
        if created_count < count:
            self.stdout.write(self.style.WARNING(f'Only created {created_count} of {count} requested users'))
        
        return users

    def create_user_profile(self, user, city):
        """Create a complete user profile"""
        try:
            phone_number = PhoneNumber.from_string(
                fake.phone_number(),
                region=city.country.code if hasattr(city.country, 'code') else 'US'
            )
        except Exception:
            phone_number = None



        travel_interests = random.sample([
            "adventure", "culture", "beach", "food", 
            "history", "shopping", "nature", "luxury"
        ], k=random.randint(2, 5))

        # Create random point near the city
        city_point = city.geometry
        # Add small random offset (approximately within 10km)
        random_lat_offset = random.uniform(-0.05, 0.05)
        random_lon_offset = random.uniform(-0.05, 0.05)
        location = Point(
            city_point.x + random_lon_offset,
            city_point.y + random_lat_offset
        )

        profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'bio': fake.text(max_nb_chars=300),
                'phone_number': phone_number,
                'location': location,
                'country': city.country,
                'region': city.region,
                'city': city,
                'postal_code': fake.postcode(),
                'address': fake.street_address(),
                'date_of_birth': fake.date_of_birth(minimum_age=18, maximum_age=80),
                'gender': random.choice(["male", "female", "prefer_not_to_say"]),
                'travel_interests': travel_interests,
                'privacy_consent': True,
                'consent_date': timezone.now(),
            }
        )
        
        return profile

    def create_media(self, users, count):
        """Generate media items with realistic types"""
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
                
                media_item = Media.objects.create(
                    url=f"https://example.com/media/{fake.uuid4()}",
                    type=media_type,
                    uploaded_by=random.choice(users)
                )
                media.append(media_item)
            except Exception as e:
                logger.warning(f'Error creating media: {str(e)}')
        
        self.stdout.write(f'Created {len(media)} media items')
        return media

    def create_places(self, count, categories, users, media_items, cities):
        """Generate various accommodation places"""
        place_categories = [c for c in categories if c.name in ["Hotel", "Apartment", "Villa"]]
        owners = [u for u in users if u.role in ["owner", "organization"]]
        places = []

        if not place_categories:
            self.stdout.write(self.style.ERROR('No place categories found'))
            return places
        
        if not owners:
            self.stdout.write(self.style.ERROR('No owner users found'))
            return places
       
        for _ in range(count):
            try:
                city = random.choice(cities)
                category = random.choice(place_categories)
                amenities = random.sample([
                    'wifi', 'pool', 'gym', 'parking',
                    'breakfast', 'aircon', 'kitchen',
                    'workspace', 'laundry'
                ], k=random.randint(3, 6))
                
                # Create a point near the city center
                city_point = city.geometry
                # Add small random offset (approximately within city limits)
                random_lat_offset = random.uniform(-0.03, 0.03)
                random_lon_offset = random.uniform(-0.03, 0.03)
                location = Point(
                    city_point.x + random_lon_offset,
                    city_point.y + random_lat_offset
                )
                
                # Generate opening hours
                opening_hour = random.randint(6, 10)
                closing_hour = random.randint(17, 22)
                
                place = Place.objects.create(
                    category=category,
                    owner=random.choice(owners),
                    name=f"{fake.company()} {category.name}",
                    description='\n'.join(fake.paragraphs(nb=2)),
                    location=location,
                    country=city.country,
                    region=city.region,
                    city=city,
                    rating=round(random.uniform(3.0, 5.0), 1),
                    is_available=random.choices([True, False], weights=[8, 2])[0],
                    price=round(random.uniform(50, 500), 2),
                    currency='USD',
                    metadata={
                        'amenities': amenities,
                        'capacity': random.randint(1, 8),
                        'rooms': random.randint(1, 5),
                        'opening_hours': [opening_hour, closing_hour],
                        'average_visit_duration': random.choice([60, 90, 120, 180]),
                        'activity_type': random.choice(['cultural', 'leisure', 'outdoor']),
                        'tags': random.sample(['family', 'luxury', 'budget', 'business', 'romantic'], k=2),
                        'popularity_score': round(random.uniform(0.1, 1.0), 2),
                        'is_indoor': random.choice([True, False])
                    }
                )
                
                # Attach media
                if media_items:
                    place.media.set(random.sample(media_items, min(3, len(media_items))))
                
                places.append(place)
                self.stdout.write(f'Created {category.name}: {place.name}')
                
            except Exception as e:
                logger.error(f'Error creating place: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating place: {str(e)}'))
        
        return places

    def create_experiences(self, count, categories, users, media_items, places, cities):
        """Generate local experiences"""
        experience_categories = [c for c in categories if c.name in ["Adventure", "Cultural", "Wellness"]]
        owners = [u for u in users if u.role in ["owner", "organization"]]
        experiences = []
        
        if not experience_categories or not owners:
            self.stdout.write(self.style.ERROR('Missing required data for experiences'))
            return experiences
        
        for _ in range(count):
            try:
                city = random.choice(cities)
                category = random.choice(experience_categories)
                schedule_days = random.sample(
                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    k=random.randint(1, 5)
                )
                
                # Create a point near the city center
                city_point = city.geometry
                # Add small random offset (approximately within city limits)
                random_lat_offset = random.uniform(-0.03, 0.03)
                random_lon_offset = random.uniform(-0.03, 0.03)
                location = Point(
                    city_point.x + random_lon_offset,
                    city_point.y + random_lat_offset
                )
                
                experience = Experience.objects.create(
                    category=category,
                    owner=random.choice(owners),
                    title=f"{category.name} Experience: {fake.catch_phrase()}",
                    description='\n'.join(fake.paragraphs(nb=3)),
                    location=location,
                    price_per_person=round(random.uniform(25, 300), 2),
                    currency='USD',
                    duration=random.choice([60, 90, 120, 180, 240]),
                    capacity=random.choice([2, 4, 6, 8, 10, 15]),
                    schedule={
                        'days': schedule_days,
                        'times': [f"{random.randint(8, 18)}:00" for _ in range(random.randint(1, 3))]
                    },
                    rating=round(random.uniform(3.5, 5.0), 1),
                    is_available=True
                )
                
                # Optionally link to a place
                if places and random.choice([True, False]):
                    experience.place = random.choice(places)
                    experience.save()
                
                # Attach media
                if media_items:
                    experience.media.set(random.sample(media_items, min(4, len(media_items))))
                
                experiences.append(experience)
                self.stdout.write(f'Created experience: {experience.title}')
                
            except Exception as e:
                logger.error(f'Error creating experience: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating experience: {str(e)}'))
        
        return experiences

    def create_flights(self, count, cities):
        """Generate realistic flight data"""
        airlines = [
            ("Delta", "DL", "https://www.delta.com"),
            ("United", "UA", "https://www.united.com"),
            ("American", "AA", "https://www.aa.com"),
            ("Emirates", "EK", "https://www.emirates.com"),
            ("Lufthansa", "LH", "https://www.lufthansa.com")
        ]
        
        flights = []
        for _ in range(count):
            try:
                airline, code, url = random.choice(airlines)
                departure_city = random.choice(cities)
                arrival_city = random.choice([c for c in cities if c != departure_city])
                
                # Generate naive datetime
                departure_time = fake.future_datetime(end_date="+60d")
                duration = random.randint(60, 720)  # 1-12 hours
                arrival_time = departure_time + timedelta(minutes=duration)
                
                # Make datetime objects timezone-aware
                departure_time = timezone.make_aware(departure_time)
                arrival_time = timezone.make_aware(arrival_time)
                
                # Create the flight
                flight = Flight.objects.create(
                    airline=airline,
                    flight_number=f"{code}{random.randint(1000, 9999)}",
                    departure_airport=departure_city.name[:3].upper(),
                    arrival_airport=arrival_city.name[:3].upper(),
                    airline_url=url,
                    arrival_city=arrival_city.name,
                    departure_time=departure_time,
                    arrival_time=arrival_time,
                    price=round(random.uniform(100, 2000), 2),
                    currency='USD',
                    duration=duration,
                    baggage_policy={
                        'checked': random.randint(0, 2),
                        'carry_on': 1,
                        'weight_limit': random.choice([15, 20, 23, 32])
                    }
                )
                
                flights.append(flight)
                self.stdout.write(f'Created flight: {flight.airline} {flight.flight_number}')
            
            except Exception as e:
                logger.error(f'Error creating flight: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating flight: {str(e)}'))
        
        return flights

    def create_boxes(self, count, categories, users, media_items, places, experiences, cities):
        """Generate curated travel boxes/packages"""
        boxes = []
        box_category = next((c for c in categories if c.name == 'Package'), None)

        if not box_category:
            self.stdout.write(self.style.ERROR('Package category not found - skipping boxes'))
            return boxes
        
        owners = [u for u in users if u.role in ["owner", "organization"]]
        if not owners:
            self.stdout.write(self.style.ERROR('No owner users found - skipping boxes'))
            return boxes
        
        for _ in range(count):
            try:
                city = random.choice(cities)
                available_places = [p for p in places if p.city == city]
                available_experiences = [e for e in experiences if e.place and e.place.city == city]
                
                if not available_places or not available_experiences:
                    self.stdout.write(self.style.WARNING(f'Not enough places/experiences in {city.name} - skipping box'))
                    continue
                
                # Calculate dates for the box
                start_date = fake.future_date(end_date="+60d")
                duration_days = random.randint(3, 10)
                end_date = start_date + timedelta(days=duration_days - 1)
                
                box = Box.objects.create(
                    category=box_category,
                    name=f"{city.name} {random.choice(['Adventure', 'Getaway', 'Experience', 'Journey'])}",
                    description='\n'.join(fake.paragraphs(nb=3)),
                    total_price=round(random.uniform(500, 5000), 2),
                    currency='USD',
                    country=city.country,
                    city=city,
                    duration_days=duration_days,
                    duration_hours=random.randint(0, 23),
                    start_date=start_date,
                    end_date=end_date,
                    is_customizable=random.choice([True, False]),
                    max_group_size=random.choice([2, 4, 6, 8]),
                    tags=random.sample(["adventure", "luxury", "family", "romantic", "budget"], k=2),
                    metadata={
                        'theme': random.choice(['adventure', 'relaxation', 'cultural', 'family', 'budget']),
                        'difficulty': random.choice(['easy', 'moderate', 'challenging']),
                        'recommended_age': random.choice(['all', 'adults', 'seniors', 'children']),
                        'generated': True,
                        'generation_date': timezone.now().isoformat()
                    }
                )
                
                # Create itinerary
                self.create_box_itinerary(box, available_places, available_experiences, start_date)
                
                # Attach media
                if media_items:
                    box.media.set(random.sample(media_items, min(5, len(media_items))))
                
                boxes.append(box)
                self.stdout.write(f'Created travel box: {box.name}')
                
            except Exception as e:
                logger.error(f'Error creating box: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating box: {str(e)}'))
        
        return boxes

    def create_box_itinerary(self, box, places, experiences, start_date):
        """Create detailed itinerary for a travel box"""
        if not places or not experiences:
            self.stdout.write(self.style.WARNING(f'Not enough places/experiences for box {box.id} itinerary'))
            return
        
        for day_num in range(1, box.duration_days + 1):
            day_date = start_date + timedelta(days=day_num - 1)
            itinerary_day = BoxItineraryDay.objects.create(
                box=box,
                day_number=day_num,
                date=day_date,
                description=f"Day {day_num}: {fake.sentence()}",
                estimated_hours=random.uniform(6, 12)
            )
            
            # Create 2-4 items per day
            for item_num in range(1, random.randint(2, 4) + 1):
                start_hour = random.randint(8, 16)
                duration = random.choice([60, 90, 120, 180])
                
                # Format times properly
                start_time = time(start_hour, 0)
                
                # Calculate end time
                end_hour = start_hour + (duration // 60)
                end_minute = duration % 60
                if end_hour >= 24:
                    end_hour = 23
                    end_minute = 59
                end_time = time(end_hour, end_minute)
                
                # Alternate between places and experiences
                if item_num % 2 == 0 and places:
                    place = random.choice(places)
                    BoxItineraryItem.objects.create(
                        itinerary_day=itinerary_day,
                        place=place,
                        start_time=start_time,
                        end_time=end_time,
                        duration_minutes=duration,
                        order=item_num,
                        notes=fake.sentence(),
                        estimated_cost=place.price,
                        is_optional=random.choice([True, False])
                    )
                elif experiences:
                    experience = random.choice(experiences)
                    BoxItineraryItem.objects.create(
                        itinerary_day=itinerary_day,
                        experience=experience,
                        start_time=start_time,
                        end_time=end_time,
                        duration_minutes=duration,
                        order=item_num,
                        notes=fake.sentence(),
                        estimated_cost=experience.price_per_person,
                        is_optional=random.choice([True, False])
                    )

    def create_bookings(self, count, users, places, experiences, flights, boxes):
        """Generate realistic bookings"""
        status_choices = ["Pending", "Confirmed", "Cancelled"]
        bookings = []
        
        for _ in range(count):
            try:
                user = random.choice(users)
                entity_type = random.choices(
                    ['place', 'experience', 'flight', 'box'],
                    weights=[40, 30, 20, 10]
                )[0]
                
                # Create booking date in the past
                booking_date = timezone.make_aware(
                    fake.date_time_between(start_date="-30d", end_date="now")
                )
                
                booking_data = {
                    'user': user,
                    'status': random.choice(status_choices),
                    'payment_status': random.choice(["Pending", "Completed"]),
                    'booking_date': booking_date,
                    'group_size': random.randint(1, 4)
                }
                
                if entity_type == 'place' and places:
                    place = random.choice(places)
                    # Create check-in date in the future
                    check_in = fake.future_date(end_date="+60d")
                    # Stay between 1-7 days
                    check_out = check_in + timedelta(days=random.randint(1, 7))
                    
                    booking_data.update({
                        'place': place,
                        'check_in': check_in,
                        'check_out': check_out,
                        'total_price': place.price * (check_out - check_in).days * booking_data['group_size'],
                        'currency': place.currency
                    })
                elif entity_type == 'experience' and experiences:
                    experience = random.choice(experiences)
                    booking_data.update({
                        'experience': experience,
                        'total_price': experience.price_per_person * booking_data['group_size'],
                        'currency': experience.currency
                    })
                elif entity_type == 'flight' and flights:
                    flight = random.choice(flights)
                    booking_data.update({
                        'flight': flight,
                        'total_price': flight.price * booking_data['group_size'],
                        'currency': flight.currency
                    })
                elif entity_type == 'box' and boxes:
                    box = random.choice(boxes)
                    booking_data.update({
                        'box': box,
                        'total_price': box.total_price * booking_data['group_size'],
                        'currency': box.currency,
                        'check_in': box.start_date,
                        'check_out': box.end_date
                    })
                else:
                    continue
                
                booking = Booking.objects.create(**booking_data)
                bookings.append(booking)
                self.stdout.write(f'Created booking for {entity_type} by {user.email}')
                
            except Exception as e:
                logger.error(f'Error creating booking: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating booking: {str(e)}'))
        
        return bookings

    def create_discounts(self, places, experiences, flights, boxes):
        """Generate promotional discounts"""
        discounts = []
        
        for i in range(5):  # Create 5 discounts
            try:
                discount_type = random.choice(["Percentage", "Fixed"])
                amount = round(random.uniform(5, 20), 2) if discount_type == "Percentage" else round(random.uniform(10, 50), 2)
                
                # Create valid dates
                valid_from = timezone.now()
                valid_to = valid_from + timedelta(days=random.randint(30, 90))
                
                discount = Discount.objects.create(
                    code=f"SAVE{i+1}{fake.random_letter().upper()}{fake.random_letter().upper()}",
                    discount_type=discount_type,
                    amount=amount,
                    valid_from=valid_from,
                    valid_to=valid_to,
                    is_active=True
                )
                
                # Apply discounts to random entities
                if places:
                    discount.applicable_places.set(random.sample(list(places), min(3, len(places))))
                if experiences:
                    discount.applicable_experiences.set(random.sample(list(experiences), min(2, len(experiences))))
                if flights:
                    discount.applicable_flights.set(random.sample(list(flights), min(2, len(flights))))
                if boxes:
                    discount.applicable_boxes.set(random.sample(list(boxes), min(1, len(boxes))))
                
                discounts.append(discount)
                self.stdout.write(f'Created discount code: {discount.code} ({discount.amount} {discount.discount_type})')
                
            except Exception as e:
                logger.error(f'Error creating discount: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating discount: {str(e)}'))
        
        return discounts

    def create_payments(self, bookings):
        """Generate payment records for bookings"""
        payments = []
        methods = ["Credit Card", "PayPal", "Bank Transfer", "Apple Pay", "Google Pay"]
        
        for booking in bookings:
            try:
                # Only create payment for confirmed bookings
                if booking.status != "Confirmed":
                    continue
                    
                payment = Payment.objects.create(
                    user=booking.user,
                    booking=booking,
                    amount=booking.total_price,
                    currency=booking.currency,
                    payment_method=random.choice(methods),
                    payment_status="Completed",
                    transaction_id=fake.uuid4()
                )
                payments.append(payment)
                
                # Update booking payment status
                booking.payment_status = "Completed"
                booking.save()
                
                self.stdout.write(f'Created payment for booking {booking.id}')
            except Exception as e:
                logger.error(f'Error creating payment: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating payment: {str(e)}'))
        
        return payments

    def create_reviews(self, users, places, experiences, flights):
        """Generate user reviews for various entities"""
        reviews = []
        
        # Review places
        for place in random.sample(list(places), min(10, len(places))):
            try:
                # Create 1-3 reviews per place
                for _ in range(random.randint(1, 3)):
                    user = random.choice(users)
                    rating = random.randint(3, 5)
                    review = Review.objects.create(
                        user=user,
                        place=place,
                        rating=rating,
                        review_text='\n'.join(fake.paragraphs(nb=1))
                    )
                    reviews.append(review)
                    
                    # Update place rating
                    place_reviews = Review.objects.filter(place=place)
                    avg_rating = place_reviews.aggregate(models.Avg('rating'))['rating__avg']
                    place.rating = round(avg_rating, 1)
                    place.save()
                    
                    self.stdout.write(f'Created review for place {place.name} by {user.email}')
            except Exception as e:
                logger.error(f'Error creating place review: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating place review: {str(e)}'))
        
        # Review experiences
        for experience in random.sample(list(experiences), min(8, len(experiences))):
            try:
                # Create 1-3 reviews per experience
                for _ in range(random.randint(1, 3)):
                    user = random.choice(users)
                    rating = random.randint(3, 5)
                    review = Review.objects.create(
                        user=user,
                        experience=experience,
                        rating=rating,
                        review_text='\n'.join(fake.paragraphs(nb=1))
                    )
                    reviews.append(review)
                    
                    # Update experience rating
                    exp_reviews = Review.objects.filter(experience=experience)
                    avg_rating = exp_reviews.aggregate(models.Avg('rating'))['rating__avg']
                    experience.rating = round(avg_rating, 1)
                    experience.save()
                    
                    self.stdout.write(f'Created review for experience {experience.title} by {user.email}')
            except Exception as e:
                logger.error(f'Error creating experience review: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating experience review: {str(e)}'))
        
        return reviews

    def create_user_interactions(self, users, places, experiences, reviews, bookings):
        """Generate user interaction data for analytics"""
        interactions = []
        
        # Create view interactions
        for place in places:
            for _ in range(random.randint(5, 20)):
                try:
                    user = random.choice(users)
                    interaction = UserInteraction.objects.create(
                        user=user,
                        content_type=ContentType.objects.get_for_model(Place),
                        object_id=place.id,
                        interaction_type='view_place',
                        metadata={
                            'duration': random.randint(10, 300),
                            'source': random.choice(['search', 'recommendation', 'direct'])
                        },
                        session_id=fake.uuid4(),
                        device_type=random.choice(['mobile', 'desktop', 'tablet'])
                    )
                    interactions.append(interaction)
                except Exception as e:
                    logger.warning(f'Error creating place view interaction: {str(e)}')
        
        # Create interactions based on reviews
        for review in reviews:
            try:
                if review.place:
                    interaction_type = 'rating_given'
                    content_type = ContentType.objects.get_for_model(Place)
                    object_id = review.place.id
                elif review.experience:
                    interaction_type = 'rating_given'
                    content_type = ContentType.objects.get_for_model(Experience)
                    object_id = review.experience.id
                else:
                    continue
                
                interaction = UserInteraction.objects.create(
                    user=review.user,
                    content_type=content_type,
                    object_id=object_id,
                    interaction_type=interaction_type,
                    metadata={
                        'rating': review.rating,
                        'has_review': True
                    },
                    session_id=fake.uuid4(),
                    device_type=random.choice(['mobile', 'desktop', 'tablet'])
                )
                interactions.append(interaction)
                
                # Also create a review_added interaction
                interaction = UserInteraction.objects.create(
                    user=review.user,
                    content_type=content_type,
                    object_id=object_id,
                    interaction_type='review_added',
                    metadata={
                        'review_length': len(review.review_text)
                    },
                    session_id=fake.uuid4(),
                    device_type=random.choice(['mobile', 'desktop', 'tablet'])
                )
                interactions.append(interaction)
            except Exception as e:
                logger.warning(f'Error creating review interaction: {str(e)}')
        
        # Create booking interactions
        for booking in bookings:
            try:
                if booking.place:
                    content_type = ContentType.objects.get_for_model(Place)
                    object_id = booking.place.id
                elif booking.experience:
                    content_type = ContentType.objects.get_for_model(Experience)
                    object_id = booking.experience.id
                elif booking.flight:
                    content_type = ContentType.objects.get_for_model(Flight)
                    object_id = booking.flight.id
                elif booking.box:
                    content_type = ContentType.objects.get_for_model(Box)
                    object_id = booking.box.id
                else:
                    continue
                
                # Create booking_start interaction
                interaction = UserInteraction.objects.create(
                    user=booking.user,
                    content_type=content_type,
                    object_id=object_id,
                    interaction_type='booking_start',
                    metadata={
                        'group_size': booking.group_size
                    },
                    session_id=fake.uuid4(),
                    device_type=random.choice(['mobile', 'desktop', 'tablet'])
                )
                interactions.append(interaction)
                
                # Create booking_complete interaction for confirmed bookings
                if booking.status == 'Confirmed':
                    interaction = UserInteraction.objects.create(
                        user=booking.user,
                        content_type=content_type,
                        object_id=object_id,
                        interaction_type='booking_complete',
                        metadata={
                            'total_price': float(booking.total_price),
                            'currency': booking.currency
                        },
                        session_id=fake.uuid4(),
                        device_type=random.choice(['mobile', 'desktop', 'tablet'])
                    )
                    interactions.append(interaction)
                
                # Create booking_abandon interaction for cancelled bookings
                if booking.status == 'Cancelled':
                    interaction = UserInteraction.objects.create(
                        user=booking.user,
                        content_type=content_type,
                        object_id=object_id,
                        interaction_type='booking_abandon',
                        metadata={
                            'reason': random.choice(['price', 'changed_mind', 'found_alternative', 'technical_issue'])
                        },
                        session_id=fake.uuid4(),
                        device_type=random.choice(['mobile', 'desktop', 'tablet'])
                    )
                    interactions.append(interaction)
            except Exception as e:
                logger.warning(f'Error creating booking interaction: {str(e)}')
        
        self.stdout.write(f'Created {len(interactions)} user interactions')
        return interactions

    def create_messages(self, users, bookings):
        """Generate communication messages"""
        messages = []
        
        # User-to-user messages
        for _ in range(min(20, len(users))):
            try:
                sender = random.choice(users)
                receiver = random.choice([u for u in users if u != sender])
                
                message = Message.objects.create(
                    sender=sender,
                    receiver=receiver,
                    message_text=fake.paragraph(),
                    is_read=random.choice([True, False])
                )
                messages.append(message)
                self.stdout.write(f'Created message from {sender.email} to {receiver.email}')
            except Exception as e:
                logger.error(f'Error creating message: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating message: {str(e)}'))
        
        # Booking-related messages
        for booking in random.sample(list(bookings), min(10, len(bookings))):
            try:
                sender = booking.user
                # Find an owner user
                owners = [u for u in users if u.role in ["owner", "organization"]]
                if not owners:
                    continue
                receiver = random.choice(owners)
                
                message = Message.objects.create(
                    sender=sender,
                    receiver=receiver,
                    booking=booking,
                    message_text=f"Regarding booking #{booking.id}: {fake.sentence()}",
                    is_read=random.choice([True, False])
                )
                messages.append(message)
                self.stdout.write(f'Created booking message for booking {booking.id}')
            except Exception as e:
                logger.error(f'Error creating booking message: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating booking message: {str(e)}'))
        
        return messages

    def create_notifications(self, users, bookings):
        """Generate user notifications"""
        notification_types = [
            "Booking Update", "Payment", "New Box", 
            "Personalized Box", "Discount", "Message", "General"
        ]
        notifications = []
        
        # General notifications for random users
        for user in random.sample(list(users), min(15, len(users))):
            try:
                notification_type = random.choice(notification_types)
                
                notification = Notification.objects.create(
                    user=user,
                    type=notification_type,
                    message=fake.sentence(),
                    is_read=random.choice([True, False]),
                    status=random.choice(['pending', 'sent', 'delivered']),
                    channels=random.sample(["app", "email", "sms"], k=random.randint(1, 2)),
                    metadata={
                        'priority': random.choice(['high', 'medium', 'low']),
                        'action_url': f"https://example.com/{fake.uri_path()}" if random.choice([True, False]) else None
                    }
                )
                notifications.append(notification)
                self.stdout.write(f'Created {notification_type} notification for {user.email}')
            except Exception as e:
                logger.error(f'Error creating notification: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating notification: {str(e)}'))
        
        # Booking-related notifications
        for booking in random.sample(list(bookings), min(10, len(bookings))):
            try:
                notification = Notification.objects.create(
                    user=booking.user,
                    type="Booking Update",
                    message=f"Your booking #{booking.id} has been {booking.status.lower()}",
                    is_read=random.choice([True, False]),
                    status='delivered',
                    channels=["app", "email"],
                    metadata={
                        'booking_id': str(booking.id),
                        'status': booking.status,
                        'deep_link': f"http://localhost:3000/booking/{booking.id}"
                    }
                )
                notifications.append(notification)
                self.stdout.write(f'Created booking notification for booking {booking.id}')
            except Exception as e:
                logger.error(f'Error creating booking notification: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating booking notification: {str(e)}'))
        
        return notifications

    def create_wishlists(self, users, places, experiences, flights, boxes):
        """Generate user wishlists"""
        wishlists = []
        
        for user in random.sample(list(users), min(10, len(users))):
            try:
                # Create 1-3 wishlist items per user
                for _ in range(random.randint(1, 3)):
                    wishlist_data = {'user': user}
                    
                    # Choose one entity type to add
                    entity_type = random.choice(['place', 'experience', 'flight', 'box'])
                    
                    if entity_type == 'place' and places:
                        wishlist_data['place'] = random.choice(places)
                    elif entity_type == 'experience' and experiences:
                        wishlist_data['experience'] = random.choice(experiences)
                    elif entity_type == 'flight' and flights:
                        wishlist_data['flight'] = random.choice(flights)
                    elif entity_type == 'box' and boxes:
                        wishlist_data['box'] = random.choice(boxes)
                    else:
                        continue
                    
                    wishlist = Wishlist.objects.create(**wishlist_data)
                    wishlists.append(wishlist)
                    
                    # Create wishlist_add interaction
                    if 'place' in wishlist_data:
                        content_type = ContentType.objects.get_for_model(Place)
                        object_id = wishlist_data['place'].id
                    elif 'experience' in wishlist_data:
                        content_type = ContentType.objects.get_for_model(Experience)
                        object_id = wishlist_data['experience'].id
                    elif 'flight' in wishlist_data:
                        content_type = ContentType.objects.get_for_model(Flight)
                        object_id = wishlist_data['flight'].id
                    elif 'box' in wishlist_data:
                        content_type = ContentType.objects.get_for_model(Box)
                        object_id = wishlist_data['box'].id
                    
                    UserInteraction.objects.create(
                        user=user,
                        content_type=content_type,
                        object_id=object_id,
                        interaction_type='wishlist_add',
                        session_id=fake.uuid4(),
                        device_type=random.choice(['mobile', 'desktop', 'tablet'])
                    )
                    
                    self.stdout.write(f'Created wishlist item for {user.email}')
            except Exception as e:
                logger.error(f'Error creating wishlist: {str(e)}', exc_info=True)
                self.stdout.write(self.style.ERROR(f'Error creating wishlist: {str(e)}'))
        
        return wishlists

    def display_summary(self, *args):
        """Display final summary of created data"""
        entities = [
            ("Users", args[0]),
            ("Places", args[1]),
            ("Experiences", args[2]),
            ("Flights", args[3]),
            ("Travel Boxes", args[4]),
            ("Bookings", args[5]),
            ("Discounts", args[6]),
            ("Payments", args[7]),
            ("Reviews", args[8]),
            ("Messages", args[9]),
            ("Notifications", args[10]),
            ("Wishlists", args[11]),
            ("User Interactions", args[12])
        ]
        
        self.stdout.write(self.style.SUCCESS("\n=== Data Generation Complete! ===\n"))
        self.stdout.write(self.style.SUCCESS("Summary of Created Data:"))
        
        for name, items in entities:
            count = len(items) if items else 0
            self.stdout.write(f"{name}: {count}")
        
        self.stdout.write(self.style.SUCCESS("\nYou can now use this data for testing and development."))