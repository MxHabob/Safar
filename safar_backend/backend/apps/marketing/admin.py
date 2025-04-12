from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from apps.marketing.models import Campaign, CampaignRecipient, CampaignTemplate

class CampaignRecipientInline(admin.TabularInline):
    model = CampaignRecipient
    extra = 0
    fields = ('user', 'is_delivered', 'delivered_at', 'is_viewed', 'is_clicked', 'is_converted')
    readonly_fields = ('user', 'is_delivered', 'delivered_at', 'is_viewed', 'is_clicked', 'is_converted')
    can_delete = False
    max_num = 20
    verbose_name = "Recipient"
    verbose_name_plural = "Sample Recipients"

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'campaign_type', 'status', 'scheduled_start', 'scheduled_end', 'target_audience_size', 'engagement_stats', 'created_by')
    list_filter = ('status', 'campaign_type', 'created_at', 'scheduled_start')
    search_fields = ('name', 'headline', 'message')
    readonly_fields = ('created_at', 'updated_at', 'actual_start', 'actual_end', 'target_audience_size', 'impressions_count', 'clicks_count', 'conversions_count')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'campaign_type', 'status', 'created_by', 'approved_by')
        }),
        ('Timing', {
            'fields': ('scheduled_start', 'scheduled_end', 'actual_start', 'actual_end', 'created_at', 'updated_at')
        }),
        ('Content', {
            'fields': ('headline', 'message', 'image_url', 'call_to_action', 'deep_link')
        }),
        ('Targeting', {
            'fields': ('target_all_users', 'target_segments', 'target_countries', 'target_cities', 'target_user_types')
        }),
        ('Related Entities', {
            'fields': ('related_discounts', 'related_places', 'related_experiences')
        }),
        ('Notification Settings', {
            'fields': ('notification_channels', 'notification_priority')
        }),
        ('Metrics', {
            'fields': ('target_audience_size', 'impressions_count', 'clicks_count', 'conversions_count')
        }),
        ('Additional Settings', {
            'fields': ('is_recurring', 'recurrence_pattern', 'budget', 'tags', 'metadata'),
            'classes': ('collapse',)
        }),
    )
    inlines = [CampaignRecipientInline]
    actions = ['activate_campaigns', 'pause_campaigns', 'complete_campaigns', 'cancel_campaigns']
    
    def engagement_stats(self, obj):
        if obj.target_audience_size == 0:
            return "No audience"
        
        impressions_rate = (obj.impressions_count / obj.target_audience_size) * 100 if obj.target_audience_size > 0 else 0
        clicks_rate = (obj.clicks_count / obj.impressions_count) * 100 if obj.impressions_count > 0 else 0
        
        return format_html(
            '<span title="Impressions: {}, Clicks: {}, Conversions: {}">Views: {:.1f}%, Clicks: {:.1f}%</span>',
            obj.impressions_count, obj.clicks_count, obj.conversions_count,
            impressions_rate, clicks_rate
        )
    engagement_stats.short_description = "Engagement"
    
    def activate_campaigns(self, request, queryset):
        activated = 0
        for campaign in queryset.filter(status__in=['draft', 'scheduled', 'paused']):
            if campaign.activate():
                activated += 1
        self.message_user(request, f"{activated} campaigns were activated successfully.")
    activate_campaigns.short_description = "Activate selected campaigns"
    
    def pause_campaigns(self, request, queryset):
        paused = 0
        for campaign in queryset.filter(status='active'):
            if campaign.pause():
                paused += 1
        self.message_user(request, f"{paused} campaigns were paused successfully.")
    pause_campaigns.short_description = "Pause selected campaigns"
    
    def complete_campaigns(self, request, queryset):
        completed = 0
        for campaign in queryset.filter(status__in=['active', 'paused']):
            if campaign.complete():
                completed += 1
        self.message_user(request, f"{completed} campaigns were marked as completed.")
    complete_campaigns.short_description = "Mark selected campaigns as completed"
    
    def cancel_campaigns(self, request, queryset):
        cancelled = 0
        for campaign in queryset.filter(status__in=['draft', 'scheduled', 'active', 'paused']):
            if campaign.cancel():
                cancelled += 1
        self.message_user(request, f"{cancelled} campaigns were cancelled.")
    cancel_campaigns.short_description = "Cancel selected campaigns"

@admin.register(CampaignTemplate)
class CampaignTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'campaign_type', 'is_active', 'created_by', 'created_at')
    list_filter = ('campaign_type', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'headline_template', 'message_template')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'campaign_type', 'is_active', 'created_by')
        }),
        ('Content Templates', {
            'fields': ('headline_template', 'message_template', 'image_url', 'call_to_action', 'deep_link_template')
        }),
        ('Notification Settings', {
            'fields': ('notification_channels', 'notification_priority')
        }),
        ('Template Variables', {
            'fields': ('variables',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['duplicate_templates']
    
    def duplicate_templates(self, request, queryset):
        duplicated = 0
        for template in queryset:
            new_template = template
            new_template.pk = None
            new_template.name = f"Copy of {template.name}"
            new_template.save()
            duplicated += 1
        self.message_user(request, f"{duplicated} templates were duplicated successfully.")
    duplicate_templates.short_description = "Duplicate selected templates"