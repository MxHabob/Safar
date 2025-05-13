
import uuid
from django.db import models
from django.utils import timezone
from django.contrib.gis.db import models as gis_models
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from apps.core_apps.general import BaseModel
from apps.core_apps.models import Media
from apps.authentication.models import User
from apps.geographic_data.models import Country, Region, City,Media

# Categories such as hotels - apartments - chalets - Care places - kindergarten - restaurants - religious centers - mosques - villas - houses, etc.
class Category(BaseModel):
    name = models.CharField(max_length=255, unique=True, verbose_name="Category Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


# Discount on reservations for places, boxes, experiences, flights, etc., provided that the discount is used once.
class Discount(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount_type = models.CharField(max_length=20, choices=[("Percentage", "Percentage"), ("Fixed", "Fixed")])
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    applicable_places = models.ManyToManyField('Place', blank=True, related_name='discounts')
    applicable_experiences = models.ManyToManyField('Experience', blank=True, related_name='discounts')
    applicable_flights = models.ManyToManyField('Flight', blank=True, related_name='discounts')
    applicable_boxes = models.ManyToManyField('Box', blank=True, related_name='discounts')
    
    target_users = models.ManyToManyField(User, blank=True, related_name='targeted_discounts')
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    uses_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_discounts')
    metadata = models.JSONField(default=dict, blank=True)
    
    def is_valid(self):
        """Check if discount is valid (active and within date range)"""
        now = timezone.now()
        return (
            self.is_active and 
            self.valid_from <= now <= self.valid_to and
            (self.max_uses is None or self.uses_count < self.max_uses)
        )
    
    def is_applicable_to_entity(self, entity):
        """Check if discount applies to a specific entity"""
        if isinstance(entity, Place):
            return self.applicable_places.filter(id=entity.id).exists()
        elif isinstance(entity, Experience):
            return self.applicable_experiences.filter(id=entity.id).exists()
        elif isinstance(entity, Flight):
            return self.applicable_flights.filter(id=entity.id).exists()
        elif isinstance(entity, Box):
            return self.applicable_boxes.filter(id=entity.id).exists()
        return False
    
    def is_applicable_to_user(self, user):
        """Check if discount is applicable to a specific user"""
        if not self.target_users.exists():
            return True
        return self.target_users.filter(id=user.id).exists()
    
    def calculate_discount_amount(self, original_price):
        """Calculate the discount amount based on original price"""
        if self.discount_type == "Percentage":
            discount_amount = original_price * (self.amount / 100)
        else:
            discount_amount = self.amount
        
        if self.max_discount_amount and discount_amount > self.max_discount_amount:
            discount_amount = self.max_discount_amount
            
        return discount_amount
    
    def apply_discount(self, original_price):
        """Apply discount to original price"""
        discount_amount = self.calculate_discount_amount(original_price)
        return original_price - discount_amount
    
    def increment_usage(self):
        """Increment the usage count"""
        self.uses_count += 1
        self.save(update_fields=['uses_count'])
    
    def __str__(self):
        return f"{self.code} - {self.amount}{'%' if self.discount_type == 'Percentage' else ''}"

# Place such as hotels - villas - apartments - museums - restaurants - museums - churches etc.
class Place(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="places", verbose_name="Category")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_places", verbose_name="Owner")
    name = models.CharField(max_length=255, verbose_name="Place Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    location = gis_models.PointField(geography=True, verbose_name="Geolocation")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Country")
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="City")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Region")
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)], verbose_name="Rating", db_index=True)
    media = models.ManyToManyField(Media, blank=True, related_name="places", verbose_name="Media")
    is_available = models.BooleanField(default=True, verbose_name="Is Available", db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Place"
        verbose_name_plural = "Places"
        indexes = [
            models.Index(fields=["name", "rating"]),
            gis_models.Index(fields=['location']),
        ]

# Experience like motorcycling - skiing - walking around the monuments etc.
class Experience(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="experience", verbose_name="Category")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="experiences", verbose_name="Place")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_experiences", verbose_name="Owner")
    title = models.CharField(max_length=255, verbose_name="Title", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    location = gis_models.PointField(geography=True,blank=True, null=True, verbose_name="Geolocation")
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price Per Person", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    duration = models.PositiveIntegerField(verbose_name="Duration (minutes)")
    capacity = models.PositiveIntegerField(verbose_name="Capacity")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Country")
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="City")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Region")
    schedule = models.JSONField(default=list, blank=True, null=True, verbose_name="Schedule")
    media = models.ManyToManyField(Media, blank=True, related_name="experiences", verbose_name="Media")
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        verbose_name="Rating",
        db_index=True,
    )
    is_available = models.BooleanField(default=True, verbose_name="Is Available", db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Experience"
        verbose_name_plural = "Experiences"
        indexes = [
            models.Index(fields=["title", "rating"]),
            gis_models.Index(fields=['location']),
        ]

# Flight reservations and basic data storage
class Flight(BaseModel):
    airline = models.CharField(max_length=255, verbose_name="Airline", db_index=True)
    flight_number = models.CharField(max_length=50, unique=True, verbose_name="Flight Number", db_index=True)
    departure_airport = models.CharField(max_length=3, verbose_name="Departure Airport", db_index=True)
    arrival_airport = models.CharField(max_length=3, verbose_name="Arrival Airport", db_index=True)
    airline_url = models.URLField(blank=True, null=True,verbose_name="Airline URL")
    arrival_city = models.CharField(max_length=255, verbose_name="Arrival City", db_index=True)
    departure_time = models.DateTimeField(verbose_name="Departure Time", db_index=True)
    arrival_time = models.DateTimeField(verbose_name="Arrival Time", db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    duration = models.PositiveIntegerField(verbose_name="Duration (minutes)")
    baggage_policy = models.JSONField(default=dict, verbose_name="Baggage Policy")

    def __str__(self):
        return f"{self.airline} {self.flight_number}"

    class Meta:
        verbose_name = "Flight"
        verbose_name_plural = "Flights"
        indexes = [
            models.Index(fields=["departure_airport", "arrival_airport"]),
            models.Index(fields=["departure_time", "arrival_time"]),
        ]

class Box(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="box", verbose_name="Category")
    name = models.CharField(max_length=255, verbose_name="Box Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    total_price = models.DecimalField(max_digits=10, blank=True, null=True, decimal_places=2, verbose_name="Total Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Country")
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="City")
    media = models.ManyToManyField(Media, blank=True, related_name="boxes", verbose_name="Media")
    duration_days = models.PositiveIntegerField(default=1, verbose_name="Duration in Days")
    duration_hours = models.PositiveIntegerField(default=0, verbose_name="Duration in Hours")
    metadata = models.JSONField(default=dict, blank=True)
    start_date = models.DateField(null=True, blank=True, verbose_name="Start Date")
    end_date = models.DateField(null=True, blank=True, verbose_name="End Date")
    is_customizable = models.BooleanField(default=False, verbose_name="Is Customizable")
    max_group_size = models.PositiveIntegerField(default=10, verbose_name="Maximum Group Size")
    tags = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Box"
        verbose_name_plural = "Boxes"

class BoxItineraryDay(BaseModel):
    """
    Represents a single day in a box itinerary
    """
    box = models.ForeignKey(Box, on_delete=models.CASCADE, related_name="itinerary_days", verbose_name="Box")
    day_number = models.PositiveIntegerField(verbose_name="Day Number")
    date = models.DateField(null=True, blank=True, verbose_name="Specific Date")
    description = models.TextField(blank=True, null=True, verbose_name="Day Description")
    estimated_hours = models.FloatField(default=8, verbose_name="Estimated Hours")
    class Meta:
        verbose_name = "Box Itinerary Day"
        verbose_name_plural = "Box Itinerary Days"
        ordering = ['day_number']
        unique_together = ('box', 'day_number')

class BoxItineraryItem(BaseModel):
    """
    Represents an item (place or experience) in a box itinerary day
    """
    itinerary_day = models.ForeignKey(BoxItineraryDay, on_delete=models.CASCADE, related_name="items", verbose_name="Itinerary Day")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Experience")
    start_time = models.TimeField(verbose_name="Start Time")
    end_time = models.TimeField(verbose_name="End Time")
    duration_minutes = models.PositiveIntegerField(verbose_name="Duration in Minutes")
    order = models.PositiveIntegerField(verbose_name="Order in Day")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    is_optional = models.BooleanField(default=False, verbose_name="Is Optional")
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Estimated Cost")
    
    class Meta:
        verbose_name = "Box Itinerary Item"
        verbose_name_plural = "Box Itinerary Items"
        ordering = ['order']
        
# Booking: Reserving an entire box, flight, place, or experience.
class Booking(BaseModel):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Confirmed", "Confirmed"),
        ("Cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings", verbose_name="User", db_index=True)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings", verbose_name="Experience")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings", verbose_name="Flight")
    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings", verbose_name="Box")
    check_in = models.DateField(null=True, blank=True, verbose_name="Check-In Date", db_index=True)
    check_out = models.DateField(null=True, blank=True, verbose_name="Check-Out Date", db_index=True)
    booking_date = models.DateTimeField(auto_now_add=True, verbose_name="Booking Date", db_index=True)
    group_size = models.PositiveIntegerField(default=1)
    discount = models.ForeignKey( Discount, on_delete=models.SET_NULL, null=True, blank=True,verbose_name="Applied Discount")
    original_price = models.DecimalField( max_digits=10, null=True,blank=True, decimal_places=5,verbose_name="Original Price")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending", verbose_name="Status", db_index=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=5, verbose_name="Total Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    payment_status = models.CharField(max_length=20, default="Pending", verbose_name="Payment Status", db_index=True)

    def __str__(self):
        return f"Booking #{self.id} by {self.user}"

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["check_in", "check_out"]),
        ]


