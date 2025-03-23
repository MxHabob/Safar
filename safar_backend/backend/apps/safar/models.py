import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core_apps.general import BaseModel
from apps.authentication.models import User
from cities_light.models import City, Region, Country


class Category(BaseModel):
    name = models.CharField(max_length=255, unique=True, verbose_name="Category Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


class Image(BaseModel):
    entity_id = models.UUIDField(verbose_name="Entity ID", db_index=True)
    entity_type = models.CharField(max_length=50, verbose_name="Entity Type", db_index=True)
    url = models.URLField(verbose_name="Image URL")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_images", verbose_name="Uploaded By")

    def __str__(self):
        return f"Image for {self.entity_type} - {self.entity_id}"

    class Meta:
        verbose_name = "Image"
        verbose_name_plural = "Images"
        indexes = [
            models.Index(fields=["entity_id", "entity_type"]),  # Composite index for entity queries
        ]


class Discount(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, verbose_name="Discount Code", db_index=True)
    discount_type = models.CharField(
        max_length=10,
        choices=[("Percentage", "Percentage"), ("Fixed", "Fixed")],
        default="Percentage",
        verbose_name="Discount Type",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Discount Amount")
    valid_from = models.DateTimeField(verbose_name="Valid From", db_index=True)
    valid_to = models.DateTimeField(verbose_name="Valid To", db_index=True)
    is_active = models.BooleanField(default=True, verbose_name="Is Active", db_index=True)
    applicable_places = models.ManyToManyField("Place", blank=True, related_name="applicable_discounts", verbose_name="Applicable Places")
    applicable_experiences = models.ManyToManyField("Experience", blank=True, related_name="applicable_discounts", verbose_name="Applicable Experiences")
    applicable_flights = models.ManyToManyField("Flight", blank=True, related_name="applicable_discounts", verbose_name="Applicable Flights")
    applicable_boxes = models.ManyToManyField("Box", blank=True, related_name="applicable_discounts", verbose_name="Applicable Boxes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At", db_index=True)

    def __str__(self):
        return f"{self.code} - {self.amount} ({self.discount_type})"

    class Meta:
        verbose_name = "Discount"
        verbose_name_plural = "Discounts"


class Place(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="places", verbose_name="Category")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_places", verbose_name="Owner")
    name = models.CharField(max_length=255, verbose_name="Place Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    location = models.CharField(max_length=255, verbose_name="Location")
    latitude = models.FloatField(verbose_name="Latitude", db_index=True)
    longitude = models.FloatField(verbose_name="Longitude", db_index=True)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Country")
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="City")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Region")
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        verbose_name="Rating",
        db_index=True,
    )
    images = models.JSONField(default=list, verbose_name="Images")
    is_available = models.BooleanField(default=True, verbose_name="Is Available", db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    metadata = models.JSONField(default=dict, verbose_name="Metadata")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Place"
        verbose_name_plural = "Places"
        indexes = [
            models.Index(fields=["latitude", "longitude"]),  # Composite index for location-based queries
            models.Index(fields=["name", "rating"]),  # Composite index for search and ranking
        ]


class Experience(BaseModel):
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="experiences", verbose_name="Place")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_experiences", verbose_name="Owner")
    title = models.CharField(max_length=255, verbose_name="Title", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    location = models.CharField(max_length=255, verbose_name="Location")
    latitude = models.FloatField(blank=True, null=True, verbose_name="Latitude", db_index=True)
    longitude = models.FloatField(blank=True, null=True, verbose_name="Longitude", db_index=True)
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price Per Person", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    duration = models.PositiveIntegerField(verbose_name="Duration (minutes)")
    capacity = models.PositiveIntegerField(verbose_name="Capacity")
    schedule = models.JSONField(default=list, verbose_name="Schedule")
    images = models.JSONField(default=list, verbose_name="Images")
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        verbose_name="Rating",
        db_index=True,
    )
    is_available = models.BooleanField(default=True, verbose_name="Is Available", db_index=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Experience"
        verbose_name_plural = "Experiences"
        indexes = [
            models.Index(fields=["title", "rating"]),  # Composite index for search and ranking
            models.Index(fields=["latitude", "longitude"]),  # Composite index for location-based queries
        ]


class Flight(BaseModel):
    airline = models.CharField(max_length=255, verbose_name="Airline", db_index=True)
    flight_number = models.CharField(max_length=50, unique=True, verbose_name="Flight Number", db_index=True)
    departure_airport = models.CharField(max_length=3, verbose_name="Departure Airport", db_index=True)
    arrival_airport = models.CharField(max_length=3, verbose_name="Arrival Airport", db_index=True)
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
            models.Index(fields=["departure_airport", "arrival_airport"]),  # Composite index for route queries
            models.Index(fields=["departure_time", "arrival_time"]),  # Composite index for time-based queries
        ]


class Box(BaseModel):
    name = models.CharField(max_length=255, verbose_name="Box Name", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="boxes", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="boxes", verbose_name="Experience")
    contents = models.JSONField(default=list, verbose_name="Contents")
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Discount")
    images = models.JSONField(default=list, verbose_name="Images")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Box"
        verbose_name_plural = "Boxes"


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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending", verbose_name="Status", db_index=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Price", db_index=True)
    currency = models.CharField(max_length=10, default="USD", verbose_name="Currency")
    payment_status = models.CharField(max_length=20, default="Pending", verbose_name="Payment Status", db_index=True)

    def __str__(self):
        return f"Booking #{self.id} by {self.user}"

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        indexes = [
            models.Index(fields=["user", "status"]),  # Composite index for user-specific queries
            models.Index(fields=["check_in", "check_out"]),  # Composite index for date range queries
        ]


class Wishlist(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlists", verbose_name="User", db_index=True)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_by", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_by", verbose_name="Experience")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_by", verbose_name="Flight")
    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="wishlisted_by", verbose_name="Box")

    def __str__(self):
        return f"Wishlist for {self.user}"

    class Meta:
        verbose_name = "Wishlist"
        verbose_name_plural = "Wishlists"


class Review(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews", verbose_name="User", db_index=True)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Place")
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Experience")
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews", verbose_name="Flight")
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Rating",
        db_index=True,
    )
    review_text = models.TextField(verbose_name="Review Text")

    def __str__(self):
        return f"Review by {self.user}"

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        indexes = [
            models.Index(fields=["user", "rating"]),  # Composite index for user-specific reviews
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
            models.Index(fields=["sender", "receiver"]),  # Composite index for message lookups
        ]


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ("Booking Update", "Booking Update"),
        ("Payment", "Payment"),
        ("Discount", "Discount"),
        ("Message", "Message"),
        ("General", "General"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", verbose_name="User", db_index=True)
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="General", verbose_name="Type", db_index=True)
    message = models.TextField(verbose_name="Message")
    is_read = models.BooleanField(default=False, verbose_name="Is Read", db_index=True)

    def __str__(self):
        return f"Notification for {self.user} - {self.type}"

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"