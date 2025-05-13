import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db import models as gis_models
from django.core.validators import EmailValidator
from django.utils.translation import gettext_lazy as _
from apps.core_apps.general import BaseModel
from phonenumber_field.modelfields import PhoneNumberField
from apps.geographic_data.models import Country, Region, City
import logging

logger = logging.getLogger(__name__)

def upload_avatar(instance, filename):
    random_uuid = uuid.uuid4().hex
    path = f'avatar/{random_uuid}'
    extension = filename.split('.')[-1] if '.' in filename else 'jpg'
    return f'{path}.{extension}'


def validate_metadata(value):
    """Ensure metadata values are within size limits"""
    if isinstance(value, dict):
        for k, v in value.items():
            if isinstance(v, (int, float)) and v > 2147483647:
                raise ValidationError("Numeric values in metadata must be less than 2,147,483,647")
    return value

class UserManager(BaseUserManager):
    from apps.core_apps.utility import generate_unique_username
    def create_user(self, email, password=None, **extra_fields):
        try:
            if not email:
                raise ValueError(_("The Email field must be set"))
            
            email = self.normalize_email(email)
            username = self.generate_unique_username(email)
            extra_fields.setdefault("username", username)

            user = self.model(email=email, **extra_fields)
            user.set_password(password)
            user.save(using=self._db)
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}", exc_info=True)
            raise

    def create_superuser(self, email, password=None, **extra_fields):
        try:
            extra_fields.setdefault("is_staff", True)
            extra_fields.setdefault("is_superuser", True)
            extra_fields.setdefault("is_active", True)

            if not extra_fields.get("is_staff"):
                raise ValueError(_("Superuser must have is_staff=True."))
            if not extra_fields.get("is_superuser"):
                raise ValueError(_("Superuser must have is_superuser=True."))

            return self.create_user(email, password, **extra_fields)
        except Exception as e:
            logger.error(f"Error creating superuser: {str(e)}", exc_info=True)
            raise

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    class Role(models.TextChoices):
        GUEST = 'guest', _('Guest')
        OWNER = 'owner', _('Owner')
        ORGANIZATION = 'organization', _('Real Estate Organization')
        DEVELOPER = 'developer', _('Developer')
        ADMIN = 'admin', _('Administrator')

    class MembershipLevel(models.TextChoices):
        BRONZE = 'bronze', _('Bronze')
        SILVER = 'silver', _('Silver')
        GOLD = 'gold', _('Gold')
        PLATINUM = 'platinum', _('Platinum')

    email = models.EmailField(unique=True, max_length=255, validators=[EmailValidator()], verbose_name=_("Email Address"))
    username = models.CharField(max_length=30, blank=True, verbose_name=_("Username"))
    first_name = models.CharField(max_length=30, blank=True, verbose_name=_("First Name"))
    last_name = models.CharField(max_length=30, blank=True, verbose_name=_("Last Name"))
    language = models.CharField(max_length=10, default="en")
    timezone = models.CharField(max_length=50, default="UTC")
    preferred_language = models.CharField(max_length=10, default="en", verbose_name=_("Preferred Language"))
    preferred_currency = models.CharField(max_length=10, default="USD", verbose_name=_("Preferred Currency"))
    is_online = models.BooleanField(default=False, verbose_name=_("Online Status"))
    is_active = models.BooleanField(default=True, verbose_name=_("Active"))
    is_staff = models.BooleanField(default=False, verbose_name=_("Staff Status"))
    is_2fa_enabled = models.BooleanField(default=False, verbose_name=_("Two-Factor Authentication Enabled"))
    last_login_device = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("Last Login Device"))
    last_login_ip = models.GenericIPAddressField(blank=True, null=True, verbose_name=_("Last Login IP Address"))
    last_activity = models.DateTimeField(null=True, blank=True, verbose_name=_("Last Activity"))
    role = models.CharField(max_length=25, choices=Role.choices, default=Role.GUEST, verbose_name=_("User Role"))
    is_profile_public = models.BooleanField(default=False)
    following = models.ManyToManyField("self", symmetrical=False, related_name="followers", blank=True)
    points = models.PositiveIntegerField(default=0)
    membership_level = models.CharField(max_length=20, choices=MembershipLevel.choices, default=MembershipLevel.BRONZE, verbose_name=_("Membership Level"))

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['role']),
            models.Index(fields=['membership_level']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_login_ip']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                condition=models.Q(is_deleted=False),
                name='unique_active_email',
            ),
            models.CheckConstraint(
                check=models.Q(email__contains='@'),
                name='valid_email_format'
            )
        ]

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self):
        return self.first_name or self.email.split('@')[0]
    
    def follow(self, user_to_follow):
        """Follow another user"""
        if self != user_to_follow:
            self.following.add(user_to_follow)
            return True
        return False

    def unfollow(self, user_to_unfollow):
        """Unfollow another user"""
        self.following.remove(user_to_unfollow)
        return True

    def is_following(self, user):
        """Check if this user is following another user"""
        return self.following.filter(pk=user.pk).exists()

    def get_followers_count(self):
        """Get number of followers"""
        return self.followers.count()

    def get_following_count(self):
        """Get number of users being followed"""
        return self.following.count()
    
    def __str__(self):
        return self.get_full_name()

