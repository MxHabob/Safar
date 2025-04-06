import random
from django.core.management.base import BaseCommand
from faker import Faker
from django.contrib.gis.geos import Point
from phonenumber_field.phonenumber import PhoneNumber
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models import User, UserProfile
from apps.geographic_data.models import Country, Region, City
from apps.safar.models import (
    Category, Image, Discount, Place, Experience, Flight, Box,
    Booking, Wishlist, Review, Payment, Message, Notification
)

fake = Faker()

class Command(BaseCommand):
    help = 'Generates fake data for all models in the application'

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
            '--boxes',
            type=int,
            default=5,
            help='Number of fake boxes to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to generate fake data...'))
        
        categories = self.create_categories()
        
        users = self.create_users(options['users'])
        
        images = self.create_images(users)
        
        places = self.create_places(options['places'], categories, users, images)
        
        experiences = self.create_experiences(options['experiences'], categories, users, images, places)
        
        flights = self.create_flights(options['flights'])
        
        boxes = self.create_boxes(options['boxes'], categories, places, experiences, images)
        
        discounts = self.create_discounts(places, experiences, flights, boxes)

        bookings = self.create_bookings(users, places, experiences, flights, boxes)
        
        wishlists = self.create_wishlists(users, places, experiences, flights, boxes)

        reviews = self.create_reviews(users, places, experiences, flights)

        payments = self.create_payments(users, bookings)

        messages = self.create_messages(users, bookings)

        notifications = self.create_notifications(users)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated fake data:'
                                           f'\n- {len(users)} users'
                                           f'\n- {len(places)} places'
                                           f'\n- {len(experiences)} experiences'
                                           f'\n- {len(flights)} flights'
                                           f'\n- {len(boxes)} boxes'
                                           f'\n- {len(bookings)} bookings'
                                           f'\n- {len(wishlists)} wishlists'
                                           f'\n- {len(reviews)} reviews'
                                           f'\n- {len(payments)} payments'
                                           f'\n- {len(messages)} messages'
                                           f'\n- {len(notifications)} notifications'))

    def create_categories(self):
        categories = [
            "Hotel", "Apartment", "Villa", "Restaurant", "Museum",
            "Adventure", "Cultural", "Relaxation", "Flight", "Package"
        ]
        
        created = []
        for name in categories:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={'description': f"All about {name}"}
            )
            created.append(cat)
        return created

    def create_users(self, count):
        users = []
        for i in range(count):
            try:
                email = fake.unique.email()
                user_data = {
                    'email': email,
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'is_active': True,
                    'role': random.choice(["guest", "owner", "organization", "developer"])
                }
                
                # Create or get existing user
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults=user_data
                )
                
                if created:
                    user.set_password('password123')
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'Created user {email}'))
                else:
                    self.stdout.write(self.style.NOTICE(f'User {email} already exists'))
                
                # Create profile if it doesn't exist
                city = City.objects.order_by('?').first()
                profile_data = {
                    'bio': fake.text(),
                    'location': Point(float(fake.longitude()), float(fake.latitude())),
                    'country': city.country if city else None,
                    'region': city.region if city else None,
                    'city': city,
                    'postal_code': fake.postcode(),
                    'date_of_birth': fake.date_of_birth(minimum_age=18, maximum_age=90),
                    'address': fake.address(),
                    'privacy_consent': True,
                    'consent_date': timezone.now(),
                    'gender': random.choice(["male", "female", "prefer_not_to_say"])
                }
                
                try:
                    profile_data['phone_number'] = PhoneNumber.from_string(fake.phone_number(), region='US')
                    UserProfile.objects.update_or_create(
                        user=user,
                        defaults=profile_data
                    )
                    self.stdout.write(self.style.SUCCESS(f'Created profile for {email}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Skipped profile for {email}: {str(e)}'))
                
                users.append(user)
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to create user {i+1}/{count}: {str(e)}'))
                continue
                
        return users    

    def create_images(self, users):
        images = []
        if not users:
            self.stdout.write(self.style.WARNING('No users available for image creation'))
            return images
        
        for _ in range(50):  # Create 50 random images
            try:
                img = Image.objects.create(
                    url=fake.image_url(),
                    uploaded_by=random.choice(users)
                )
                images.append(img)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Failed to create image: {str(e)}'))
                continue
                
        return images

    def create_places(self, count, categories, users, images):
        places = []
        cities = list(City.objects.all())
        for _ in range(count):
            place = Place.objects.create(
                category=random.choice(categories),
                owner=random.choice(users),
                name=fake.company(),
                description=fake.text(),
                location=Point(float(fake.longitude()), float(fake.latitude())),
                country=random.choice(cities).country if cities else None,
                city=random.choice(cities) if cities else None,
                region=random.choice(cities).region if cities else None,
                rating=round(random.uniform(3.0, 5.0), 1),
                is_available=random.choice([True, False]),
                price=round(random.uniform(50, 500), 2),
                currency=random.choice(["USD", "EUR", "GBP", "JPY"])
            )
            
            place.images.set(random.sample(images, min(3, len(images))))
            places.append(place)
        return places

    def create_experiences(self, count, categories, users, images, places):
        experiences = []
        cities = list(City.objects.all())
        for _ in range(count):
            exp = Experience.objects.create(
                category=random.choice([c for c in categories if c.name in ["Adventure", "Cultural", "Relaxation"]]),
                place=random.choice(places) if random.choice([True, False]) else None,
                owner=random.choice(users),
                title=fake.catch_phrase(),
                description=fake.text(),
                location=Point(float(fake.longitude()), float(fake.latitude())),
                price_per_person=round(random.uniform(20, 200), 2),
                currency=random.choice(["USD", "EUR", "GBP", "JPY"]),
                duration=random.randint(60, 360),
                capacity=random.randint(1, 20),
                schedule={"days": random.sample(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], random.randint(1, 7))},
                rating=round(random.uniform(3.0, 5.0), 1),
                is_available=random.choice([True, False])
            )
            
            exp.images.set(random.sample(images, min(3, len(images))))
            experiences.append(exp)
        return experiences

    def create_flights(self, count):
        flights = []
        airports = ["JFK", "LAX", "LHR", "CDG", "FRA", "DXB", "HND", "SYD"]
        for _ in range(count):
            departure = random.choice(airports)
            arrival = random.choice([a for a in airports if a != departure])
            departure_time = timezone.now() + timedelta(days=random.randint(1, 30))
            flights.append(Flight.objects.create(
                airline=fake.company(),
                flight_number=fake.unique.bothify(text='??###'),
                departure_airport=departure,
                arrival_airport=arrival,
                airline_url=fake.url(),
                arrival_city=fake.city(),
                departure_time=departure_time,
                arrival_time=departure_time + timedelta(hours=random.randint(1, 12)),
                price=round(random.uniform(100, 2000), 2),
                currency=random.choice(["USD", "EUR", "GBP", "JPY"]),
                duration=random.randint(60, 720),
                baggage_policy={"checked": random.randint(0, 2), "carry_on": 1}
            ))
        return flights

    def create_boxes(self, count, categories, places, experiences, images):
        boxes = []
        for _ in range(count):
            box = Box.objects.create(
                category=random.choice([c for c in categories if c.name in ["Package"]]),
                name=fake.catch_phrase(),
                description=fake.text(),
                total_price=round(random.uniform(500, 5000), 2),
                currency=random.choice(["USD", "EUR", "GBP", "JPY"]),
                country=random.choice(Country.objects.all()),
                city=random.choice(City.objects.all())
            )
            
            box.place.set(random.sample(places, min(3, len(places))))
            box.experience.set(random.sample(experiences, min(2, len(experiences))))
            box.images.set(random.sample(images, min(3, len(images))))
            boxes.append(box)
        return boxes

    def create_discounts(self, places, experiences, flights, boxes):
        discounts = []
        for _ in range(10):  # Create 10 discounts
            # First determine discount type and amount
            discount_type = random.choice(["Percentage", "Fixed"])
            if discount_type == "Percentage":
                amount = round(random.uniform(5, 25), 2)
            else:
                amount = round(random.uniform(10, 100), 2)
            
            # Then create the discount
            discount = Discount.objects.create(
                discount_type=discount_type,
                amount=amount,
                valid_from=timezone.now(),
                valid_to=timezone.now() + timedelta(days=random.randint(7, 30)),
                is_active=random.choice([True, False])
            )
            
            # Apply discounts to random items
            if places:
                discount.applicable_places.set(random.sample(places, min(3, len(places))))
            if experiences:
                discount.applicable_experiences.set(random.sample(experiences, min(2, len(experiences))))
            if flights:
                discount.applicable_flights.set(random.sample(flights, min(2, len(flights))))
            if boxes:
                discount.applicable_boxes.set(random.sample(boxes, min(1, len(boxes))))
            
            discounts.append(discount)
        return discounts

    def create_bookings(self, users, places, experiences, flights, boxes):
        bookings = []
        for _ in range(30):
            check_in = timezone.now() + timedelta(days=random.randint(1, 60))
            booking = Booking.objects.create(
                user=random.choice(users),
                place=random.choice(places) if random.choice([True, False]) else None,
                experience=random.choice(experiences) if random.choice([True, False]) else None,
                flight=random.choice(flights) if random.choice([True, False]) else None,
                box=random.choice(boxes) if random.choice([True, False]) else None,
                check_in=check_in,
                check_out=check_in + timedelta(days=random.randint(1, 14)) if check_in else None,
                status=random.choice(["Pending", "Confirmed", "Cancelled"]),
                total_price=round(random.uniform(100, 5000), 2),
                currency=random.choice(["USD", "EUR", "GBP", "JPY"]),
                payment_status=random.choice(["Pending", "Completed", "Failed"])
            )
            bookings.append(booking)
        return bookings

    def create_wishlists(self, users, places, experiences, flights, boxes):
        wishlists = []
        for user in random.sample(users, min(20, len(users))):
            wishlist = Wishlist.objects.create(
                user=user,
                place=random.choice(places) if random.choice([True, False]) else None,
                experience=random.choice(experiences) if random.choice([True, False]) else None,
                flight=random.choice(flights) if random.choice([True, False]) else None,
                box=random.choice(boxes) if random.choice([True, False]) else None
            )
            wishlists.append(wishlist)
        return wishlists

    def create_reviews(self, users, places, experiences, flights):
        reviews = []
        for _ in range(50):
            review = Review.objects.create(
                user=random.choice(users),
                place=random.choice(places) if random.choice([True, False]) else None,
                experience=random.choice(experiences) if random.choice([True, False]) else None,
                flight=random.choice(flights) if random.choice([True, False]) else None,
                rating=random.randint(1, 5),
                review_text=fake.text()
            )
            reviews.append(review)
        return reviews

    def create_payments(self, users, bookings):
        payments = []
        for booking in bookings:
            payment = Payment.objects.create(
                user=booking.user,
                booking=booking,
                amount=booking.total_price,
                currency=booking.currency,
                payment_method=random.choice(["Credit Card", "PayPal", "Bank Transfer"]),
                payment_status=random.choice(["Pending", "Completed", "Failed"]),
                transaction_id=fake.uuid4()
            )
            payments.append(payment)
        return payments

    def create_messages(self, users, bookings):
        messages = []
        for _ in range(40):
            sender = random.choice(users)
            receiver = random.choice([u for u in users if u != sender])
            messages.append(Message.objects.create(
                sender=sender,
                receiver=receiver,
                booking=random.choice(bookings) if random.choice([True, False]) else None,
                message_text=fake.text(),
                is_read=random.choice([True, False])
            ))
        return messages

    def create_notifications(self, users):
        notifications = []
        for user in random.sample(users, min(30, len(users))):
            notifications.append(Notification.objects.create(
                user=user,
                type=random.choice(["Booking Update", "Payment", "Discount", "Message", "General"]),
                message=fake.sentence(),
                is_read=random.choice([True, False])
            ))
        return notifications