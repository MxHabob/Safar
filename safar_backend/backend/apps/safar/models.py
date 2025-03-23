from django.db import models
from apps.core_apps.general import BaseModel
from apps.authentication.models import User
from cities_light.models import City, Region, Country


class Category(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Image(BaseModel):
    entity_id = models.UUIDField()
    entity_type = models.CharField(max_length=50)
    url = models.URLField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)


class Place(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="places")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="places")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2 default=0.0)
    currency = models.CharField(max_length=10, default="USD")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True)
    max_guests = models.PositiveIntegerField()
    bedrooms = models.PositiveIntegerField()
    bathrooms = models.PositiveIntegerField()
    amenities = models.JSONField(default=list)
    rating = models.FloatField(default=0.0)
    images = models.JSONField(default=list)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Experience(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="experiences")
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name="experiences")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    duration = models.PositiveIntegerField()
    capacity = models.PositiveIntegerField()
    schedule = models.JSONField(default=list)
    images = models.JSONField(default=list)
    rating = models.FloatField(default=0.0)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Flight(BaseModel):
    airline = models.CharField(max_length=255)
    flight_number = models.CharField(max_length=50, unique=True)
    departure_airport = models.CharField(max_length=3)
    arrival_airport = models.CharField(max_length=3)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    available_seats = models.PositiveIntegerField()
    duration = models.PositiveIntegerField()
    baggage_policy = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.airline} {self.flight_number}"


class Box(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    contents = models.JSONField(default=list)
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    images = models.JSONField(default=list)

    def __str__(self):
        return self.name


class Booking(BaseModel):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Confirmed", "Confirmed"),
        ("Cancelled", "Cancelled"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    check_in = models.DateField(null=True, blank=True)
    check_out = models.DateField(null=True, blank=True)
    booking_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    payment_status = models.CharField(max_length=20, default="Pending")


class Wishlist(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlist")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_places")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_experiences")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_flights")
    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_boxes")


class Review(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    rating = models.PositiveIntegerField()
    review_text = models.TextField()


class Payment(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, default="Pending")
    transaction_id = models.CharField(max_length=255, unique=True)


class Message(BaseModel):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages")
    message_text = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver}"


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ("Booking Update", "Booking Update"),
        ("Payment", "Payment"),
        ("Discount", "Discount"),
        ("Message", "Message"),
        ("General", "General"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="General")
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user} - {self.type}"

