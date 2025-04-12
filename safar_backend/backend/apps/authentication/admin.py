from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User, UserProfile, UserInteraction, UserLoginLog, PointsTransaction, InteractionType

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'membership_level', 'points', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('role', 'membership_level', 'is_active')
    ordering = ('-created_at',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'country', 'city')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    raw_id_fields = ('user',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'country', 'region', 'city'
        )
    def location_display(self, obj):
        if obj.location:
            return f"Point ({obj.location.x:.4f}, {obj.location.y:.4f})"
        return "-"
    location_display.short_description = "Location"

@admin.register(UserInteraction)
class UserInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'interaction_type', 'content_type', 'object_id', 'created_at')
    list_filter = ('interaction_type', 'created_at')
    search_fields = ('user__email', 'interaction_type')
    date_hierarchy = 'created_at'
    raw_id_fields = ('user',)

@admin.register(UserLoginLog)
class UserLoginLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'device_type', 'login_status', 'country', 'city', 'created_at')
    list_filter = ('login_status', 'device_type', 'created_at', 'country')
    search_fields = ('user__email', 'ip_address', 'country', 'city')
    date_hierarchy = 'created_at'
    raw_id_fields = ('user',)

@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'points', 'balance_after', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'action')
    date_hierarchy = 'created_at'
    raw_id_fields = ('user', 'interaction')

@admin.register(InteractionType)
class InteractionTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'points_value', 'daily_limit', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('code', 'name', 'description')
    ordering = ('category', 'name')
