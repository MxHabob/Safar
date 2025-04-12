from apps.core_apps.general import BaseModel
from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User


def get_default_notification_channels():
    return ['email', 'push', 'in_app']

class Campaign(BaseModel):
    """
    Advertising campaign model for managing marketing initiatives
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CAMPAIGN_TYPE_CHOICES = [
        ('discount', 'Discount Promotion'),
        ('announcement', 'Announcement'),
        ('feature', 'Feature Launch'),
        ('event', 'Event Promotion'),
        ('seasonal', 'Seasonal Offer'),
        ('loyalty', 'Loyalty Program'),
        ('reactivation', 'User Reactivation'),
        ('referral', 'Referral Program'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    
    # Content
    headline = models.CharField(max_length=200)
    message = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    call_to_action = models.CharField(max_length=50, blank=True)
    deep_link = models.CharField(max_length=255, blank=True)
    
    # Targeting
    target_all_users = models.BooleanField(default=False)
    target_segments = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    target_countries = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    target_cities = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    target_user_types = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Related entities
    related_discounts = models.ManyToManyField('safar.Discount', blank=True, related_name='campaigns')
    related_places = models.ManyToManyField('safar.Place', blank=True, related_name='campaigns')
    related_experiences = models.ManyToManyField('safar.Experience', blank=True, related_name='campaigns')
    
    # Notification settings
    notification_channels = ArrayField(models.CharField(max_length=20),default=get_default_notification_channels, size=5)
    notification_priority = models.CharField(max_length=10, default='normal', choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
    ])
    
    # Metrics
    target_audience_size = models.PositiveIntegerField(default=0)
    impressions_count = models.PositiveIntegerField(default=0)
    clicks_count = models.PositiveIntegerField(default=0)
    conversions_count = models.PositiveIntegerField(default=0)
    
    # Management
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_campaigns')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_campaigns')
    
    # Additional settings
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.JSONField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Campaign')
        verbose_name_plural = _('Campaigns')
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Auto-calculate target audience size before saving
        if self.status == 'scheduled' and not self.target_audience_size:
            from apps.marketing.services import CampaignService
            self.target_audience_size = CampaignService.estimate_audience_size(self)
        super().save(*args, **kwargs)
    
    def activate(self):
        """Activate the campaign and start sending notifications"""
        if self.status != 'active':
            self.status = 'active'
            self.actual_start = timezone.now()
            self.save(update_fields=['status', 'actual_start'])
            
            # Queue the campaign execution task
            from apps.marketing.tasks import execute_campaign
            execute_campaign.delay(str(self.id))
            
            return True
        return False
    
    def pause(self):
        """Pause an active campaign"""
        if self.status == 'active':
            self.status = 'paused'
            self.save(update_fields=['status'])
            return True
        return False
    
    def complete(self):
        """Mark campaign as completed"""
        if self.status in ['active', 'paused']:
            self.status = 'completed'
            self.actual_end = timezone.now()
            self.save(update_fields=['status', 'actual_end'])
            return True
        return False
    
    def cancel(self):
        """Cancel a campaign"""
        if self.status in ['draft', 'scheduled', 'active', 'paused']:
            self.status = 'cancelled'
            self.actual_end = timezone.now()
            self.save(update_fields=['status', 'actual_end'])
            return True
        return False
    
    def track_impression(self):
        """Track when a user views the campaign"""
        self.impressions_count += 1
        self.save(update_fields=['impressions_count'])
    
    def track_click(self):
        """Track when a user clicks on the campaign"""
        self.clicks_count += 1
        self.save(update_fields=['clicks_count'])
    
    def track_conversion(self):
        """Track when a user completes the desired action"""
        self.conversions_count += 1
        self.save(update_fields=['conversions_count'])


class CampaignRecipient(BaseModel):
    """
    Tracks campaign delivery to specific users
    """
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='recipients')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_campaigns')
    
    # Delivery status
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    channels_delivered = ArrayField(models.CharField(max_length=20), default=list)
    
    # Engagement tracking
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    is_clicked = models.BooleanField(default=False)
    clicked_at = models.DateTimeField(null=True, blank=True)
    is_converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ('campaign', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.campaign.name} - {self.user.email}"
    
    def mark_delivered(self, channels=None):
        """Mark campaign as delivered to this user"""
        self.is_delivered = True
        self.delivered_at = timezone.now()
        if channels:
            self.channels_delivered = channels
        self.save(update_fields=['is_delivered', 'delivered_at', 'channels_delivered'])
    
    def mark_viewed(self):
        """Mark campaign as viewed by this user"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        self.save(update_fields=['is_viewed', 'viewed_at'])
        
        # Also update campaign metrics
        self.campaign.track_impression()
    
    def mark_clicked(self):
        """Mark campaign as clicked by this user"""
        self.is_clicked = True
        self.clicked_at = timezone.now()
        self.save(update_fields=['is_clicked', 'clicked_at'])
        
        # Also update campaign metrics
        self.campaign.track_click()
    
    def mark_converted(self):
        """Mark campaign as resulting in conversion"""
        self.is_converted = True
        self.converted_at = timezone.now()
        self.save(update_fields=['is_converted', 'converted_at'])
        
        # Also update campaign metrics
        self.campaign.track_conversion()


class CampaignTemplate(BaseModel):
    """
    Reusable templates for campaigns
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    campaign_type = models.CharField(max_length=20, choices=Campaign.CAMPAIGN_TYPE_CHOICES)
    
    # Content templates
    headline_template = models.CharField(max_length=200)
    message_template = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    call_to_action = models.CharField(max_length=50, blank=True)
    deep_link_template = models.CharField(max_length=255, blank=True)
    
    # Default notification settings
    notification_channels = ArrayField(models.CharField(max_length=20),default=get_default_notification_channels, size=5)
    notification_priority = models.CharField(max_length=10, default='normal', choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
    ])
    
    # Template variables
    variables = models.JSONField(default=dict, blank=True)
    
    # Management
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_templates')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.campaign_type})"
    
    def create_campaign(self, name, variables=None, **kwargs):
        """Create a new campaign from this template"""
        from apps.marketing.services import CampaignService
        return CampaignService.create_from_template(self, name, variables, **kwargs)