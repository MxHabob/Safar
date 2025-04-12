import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from apps.marketing.models import Campaign, CampaignRecipient

logger = logging.getLogger(__name__)

@shared_task
def execute_campaign(campaign_id):
    """
    Execute a campaign by sending notifications to target users
    """
    from apps.marketing.services import CampaignService
    return CampaignService.execute_campaign(campaign_id)

@shared_task
def schedule_campaigns():
    """
    Check for scheduled campaigns that should be activated
    """
    now = timezone.now()
    
    # Find campaigns scheduled to start now
    scheduled_campaigns = Campaign.objects.filter(
        status='scheduled',
        scheduled_start__lte=now
    )
    
    activated_count = 0
    for campaign in scheduled_campaigns:
        try:
            with transaction.atomic():
                # Activate the campaign
                campaign.status = 'active'
                campaign.actual_start = now
                campaign.save(update_fields=['status', 'actual_start'])
                
                # Queue execution task
                execute_campaign.delay(str(campaign.id))
                
                activated_count += 1
                logger.info(f"Activated scheduled campaign: {campaign.name} ({campaign.id})")
                
        except Exception as e:
            logger.error(f"Failed to activate scheduled campaign {campaign.id}: {str(e)}", exc_info=True)
    
    return activated_count

@shared_task
def end_expired_campaigns():
    """
    Complete campaigns that have reached their end date
    """
    now = timezone.now()
    
    # Find active campaigns that should end
    expired_campaigns = Campaign.objects.filter(
        status='active',
        scheduled_end__lte=now
    )
    
    completed_count = 0
    for campaign in expired_campaigns:
        try:
            with transaction.atomic():
                # Mark as completed
                campaign.status = 'completed'
                campaign.actual_end = now
                campaign.save(update_fields=['status', 'actual_end'])
                
                completed_count += 1
                logger.info(f"Completed expired campaign: {campaign.name} ({campaign.id})")
                
        except Exception as e:
            logger.error(f"Failed to complete expired campaign {campaign.id}: {str(e)}", exc_info=True)
    
    return completed_count

@shared_task
def process_campaign_analytics():
    """
    Process campaign analytics and update metrics
    """
    # Get active campaigns
    active_campaigns = Campaign.objects.filter(status='active')
    
    for campaign in active_campaigns:
        try:
            # Count recipients
            total_recipients = CampaignRecipient.objects.filter(campaign=campaign).count()
            delivered = CampaignRecipient.objects.filter(campaign=campaign, is_delivered=True).count()
            viewed = CampaignRecipient.objects.filter(campaign=campaign, is_viewed=True).count()
            clicked = CampaignRecipient.objects.filter(campaign=campaign, is_clicked=True).count()
            converted = CampaignRecipient.objects.filter(campaign=campaign, is_converted=True).count()
            
            # Calculate rates
            delivery_rate = (delivered / total_recipients) * 100 if total_recipients > 0 else 0
            view_rate = (viewed / delivered) * 100 if delivered > 0 else 0
            click_rate = (clicked / viewed) * 100 if viewed > 0 else 0
            conversion_rate = (converted / clicked) * 100 if clicked > 0 else 0
            
            # Update campaign metadata
            campaign.metadata.update({
                'analytics': {
                    'total_recipients': total_recipients,
                    'delivered': delivered,
                    'viewed': viewed,
                    'clicked': clicked,
                    'converted': converted,
                    'delivery_rate': round(delivery_rate, 2),
                    'view_rate': round(view_rate, 2),
                    'click_rate': round(click_rate, 2),
                    'conversion_rate': round(conversion_rate, 2),
                    'last_updated': timezone.now().isoformat()
                }
            })
            
            campaign.save(update_fields=['metadata'])
            logger.info(f"Updated analytics for campaign {campaign.id}")
            
        except Exception as e:
            logger.error(f"Failed to process analytics for campaign {campaign.id}: {str(e)}", exc_info=True)
    
    return len(active_campaigns)