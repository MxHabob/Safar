import random
from django.core.management.base import BaseCommand
from faker import Faker
from django.contrib.gis.geos import Point
from phonenumber_field.phonenumber import PhoneNumber
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models import User, UserProfile
from apps.geographic_data.models import City
from apps.safar.models import Category, Media, Discount, Message, Notification, Payment, Place, Experience, Flight, Booking, Review, Wishlist

fake = Faker()

class Command(BaseCommand):
    help = 'Generates comprehensive fake data for all models in the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=50,
            help='Number of fake users to create'
        )
        parser.add_argument(
            '--places',
            type=int,
            default=20,
            help='Number of fake places to create'
        )
        parser.add_argument(
            '--experiences',
            type=int,
            default=15,
            help='Number of fake experiences to create'
        )
        parser.add_argument(
            '--flights',
            type=int,
            default=10,
            help='Number of fake flights to create'
        )
        parser.add_argument(
            '--bookings',
            type=int,
            default=30,
            help='Number of fake bookings to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to generate comprehensive fake data...'))
        
        # Create basic entities first
        categories = self.create_categories()
        
        # Create users with owner roles needed for places/experiences
        users = self.create_users(options['users'])
        media_items = self.create_media(users, count=100)
        
        # Create places and experiences
        places = self.create_places(options['places'], categories, users, media_items)
        experiences = self.create_experiences(options['experiences'], categories, users, media_items, places)
        flights = self.create_flights(options['flights'])
        
        # Create bookings
        bookings = self.create_bookings(options['bookings'], users, places, experiences, flights)
        
        # Create related entities
        discounts = self.create_discounts(places, experiences, flights)
        payments = self.create_payments(users, bookings)
        reviews = self.create_reviews(users, places, experiences, flights)
        messages = self.create_messages(users, bookings)
        
        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully generated comprehensive fake data:'
            f'\n- {len(users)} users with profiles'
            f'\n- {len(categories)} categories'
            f'\n- {len(media_items)} media items'
            f'\n- {len(places)} places'
            f'\n- {len(experiences)} experiences'
            f'\n- {len(flights)} flights'
            f'\n- {len(discounts)} discounts'
            f'\n- {len(bookings)} bookings'
            f'\n- {len(reviews)} reviews'
            f'\n- {len(payments)} payments'
            f'\n- {len(messages)} messages'
        ))

    def create_categories(self):
        categories = [
            ("Hotel", "Accommodation in hotels"),
            ("Apartment", "Rental apartments and flats"),
            ("Villa", "Luxury villas and private homes"),
            ("Restaurant", "Dining establishments"),
            ("Museum", "Cultural and historical museums"),
            ("Adventure", "Outdoor and adventure activities"),
            ("Cultural", "Cultural experiences and tours"),
            ("Relaxation", "Spa and wellness activities"),
            ("Flight", "Air travel services"),
            ("Package", "Travel packages and boxes")
        ]
        
        created = []
        for name, desc in categories:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )
            created.append(cat)
            self.stdout.write(self.style.SUCCESS(f'Created category: {name}'))
        return created

    def create_users(self, count):
        users = []
        roles = ["guest", "owner", "organization", "developer"]
        
        for i in range(count):
            try:
                email = fake.unique.email()
                role = random.choice(roles)
                
                user_data = {
                    'email': email,
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'is_active': True,
                    'role': role,
                    'preferred_currency': random.choice(["USD", "EUR", "GBP", "JPY"]),
                    'membership_level': random.choice(["bronze", "silver", "gold"])
                }
                
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults=user_data
                )
                
                if created:
                    user.set_password('password123')
                    user.save()
                    
                    # Create profile
                    city = City.objects.order_by('?').first()
                    try:
                        phone_number = PhoneNumber.from_string(
                            fake.phone_number(), 
                            region=city.country.code if city and city.country else 'US'
                        )
                    except:
                        phone_number = None
                        
                    profile_data = {
                        'bio': fake.text(max_nb_chars=500),
                        'phone_number': phone_number,
                        'location': Point(float(fake.longitude()), float(fake.latitude())),
                        'country': city.country if city else None,
                        'region': city.region if city else None,
                        'city': city,
                        'postal_code': fake.postcode(),
                        'address': fake.street_address(),
                        'date_of_birth': fake.date_of_birth(minimum_age=18, maximum_age=90),
                        'gender': random.choice(["male", "female", "prefer_not_to_say"]),
                        'travel_interests': random.sample(
                            ["adventure", "culture", "beach", "food", "history", "nature"],
                            k=random.randint(1, 4)
                        )
                    }
                    
                    UserProfile.objects.create(user=user, **profile_data)
                    self.stdout.write(self.style.SUCCESS(f'Created {role} user: {email}'))
                else:
                    self.stdout.write(self.style.NOTICE(f'User exists: {email}'))
                
                users.append(user)
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user {i+1}/{count}: {str(e)}'))
                continue
        
        return users

    def create_media(self, users, count):
        media = []
        photo_urls = [
            "https://source.unsplash.com/random/800x600/?hotel",
            "https://source.unsplash.com/random/800x600/?apartment",
            "https://source.unsplash.com/random/800x600/?villa",
            "https://source.unsplash.com/random/800x600/?restaurant",
            "https://source.unsplash.com/random/800x600/?museum"
        ]
        
        video_urls = [
            "https://example.com/videos/sample1.mp4",
            "https://example.com/videos/sample2.mp4",
            "https://example.com/videos/sample3.mp4"
        ]
        
        for _ in range(count):
            try:
                is_photo = random.choice([True, False])
                media_type = 'photo' if is_photo else 'video'
                url = random.choice(photo_urls) if is_photo else random.choice(video_urls)
                
                media_item = Media.objects.create(
                    url=url,
                    type=media_type,
                    uploaded_by=random.choice(users)
                    )
                
                media.append(media_item)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating media: {str(e)}'))
                continue
                
        return media

    def create_places(self, count, categories, users, media_items):
        places = []
        accommodation_categories = [c for c in categories if c.name in ["Hotel", "Apartment", "Villa"]]
        city_qs = City.objects.select_related('country', 'region')
        
        if not accommodation_categories:
            self.stdout.write(self.style.ERROR('No accommodation categories found!'))
            return places
            
        owner_users = [u for u in users if u.role in ["owner", "organization"]]
        if not owner_users:
            self.stdout.write(self.style.ERROR('No owner/organization users found!'))
            return places
            
        for _ in range(count):
            try:
                city = random.choice(list(city_qs)) if city_qs.exists() else None
                place_data = {
                    'category': random.choice(accommodation_categories),
                    'owner': random.choice(owner_users),
                    'name': fake.company(),
                    'description': '\n'.join(fake.paragraphs(nb=3)),
                    'location': Point(float(fake.longitude()), float(fake.latitude())),
                    'country': city.country if city else None,
                    'city': city,
                    'region': city.region if city else None,
                    'rating': round(random.uniform(3.0, 5.0), 1),
                    'is_available': random.choices([True, False], weights=[80, 20])[0],
                    'price': round(random.uniform(50, 500), 2),
                    'currency': random.choice(["USD", "EUR", "GBP"]),
                    'metadata': {
                        'amenities': random.sample(
                            ['wifi', 'pool', 'gym', 'parking', 'breakfast', 'aircon'],
                            k=random.randint(2, 5)
                        ),
                        'capacity': random.randint(1, 10)
                    }
                }
                
                place = Place.objects.create(**place_data)
                
                # Add 3-5 random media items
                if media_items:
                    place_media = random.sample(media_items, min(random.randint(3, 5), len(media_items)))
                    place.media.set(place_media)
                
                places.append(place)
                self.stdout.write(self.style.SUCCESS(f'Created place: {place.name}'))
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating place: {str(e)}'))
                continue
                
        return places

    def create_experiences(self, count, categories, users, media_items, places):
        experiences = []
        experience_categories = [c for c in categories if c.name in ["Adventure", "Cultural", "Relaxation"]]
        
        if not experience_categories:
            self.stdout.write(self.style.ERROR('No experience categories found!'))
            return experiences
            
        owner_users = [u for u in users if u.role in ["owner", "organization"]]
        if not owner_users:
            self.stdout.write(self.style.ERROR('No owner/organization users found!'))
            return experiences
            
        for _ in range(count):
            try:
                city = City.objects.order_by('?').first()
                experience_data = {
                    'category': random.choice(experience_categories),
                    'place': random.choice(places) if places and random.choice([True, False]) else None,
                    'owner': random.choice(owner_users),
                    'title': fake.catch_phrase(),
                    'description': '\n'.join(fake.paragraphs(nb=2)),
                    'location': Point(float(fake.longitude()), float(fake.latitude())),
                    'price_per_person': round(random.uniform(20, 200), 2),
                    'currency': random.choice(["USD", "EUR", "GBP"]),
                    'duration': random.choice([60, 90, 120, 180, 240, 360]),
                    'capacity': random.choice([1, 2, 4, 6, 8, 10, 15, 20]),
                    'schedule': {
                        'days': random.sample(
                            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                            k=random.randint(1, 7)
                        ),
                        'times': [f"{random.randint(8, 18)}:00" for _ in range(random.randint(1, 3))]
                    },
                    'rating': round(random.uniform(3.0, 5.0), 1),
                    'is_available': random.choices([True, False], weights=[90, 10])[0]
                }
                
                experience = Experience.objects.create(**experience_data)
                
                # Add 2-4 random media items
                if media_items:
                    exp_media = random.sample(media_items, min(random.randint(2, 4), len(media_items)))
                    experience.media.set(exp_media)
                
                experiences.append(experience)
                self.stdout.write(self.style.SUCCESS(f'Created experience: {experience.title}'))
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating experience: {str(e)}'))
                continue
                
        return experiences

    def create_flights(self, count):
        flights = []
        airlines = [
            ("Delta Airlines", "https://www.delta.com"),
            ("United Airlines", "https://www.united.com"),
            ("Emirates", "https://www.emirates.com"),
            ("Lufthansa", "https://www.lufthansa.com"),
            ("Qatar Airways", "https://www.qatarairways.com")
        ]
        
        airports = [
            ("JFK", "New York"),
            ("LAX", "Los Angeles"),
            ("LHR", "London"),
            ("CDG", "Paris"),
            ("FRA", "Frankfurt"),
            ("DXB", "Dubai"),
            ("HND", "Tokyo"),
            ("SYD", "Sydney")
        ]
        
        for _ in range(count):
            try:
                airline, airline_url = random.choice(airlines)
                departure_code, departure_city = random.choice(airports)
                arrival_code, arrival_city = random.choice([a for a in airports if a[0] != departure_code])
                
                departure_time = fake.future_datetime(end_date="+30d")
                duration = random.randint(60, 720)  # 1-12 hours
                arrival_time = departure_time + timedelta(minutes=duration)
                
                flight_data = {
                    'airline': airline,
                    'flight_number': fake.unique.bothify(text='??####'),
                    'departure_airport': departure_code,
                    'arrival_airport': arrival_code,
                    'airline_url': airline_url,
                    'arrival_city': arrival_city,
                    'departure_time': departure_time,
                    'arrival_time': arrival_time,
                    'price': round(random.uniform(200, 2000), 2),
                    'currency': random.choice(["USD", "EUR", "GBP"]),
                    'duration': duration,
                    'baggage_policy': {
                        'checked': random.randint(0, 2),
                        'carry_on': 1,
                        'weight_limit': random.choice([15, 20, 23, 32])
                    }
                }
                
                flight = Flight.objects.create(**flight_data)
                flights.append(flight)
                self.stdout.write(self.style.SUCCESS(f'Created flight: {flight.airline} {flight.flight_number}'))
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating flight: {str(e)}'))
                continue
                
        return flights

    def create_bookings(self, count, users, places, experiences, flights):
        bookings = []
        status_choices = ["Pending", "Confirmed", "Cancelled"]
        payment_status_choices = ["Pending", "Completed", "Failed", "Refunded"]
        
        # Ensure we have at least one of each entity type
        if not places and not experiences and not flights:
            self.stdout.write(self.style.ERROR('No places, experiences, or flights available to create bookings!'))
            return bookings
            
        for _ in range(count):
            try:
                user = random.choice(users)
                booking_type = random.choice(["place", "experience", "flight"])
                booking_data = {}
                
                if booking_type == "place" and places:
                    place = random.choice(places)
                    check_in = fake.future_date(end_date="+60d")
                    check_out = check_in + timedelta(days=random.randint(1, 14))
                    booking_data = {
                        'user': user,
                        'place': place,
                        'check_in': check_in,
                        'check_out': check_out,
                        'total_price': place.price * random.randint(1, 3),
                        'currency': place.currency,
                        'status': random.choice(status_choices),
                        'payment_status': random.choice(payment_status_choices),
                        'booking_date': fake.date_time_between(start_date="-30d", end_date="now")
                    }
                elif booking_type == "experience" and experiences:
                    experience = random.choice(experiences)
                    booking_date = fake.date_time_between(start_date="-30d", end_date="now")
                    booking_data = {
                        'user': user,
                        'experience': experience,
                        'total_price': experience.price_per_person * random.randint(1, 4),
                        'currency': experience.currency,
                        'status': random.choice(status_choices),
                        'payment_status': random.choice(payment_status_choices),
                        'booking_date': booking_date
                    }
                elif booking_type == "flight" and flights:
                    flight = random.choice(flights)
                    booking_date = fake.date_time_between(start_date="-30d", end_date="now")
                    booking_data = {
                        'user': user,
                        'flight': flight,
                        'total_price': flight.price * random.randint(1, 4),
                        'currency': flight.currency,
                        'status': random.choice(status_choices),
                        'payment_status': random.choice(payment_status_choices),
                        'booking_date': booking_date
                    }
                else:
                    continue  # Skip if no entities of the chosen type exist
                
                booking = Booking.objects.create(**booking_data)
                bookings.append(booking)
                self.stdout.write(self.style.SUCCESS(f'Created booking #{booking.id} for {user.email} ({booking_type})'))
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating booking: {str(e)}'))
                continue    

        return bookings    

    def create_discounts(self, places, experiences, flights):
        discounts = []
        
        # First delete existing discounts to avoid duplicate codes
        Discount.objects.all().delete()
        
        for i in range(10):  # Create 10 discounts
            try:
                discount_type = random.choice(["Percentage", "Fixed"])
                amount = round(random.uniform(5, 25), 2) if discount_type == "Percentage" else round(random.uniform(10, 100), 2)
                
                valid_from = timezone.now()
                valid_to = valid_from + timedelta(days=random.randint(7, 60))
                
                discount = Discount.objects.create(
                    code=f"DISCOUNT{i+1}",
                    discount_type=discount_type,
                    amount=amount,
                    valid_from=valid_from,
                    valid_to=valid_to,
                    is_active=random.choices([True, False], weights=[80, 20])[0]
                )
                
                # Apply to random entities
                if places:
                    discount.applicable_places.set(random.sample(places, min(3, len(places))))
                if experiences:
                    discount.applicable_experiences.set(random.sample(experiences, min(2, len(experiences))))
                if flights:
                    discount.applicable_flights.set(random.sample(flights, min(2, len(flights))))
                
                discounts.append(discount)
                self.stdout.write(self.style.SUCCESS(f'Created discount: {discount.code}'))
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating discount: {str(e)}'))
                continue
                
        return discounts

    def create_reviews(self, users, places, experiences, flights):
        reviews = []
        
        # Create reviews for places
        if places:
            for place in random.sample(places, min(15, len(places))):
                for _ in range(random.randint(1, 3)):
                    try:
                        review = Review.objects.create(
                            user=random.choice(users),
                            place=place,
                            rating=random.randint(1, 5),
                            review_text='\n'.join(fake.paragraphs(nb=2)))
                        reviews.append(review)
                        self.stdout.write(self.style.SUCCESS(f'Created review for place: {place.name}'))
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Error creating place review: {str(e)}'))
                        continue
                    
        # Create reviews for experiences
        if experiences:
            for experience in random.sample(experiences, min(10, len(experiences))):
                for _ in range(random.randint(1, 3)):
                    try:
                        review = Review.objects.create(
                            user=random.choice(users),
                            experience=experience,
                            rating=random.randint(1, 5),
                            review_text='\n'.join(fake.paragraphs(nb=2)))
                        reviews.append(review)
                        self.stdout.write(self.style.SUCCESS(f'Created review for experience: {experience.title}'))
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Error creating experience review: {str(e)}'))
                        continue    

        return reviews

    def create_payments(self, users, bookings):
        payments = []
        methods = ["Credit Card", "PayPal", "Bank Transfer", "Crypto"]
        statuses = ["Pending", "Completed", "Failed", "Refunded"]
        
        for booking in bookings:
            try:
                payment = Payment.objects.create(
                    user=booking.user,
                    booking=booking,
                    amount=booking.total_price,
                    currency=booking.currency,
                    payment_method=random.choice(methods),
                    payment_status=random.choice(statuses),
                    transaction_id=fake.uuid4()
                )
                payments.append(payment)
                self.stdout.write(self.style.SUCCESS(f'Created payment #{payment.id} for booking #{booking.id}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating payment: {str(e)}'))
                continue
                
        return payments

    def create_messages(self, users, bookings):
        messages = []
        
        # Create messages between random users
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
                self.stdout.write(self.style.SUCCESS(f'Created message from {sender.email} to {receiver.email}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating message: {str(e)}'))
                continue
                
        # Create messages related to bookings
        if bookings:
            for booking in random.sample(bookings, min(10, len(bookings))):
                try:
                    sender = booking.user
                    receiver = random.choice([u for u in users if u != sender and u.role in ["owner", "organization"]])
                    
                    message = Message.objects.create(
                        sender=sender,
                        receiver=receiver,
                        booking=booking,
                        message_text=fake.paragraph(),
                        is_read=random.choice([True, False])
                    )
                    messages.append(message)
                    self.stdout.write(self.style.SUCCESS(f'Created booking message for booking #{booking.id}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Error creating booking message: {str(e)}'))
                    continue
                
        return messages