class Wishlist(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlists", verbose_name="User", db_index=True)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlists", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlists", verbose_name="Experience")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlists", verbose_name="Flight")
    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlists", verbose_name="Box")

    def __str__(self):
        return f"Wishlist for {self.user}"

    class Meta:
        verbose_name = "Wishlist"
        verbose_name_plural = "Wishlists"


class Review(BaseModel):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews", verbose_name="User", db_index=True)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Experience")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Flight")
    rating = models.PositiveIntegerField(choices=RATING_CHOICES, verbose_name="Rating", db_index=True)
    review_text = models.TextField(verbose_name="Review Text")


    def __str__(self):
        return f"Review by {self.user}"

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        indexes = [
            models.Index(fields=["user", "rating"]),
        ]


class Payment(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments", verbose_name="User", db_index=True)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments", verbose_name="Booking")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Amount", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    payment_method = models.CharField(max_length=50, verbose_name="Payment Method")
    payment_status = models.CharField(max_length=20, default="Pending", verbose_name="Payment Status", db_index=True)
    transaction_id = models.CharField(max_length=255, unique=True, verbose_name="Transaction ID", db_index=True)

    def __str__(self):
        return f"Payment #{self.id} for {self.booking}"

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"


class Message(BaseModel):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages", verbose_name="Sender", db_index=True)
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages", verbose_name="Receiver", db_index=True)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages", verbose_name="Booking")
    message_text = models.TextField(verbose_name="Message Text")
    is_read = models.BooleanField(default=False, verbose_name="Is Read", db_index=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver}"

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        indexes = [
            models.Index(fields=["sender", "receiver"]),
        ]



