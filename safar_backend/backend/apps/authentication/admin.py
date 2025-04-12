from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User, UserProfile, UserInteraction, UserLoginLog, PointsTransaction, InteractionType

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'membership_level', 'points', 'is_active', 'created_at')
    list_filter = ('role', 'membership_level', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Membership'), {'fields': ('role', 'membership_level', 'points')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    ordering = ('-created_at',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'country', 'city')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number', 'country', 'city')
    raw_id_fields = ('user',)

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
