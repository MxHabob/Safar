import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.template import Template, Context
from django.conf import settings
from apps.authentication.models import User,UserInteraction
from apps.safar.models import Booking
from apps.core_apps.services import NotificationService
from apps.marketing.models import Campaign, CampaignRecipient

logger = logging.getLogger(__name__)

class CampaignService:
    """
    Service for managing advertising campaigns and their execution
    """
    
    @staticmethod
    def create_campaign(
        name,
        campaign_type,
        headline,
        message,
        scheduled_start=None,
        scheduled_end=None,
        target_all_users=False,
        target_segments=None,
        target_countries=None,
        target_cities=None,
        target_user_types=None,
        notification_channels=None,
        notification_priority='normal',
        image_url=None,
        call_to_action=None,
        deep_link=None,
        related_discounts=None,
        related_places=None,
        related_experiences=None,
        created_by=None,
        status='draft',
        **kwargs
    ):
        """
        Create a new advertising campaign
        """
        try:
            campaign = Campaign.objects.create(
                name=name,
                campaign_type=campaign_type,
                headline=headline,
                message=message,
                scheduled_start=scheduled_start,
                scheduled_end=scheduled_end,
                target_all_users=target_all_users,
                target_segments=target_segments or [],
                target_countries=target_countries or [],
                target_cities=target_cities or [],
                target_user_types=target_user_types or [],
                notification_channels=notification_channels or ['email', 'push', 'in_app'],
                notification_priority=notification_priority,
                image_url=image_url,
                call_to_action=call_to_action,
                deep_link=deep_link,
                created_by=created_by,
                status=status,
                **kwargs
            )
            
            # Add related entities
            if related_discounts:
                campaign.related_discounts.set(related_discounts)
            
            if related_places:
                campaign.related_places.set(related_places)
                
            if related_experiences:
                campaign.related_experiences.set(related_experiences)
            
            # Calculate target audience size
            campaign.target_audience_size = CampaignService.estimate_audience_size(campaign)
            campaign.save(update_fields=['target_audience_size'])
            
            logger.info(f"Created campaign '{name}' with ID {campaign.id}")
            return campaign
            
        except Exception as e:
            logger.error(f"Failed to create campaign '{name}': {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def create_from_template(template, name, variables=None, **kwargs):
        """
        Create a campaign from a template
        """
        try:
            variables = variables or {}
            
            # Process template variables
            context = Context(variables)
            headline = Template(template.headline_template).render(context)
            message = Template(template.message_template).render(context)
            deep_link = Template(template.deep_link_template).render(context) if template.deep_link_template else None
            
            # Create campaign with template values and overrides
            campaign_data = {
                'name': name,
                'campaign_type': template.campaign_type,
                'headline': headline,
                'message': message,
                'image_url': template.image_url,
                'call_to_action': template.call_to_action,
                'deep_link': deep_link,
                'notification_channels': template.notification_channels,
                'notification_priority': template.notification_priority,
                'metadata': {
                    'template_id': str(template.id),
                    'template_name': template.name,
                    'variables': variables
                }
            }
            
            # Override with any provided kwargs
            campaign_data.update(kwargs)
            
            return CampaignService.create_campaign(**campaign_data)
            
        except Exception as e:
            logger.error(f"Failed to create campaign from template '{template.name}': {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def estimate_audience_size(campaign):
        """
        Estimate the size of the target audience for a campaign
        """
        try:
            users_query = User.objects.filter(is_active=True)
            
            # If targeting all users, return total count
            if campaign.target_all_users:
                return users_query.count()
            
            # Apply segment filters
            if campaign.target_segments:
                segment_users = set()
                
                for segment in campaign.target_segments:
                    segment_users.update(
                        CampaignService._get_users_by_segment(segment)
                    )
                
                if segment_users:
                    users_query = users_query.filter(id__in=segment_users)
            
            # Apply country filters
            if campaign.target_countries:
                users_query = users_query.filter(profile__country__in=campaign.target_countries)
            
            # Apply city filters
            if campaign.target_cities:
                users_query = users_query.filter(profile__city__in=campaign.target_cities)
            
            # Apply user type filters
            if campaign.target_user_types:
                users_query = users_query.filter(role__in=campaign.target_user_types)
            
            return users_query.count()
            
        except Exception as e:
            logger.error(f"Failed to estimate audience size for campaign {campaign.id}: {str(e)}", exc_info=True)
            return 0
    
    @staticmethod
    def _get_users_by_segment(segment):
        """
        Get user IDs belonging to a specific segment
        """
        users = []
        
        if segment == "new_users":
            # Users who registered in the last 30 days
            thirty_days_ago = timezone.now() - timedelta(days=30)
            users = User.objects.filter(
                is_active=True,
                date_joined__gte=thirty_days_ago
            ).values_list('id', flat=True)
            
        elif segment == "inactive_users":
            # Users who haven't made a booking in 90 days
            ninety_days_ago = timezone.now() - timedelta(days=90)
            
            # Get users with recent bookings
            active_user_ids = Booking.objects.filter(
                booking_date__gte=ninety_days_ago
            ).values_list('user_id', flat=True).distinct()
            
            # Exclude active users
            users = User.objects.filter(
                is_active=True
            ).exclude(
                id__in=active_user_ids
            ).values_list('id', flat=True)
            
        elif segment == "frequent_travelers":
            # Users with more than 3 bookings
            booking_counts = Booking.objects.values('user_id').annotate(
                booking_count=Count('id')
            ).filter(booking_count__gt=3)
            
            users = [item['user_id'] for item in booking_counts]
            
        elif segment == "high_spenders":
            # Users who have spent above average
            from django.db.models import Avg, Sum
            
            # Get average spending
            avg_spending = Booking.objects.filter(
                payment_status='Completed'
            ).aggregate(avg=Avg('total_price'))['avg'] or 0
            
            # Get users with total spending above average
            spending_by_user = Booking.objects.filter(
                payment_status='Completed'
            ).values('user_id').annotate(
                total_spent=Sum('total_price')
            ).filter(total_spent__gt=avg_spending)
            
            users = [item['user_id'] for item in spending_by_user]
            
        elif segment == "discount_users":
            # Users who have used discounts before
            users = Booking.objects.filter(
                discount__isnull=False
            ).values_list('user_id', flat=True).distinct()
            
        elif segment == "mobile_users":
            # Users who primarily use mobile devices
            users = UserInteraction.objects.filter(
                device_type__in=['mobile', 'tablet']
            ).values('user_id').annotate(
                interaction_count=Count('id')
            ).filter(interaction_count__gt=5).values_list('user_id', flat=True)
        
        return users
    
    @staticmethod
    def execute_campaign(campaign_id):
        """
        Execute a campaign by sending notifications to target users
        """
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            
            # Ensure campaign is active
            if campaign.status != 'active':
                logger.warning(f"Cannot execute campaign {campaign_id} with status {campaign.status}")
                return False
            
            # Get target users
            target_users = CampaignService.get_target_users(campaign)
            
            if not target_users:
                logger.warning(f"No target users found for campaign {campaign_id}")
                return False
            
            # Create campaign recipients
            recipients = []
            for user in target_users:
                recipient, created = CampaignRecipient.objects.get_or_create(
                    campaign=campaign,
                    user=user
                )
                if not recipient.is_delivered:
                    recipients.append(recipient)
            
            # Send notifications in batches
            batch_size = 100
            for i in range(0, len(recipients), batch_size):
                batch = recipients[i:i+batch_size]
                CampaignService._send_campaign_notifications(campaign, batch)
            
            logger.info(f"Executed campaign {campaign_id} for {len(recipients)} recipients")
            return True
            
        except Campaign.DoesNotExist:
            logger.error(f"Campaign {campaign_id} not found")
            return False
        except Exception as e:
            logger.error(f"Failed to execute campaign {campaign_id}: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def get_target_users(campaign):
        """
        Get the list of users targeted by a campaign
        """
        try:
            users_query = User.objects.filter(is_active=True)
            
            # If targeting all users, return all active users
            if campaign.target_all_users:
                return list(users_query)
            
            # Apply segment filters
            if campaign.target_segments:
                segment_user_ids = set()
                
                for segment in campaign.target_segments:
                    segment_user_ids.update(
                        CampaignService._get_users_by_segment(segment)
                    )
                
                if segment_user_ids:
                    users_query = users_query.filter(id__in=segment_user_ids)
            
            # Apply country filters
            if campaign.target_countries:
                users_query = users_query.filter(profile__country__in=campaign.target_countries)
            
            # Apply city filters
            if campaign.target_cities:
                users_query = users_query.filter(profile__city__in=campaign.target_cities)
            
            # Apply user type filters
            if campaign.target_user_types:
                users_query = users_query.filter(role__in=campaign.target_user_types)
            
            return list(users_query)
            
        except Exception as e:
            logger.error(f"Failed to get target users for campaign {campaign.id}: {str(e)}", exc_info=True)
            return []
    
    @staticmethod
    def _send_campaign_notifications(campaign, recipients):
        """
        Send notifications to a batch of campaign recipients
        """
        try:
            # Prepare notification data
            notification_data = {
                'campaign_id': str(campaign.id),
                'campaign_type': campaign.campaign_type,
                'deep_link': campaign.deep_link,
                'image_url': campaign.image_url,
                'call_to_action': campaign.call_to_action,
                'metadata': campaign.metadata
            }
            
            # Add related entities to notification data
            if campaign.related_discounts.exists():
                discount_codes = list(campaign.related_discounts.values_list('code', flat=True))
                notification_data['discount_codes'] = discount_codes
            
            # For small batches, send individual personalized notifications
            if len(recipients) <= 50:
                for recipient in recipients:
                    # Personalize message if needed
                    personalized_message = CampaignService._personalize_message(
                        campaign.message, 
                        recipient.user
                    )
                    
                    # Send through appropriate channels
                    channels_delivered = []
                    
                    # In-app notification
                    if 'in_app' in campaign.notification_channels:
                        from apps.safar.models import Notification
                        
                        notification = Notification.objects.create(
                            user=recipient.user,
                            type=f"Campaign: {campaign.campaign_type}",
                            message=personalized_message,
                            metadata={
                                **notification_data,
                                'recipient_id': str(recipient.id)
                            }
                        )
                        
                        # Process notification based on priority
                        from apps.core_apps.tasks import process_notification
                        process_notification.delay(notification.id)
                        
                        channels_delivered.append('in_app')
                    
                    # Email notification
                    if 'email' in campaign.notification_channels and recipient.user.email:
                        email_sent = NotificationService.send_email(
                            subject=campaign.headline,
                            message=personalized_message,
                            recipient_list=[recipient.user.email],
                            context={
                                'user': recipient.user,
                                'campaign': {
                                    'id': str(campaign.id),
                                    'name': campaign.name,
                                    'headline': campaign.headline,
                                    'message': personalized_message,
                                    'image_url': campaign.image_url,
                                    'call_to_action': campaign.call_to_action,
                                    'deep_link': campaign.deep_link
                                },
                                'action_url': campaign.deep_link or settings.SITE_URL,
                                'current_year': timezone.now().year,
                                'site_name': settings.SITE_NAME
                            }
                        )
                        
                        if email_sent:
                            channels_delivered.append('email')
                    
                    # Push notification
                    if 'push' in campaign.notification_channels and hasattr(recipient.user, 'profile') and recipient.user.profile.notification_push_token:
                        push_sent = NotificationService.send_push_notification(
                            user=recipient.user,
                            title=campaign.headline,
                            message=personalized_message,
                            data=notification_data,
                            image_url=campaign.image_url
                        )
                        
                        if push_sent:
                            channels_delivered.append('push')
                    
                    # SMS notification
                    if 'sms' in campaign.notification_channels and hasattr(recipient.user, 'profile') and recipient.user.profile.phone_number:
                        sms_sent = NotificationService.send_sms(
                            to_number=str(recipient.user.profile.phone_number),
                            message=f"{campaign.headline}: {personalized_message[:100]}..."
                        )
                        
                        if sms_sent:
                            channels_delivered.append('sms')
                    
                    # Mark as delivered
                    recipient.mark_delivered(channels=channels_delivered)
            
            # For larger batches, use bulk operations
            else:
                # Group users by notification preferences
                email_users = []
                push_users = []
                sms_users = []
                in_app_users = []
                
                for recipient in recipients:
                    # Always add to in-app
                    in_app_users.append(recipient.user)
                    
                    # Add to email if user has email
                    if 'email' in campaign.notification_channels and recipient.user.email:
                        email_users.append(recipient.user)
                    
                    # Add to push if user has push token
                    if 'push' in campaign.notification_channels and hasattr(recipient.user, 'profile') and recipient.user.profile.notification_push_token:
                        push_users.append(recipient.user)
                    
                    # Add to SMS if user has phone number
                    if 'sms' in campaign.notification_channels and hasattr(recipient.user, 'profile') and recipient.user.profile.phone_number:
                        sms_users.append(recipient.user)
                
                # Create in-app notifications for all users
                if in_app_users and 'in_app' in campaign.notification_channels:
                    from apps.safar.models import Notification
                    
                    notifications = []
                    for user in in_app_users:
                        recipient = next((r for r in recipients if r.user.id == user.id), None)
                        if recipient:
                            notifications.append(
                                Notification(
                                    user=user,
                                    type=f"Campaign: {campaign.campaign_type}",
                                    message=campaign.message,
                                    metadata={
                                        **notification_data,
                                        'recipient_id': str(recipient.id)
                                    }
                                )
                            )
                    
                    # Bulk create notifications
                    created_notifications = Notification.objects.bulk_create(notifications)
                    
                    # Process notifications
                    for notification in created_notifications:
                        from apps.core_apps.tasks import process_notification
                        process_notification.delay(notification.id)
                
                # Send bulk emails
                if email_users and 'email' in campaign.notification_channels:
                    # Prepare email data
                    email_data = {
                        'subject': campaign.headline,
                        'message': campaign.message,
                        'context': {
                            'campaign': {
                                'id': str(campaign.id),
                                'name': campaign.name,
                                'headline': campaign.headline,
                                'message': campaign.message,
                                'image_url': campaign.image_url,
                                'call_to_action': campaign.call_to_action,
                                'deep_link': campaign.deep_link
                            },
                            'action_url': campaign.deep_link or settings.SITE_URL,
                            'current_year': timezone.now().year,
                            'site_name': settings.SITE_NAME
                        }
                    }
                    
                    # Send emails in smaller batches
                    email_batch_size = 20
                    for i in range(0, len(email_users), email_batch_size):
                        batch = email_users[i:i+email_batch_size]
                        for user in batch:
                            from apps.core_apps.tasks import send_email_task
                            send_email_task.delay(
                                subject=email_data['subject'],
                                message=email_data['message'],
                                recipient_list=[user.email],
                                context={**email_data['context'], 'user': user}
                            )
                
                # Send bulk push notifications
                if push_users and 'push' in campaign.notification_channels:
                    user_ids = [user.id for user in push_users]
                    from apps.core_apps.tasks import send_bulk_push_notifications
                    send_bulk_push_notifications.delay(
                        user_ids=user_ids,
                        title=campaign.headline,
                        message=campaign.message,
                        data=notification_data,
                        image_url=campaign.image_url
                    )
                
                # Mark all as delivered
                for recipient in recipients:
                    channels = []
                    if recipient.user in in_app_users and 'in_app' in campaign.notification_channels:
                        channels.append('in_app')
                    if recipient.user in email_users and 'email' in campaign.notification_channels:
                        channels.append('email')
                    if recipient.user in push_users and 'push' in campaign.notification_channels:
                        channels.append('push')
                    if recipient.user in sms_users and 'sms' in campaign.notification_channels:
                        channels.append('sms')
                    
                    recipient.mark_delivered(channels=channels)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send campaign notifications: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def _personalize_message(message, user):
        """
        Personalize a campaign message for a specific user
        """
        try:
            # Replace placeholders with user data
            personalized = message.replace('{first_name}', user.first_name or '')
            personalized = personalized.replace('{last_name}', user.last_name or '')
            personalized = personalized.replace('{full_name}', user.get_full_name() or user.email)
            personalized = personalized.replace('{email}', user.email or '')
            
            # Replace more complex placeholders if profile exists
            if hasattr(user, 'profile'):
                personalized = personalized.replace('{city}', user.profile.city or '')
                personalized = personalized.replace('{country}', user.profile.country or '')
            
            return personalized
        except Exception:
            # If personalization fails, return original message
            return message
    
    @staticmethod
    def track_campaign_interaction(campaign_id, user_id, interaction_type, metadata=None):
        """
        Track user interaction with a campaign
        """
        try:
            recipient = CampaignRecipient.objects.get(
                campaign_id=campaign_id,
                user_id=user_id
            )
            
            if interaction_type == 'view':
                recipient.mark_viewed()
            elif interaction_type == 'click':
                recipient.mark_clicked()
            elif interaction_type == 'conversion':
                recipient.mark_converted()
            
            # Update metadata if provided
            if metadata:
                recipient.metadata.update(metadata)
                recipient.save(update_fields=['metadata'])
            
            return True
            
        except CampaignRecipient.DoesNotExist:
            logger.warning(f"No recipient found for campaign {campaign_id} and user {user_id}")
            return False
        except Exception as e:
            logger.error(f"Failed to track campaign interaction: {str(e)}", exc_info=True)
            return False