class UserProfile(BaseModel):
    class Gender(models.TextChoices):
        MALE = 'male', _('Male')
        FEMALE = 'female', _('Female')
        PREFER_NOT_TO_SAY = 'prefer_not_to_say', _('Prefer Not to Say')
        OTHER = 'other', _('Other')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to=upload_avatar, null=True, blank=True)
    bio = models.TextField(blank=True)
    phone_number = PhoneNumberField(blank=True, null=True, verbose_name=_("Phone Number"))
    location = gis_models.PointField(geography=True, null=True, blank=True, verbose_name="Geolocation")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True)
    postal_code = models.CharField(max_length=20, blank=True, verbose_name=_("Postal Code"))
    address = models.CharField(max_length=255, blank=True, verbose_name=_("Address"))
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.PREFER_NOT_TO_SAY, blank=True, verbose_name=_("Gender"))
    travel_history = models.JSONField(default=list, blank=True)
    travel_interests = models.JSONField(default=list, blank=True)
    language_proficiency = models.JSONField(default=dict, blank=True)
    preferred_countries = models.ManyToManyField(Country, blank=True, related_name="preferred_by_users")
    privacy_consent = models.BooleanField(default=False, verbose_name=_("Privacy Consent"))
    consent_date = models.DateTimeField(null=True, blank=True, verbose_name=_("Consent Date"))
    notification_push_token = models.CharField(max_length=255, null=True, blank=True)
    wants_push_notifications = models.BooleanField(default=True)
    wants_sms_notifications = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("User Profile")
        verbose_name_plural = _("User Profiles")
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['country', 'region', 'city']),
        ]

    def __str__(self):
        return f"Profile of {self.user.get_full_name()}"

