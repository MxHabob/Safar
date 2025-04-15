from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from apps.safar.models import (
    Category, Media, Discount, Place, Experience, Flight, Box,
    BoxItineraryDay, BoxItineraryItem, Booking, Wishlist, Review,
    Payment, Message, SmsLog, PushNotificationLog, Notification
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at', 'updated_at')
    ordering = ('name',)

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('type', 'uploaded_by', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('file', 'url', 'uploaded_by__email')
    raw_id_fields = ('uploaded_by',)

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'amount', 'is_active', 'valid_from', 'valid_to')
    list_filter = ('discount_type', 'is_active', 'valid_from', 'valid_to')
    search_fields = ('code',)
    filter_horizontal = (
        'applicable_places', 'applicable_experiences', 
        'applicable_flights', 'applicable_boxes', 'target_users'
    )

class MediaInline(admin.TabularInline):
    model = Place.media.through
    extra = 1
    verbose_name = "Media"
    verbose_name_plural = "Media"

@admin.register(Place)
class PlaceAdmin(OSMGeoAdmin):
    list_display = ('name', 'category', 'owner', 'country', 'city', 'rating', 'price', 'is_available')
    list_filter = ('category', 'country', 'city', 'rating', 'is_available')
    search_fields = ('name', 'description', 'owner__email')
    raw_id_fields = ('owner', 'category', 'country', 'city', 'region')
    inlines = [MediaInline]
    default_lon = 0
    default_lat = 0
    default_zoom = 2

@admin.register(Experience)
class ExperienceAdmin(OSMGeoAdmin):
    list_display = ('title', 'category', 'owner', 'price_per_person', 'duration', 'rating', 'is_available')
    list_filter = ('category', 'rating', 'is_available')
    search_fields = ('title', 'description', 'owner__email')
    raw_id_fields = ('owner', 'category', 'place')
    filter_horizontal = ('media',)
    default_lon = 0
    default_lat = 0
    default_zoom = 2

@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ('airline', 'flight_number', 'departure_airport', 'arrival_airport', 'departure_time', 'arrival_time', 'price')
    list_filter = ('airline', 'departure_airport', 'arrival_airport')
    search_fields = ('flight_number', 'airline', 'departure_airport', 'arrival_airport')
    date_hierarchy = 'departure_time'

class BoxItineraryItemInline(admin.TabularInline):
    model = BoxItineraryItem
    extra = 1
    raw_id_fields = ('place', 'experience')

@admin.register(BoxItineraryDay)
class BoxItineraryDayAdmin(admin.ModelAdmin):
    list_display = ('box', 'day_number', 'date', 'estimated_hours')
    list_filter = ('box',)
    inlines = [BoxItineraryItemInline]
    ordering = ('box', 'day_number')

@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'total_price', 'duration_days', 'is_customizable')
    list_filter = ('category', 'is_customizable')
    search_fields = ('name', 'description')
    raw_id_fields = ('category', 'country', 'city')
    filter_horizontal = ('media',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'total_price', 'check_in', 'check_out', 'booking_date')
    list_filter = ('status', 'payment_status', 'check_in', 'check_out')
    search_fields = ('user__email', 'place__name', 'experience__title', 'box__name')
    raw_id_fields = ('user', 'place', 'experience', 'flight', 'box')
    date_hierarchy = 'booking_date'

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'experience', 'flight', 'box')
    search_fields = ('user__email', 'place__name', 'experience__title', 'box__name')
    raw_id_fields = ('user', 'place', 'experience', 'flight', 'box')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'rating', 'place', 'experience', 'flight')
    list_filter = ('rating',)
    search_fields = ('user__email', 'review_text', 'place__name', 'experience__title', 'flight__flight_number')
    raw_id_fields = ('user', 'place', 'experience', 'flight')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'booking', 'amount', 'payment_status', 'transaction_id')
    list_filter = ('payment_status', 'currency')
    search_fields = ('user__email', 'transaction_id', 'booking__id')
    raw_id_fields = ('user', 'booking')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__email', 'receiver__email', 'message_text')
    raw_id_fields = ('sender', 'receiver', 'booking')

@admin.register(SmsLog)
class SmsLogAdmin(admin.ModelAdmin):
    list_display = ('to_number', 'status', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('to_number', 'message', 'provider_message_id')
    readonly_fields = ('created_at',)

@admin.register(PushNotificationLog)
class PushNotificationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'status', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('user__email', 'title', 'message', 'provider_message_id')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'status', 'is_read', 'created_at')
    list_filter = ('type', 'status', 'is_read', 'created_at')
    search_fields = ('user__email', 'message')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')