class SmsLog(models.Model):
    """
    Log of SMS messages sent through the system
    """
    to_number = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed')
    ])
    provider = models.CharField(max_length=20, default='twilio')
    provider_message_id = models.CharField(max_length=100, null=True, blank=True)
    error_message = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "SMS Log"
        verbose_name_plural = "SMS Logs"
        ordering = ['-created_at']
        
    def __str__(self):
        return f"SMS to {self.to_number} ({self.status})"

class PushNotificationLog(models.Model):
    """
    Log of push notifications sent through the system
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    data = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed')
    ])
    provider = models.CharField(max_length=20, default='firebase')
    provider_message_id = models.CharField(max_length=100, null=True, blank=True)
    error_message = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Push Notification Log"
        verbose_name_plural = "Push Notification Logs"
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Push to {self.user.email} ({self.status})"

class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ("Booking Update", "Booking Update"),
        ("Payment", "Payment"),
        ("New Box", "New Box"),
        ("Personalized Box", "Personalized Box"),
        ("Discount", "Discount"),
        ("Points", "Points Deducted"),
        ("Message", "Message"),
        ("General", "General"),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", verbose_name="User", db_index=True)
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="General", verbose_name="Type", db_index=True)
    message = models.TextField(verbose_name="Message")
    metadata = models.JSONField(default=dict, blank=True)
    status = models.CharField( max_length=20,choices=STATUS_CHOICES,default='pending', db_index=True)
    channels = models.JSONField(default=list,null=True, blank=True ,help_text="List of channels used to send this notification")
    processing_started = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False, verbose_name="Is Read", db_index=True)

    def __str__(self):
        return f"Notification for {self.user} - {self.type}"

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"