class UserInteraction(BaseModel):
    INTERACTION_TYPES = (
        ('view_place', 'Viewed Place'),
        ('login', 'Login'),
        ('view_experience', 'Viewed Experience'),
        ('view_flight', 'Viewed Flight'),
        ('wishlist_add', 'Added to Wishlist'),
        ('wishlist_remove', 'Removed from Wishlist'),
        ('share', 'Shared Item'),
        ('photo_view', 'Viewed Photos'),
        ('map_view', 'Viewed Map'),
        ('search', 'Performed Search'),
        ('filter', 'Applied Filters'),
        ('details_expand', 'Expanded Details'),
        ('availability_check', 'Checked Availability'),
        ('booking_start', 'Started Booking'),
        ('booking_abandon', 'Abandoned Booking'),
        ('booking_complete', 'Completed Booking'),
        ('rating_given', 'Rated Item'),
        ('review_added', 'Added Review'),
        ('recommendation_show', 'Saw Recommendation'),
        ('recommendation_click', 'Clicked Recommendation'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions', db_index=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, limit_choices_to={'app_label__in': ['places', 'geographic_data']})
    object_id = models.PositiveBigIntegerField(db_index=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    interaction_type = models.CharField(max_length=50, choices=INTERACTION_TYPES, db_index=True)
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional context about the interaction (e.g., search query, filters)",validators=[validate_metadata])
    device_type = models.CharField(max_length=20, blank=True, null=True, choices=(('mobile', 'Mobile'), ('desktop', 'Desktop'), ('tablet', 'Tablet'),))

    class Meta:
        verbose_name = 'User Interaction'
        verbose_name_plural = 'User Interactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['created_at', 'interaction_type']),
            models.Index(fields=['user']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'content_type', 'object_id', 'interaction_type'],
                name='unique_user_interaction',
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.get_interaction_type_display()} - {self.content_object}"

    @property
    def interaction_weight(self):
        weights = {
            'booking_complete': 1.0,
            'booking_start': 0.7,
            'wishlist_add': 0.6,
            'rating_given': 0.8,
            'review_added': 0.5,
            'view_place': 0.3,
            'view_experience': 0.3,
            'recommendation_click': 0.4,
            'default': 0.2
        }
        return weights.get(self.interaction_type, weights['default'])

    @classmethod
    def log_interaction(cls, user, content_object, interaction_type, **metadata):
        try:
            return cls.objects.create(
                user=user,
                content_object=content_object,
                interaction_type=interaction_type,
                metadata=metadata
            )
        except Exception as e:
            logger.error(f"Error logging interaction: {str(e)}", exc_info=True)
            raise

class UserLoginLog(BaseModel):
    """
    Tracks user login events for points and security.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_logs")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    login_status = models.CharField(max_length=20, default="success")
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        verbose_name = _("User Login Log")
        verbose_name_plural = _("User Login Logs")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['login_status']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} login at {self.created_at}"
    
    def save(self, *args, **kwargs):
        if not self.device_type and self.user_agent:
            self.device_type = self._get_device_type(self.user_agent)
        
        super().save(*args, **kwargs)
    
    def _get_device_type(self, user_agent):
        """Determine device type from user agent string"""
        ua = user_agent.lower()
        if 'mobile' in ua:
            if 'iphone' in ua:
                return 'iPhone'
            elif 'android' in ua:
                return 'Android Phone'
            return 'Mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            return 'Tablet'
        elif 'windows' in ua:
            return 'Desktop (Windows)'
        elif 'macintosh' in ua or 'mac os' in ua:
            return 'Desktop (Mac)'
        elif 'linux' in ua:
            return 'Desktop (Linux)'
        return 'Other'

class PointsTransaction(BaseModel):
    """
    Records points transactions for users.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='points_transactions')
    action = models.CharField(max_length=50, db_index=True)
    points = models.IntegerField()
    metadata = models.JSONField(default=dict, blank=True)
    
    interaction = models.ForeignKey( UserInteraction, on_delete=models.SET_NULL,  null=True,  blank=True, related_name='points_transactions')
    
    balance_after = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = _('points transaction')
        verbose_name_plural = _('points transactions')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action']),
            models.Index(fields=['points']),
        ]
    
    def __str__(self):
        if self.points >= 0:
            return f"{self.user.email} earned {self.points} points for {self.action}"
        else:
            return f"{self.user.email} spent {abs(self.points)} points for {self.action}"
    
    def save(self, *args, **kwargs):
        if self.balance_after == 0 and self.user:
            current_points = self.user.points
  
            if self.pk:
                try:
                    old_transaction = PointsTransaction.objects.get(pk=self.pk)
                    point_diff = self.points - old_transaction.points
                    self.balance_after = current_points
                except PointsTransaction.DoesNotExist:
                    self.balance_after = current_points
            else:
                self.balance_after = current_points
        
        super().save(*args, **kwargs)

class InteractionType(BaseModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    points_value = models.PositiveIntegerField(default=0)
    daily_limit = models.PositiveIntegerField(default=0, help_text="Maximum times per day this can earn points (0 = unlimited)")
    
    is_active = models.BooleanField(default=True)
    
    category = models.CharField(max_length=50, default="general")
    
    class Meta:
        verbose_name = _('interaction type')
        verbose_name_plural = _('interaction types')
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
