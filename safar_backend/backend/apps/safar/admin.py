from django.contrib import admin
from apps.safar.models import (
    Category, Discount, Place, Experience,
    Flight, Box, Booking, Wishlist, Review, Payment, Message, Notification
)

admin.site.register(Category)
admin.site.register(Discount)
admin.site.register(Place)
admin.site.register(Experience)
admin.site.register(Flight)
admin.site.register(Box)
admin.site.register(Booking)
admin.site.register(Wishlist)
admin.site.register(Review)
admin.site.register(Payment)
admin.site.register(Message)
admin.site.register(Notification)