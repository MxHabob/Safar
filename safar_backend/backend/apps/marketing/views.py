from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.marketing.models import Campaign, CampaignRecipient, CampaignTemplate
from apps.marketing.serializers import CampaignSerializer, CampaignTemplateSerializer, CampaignRecipientSerializer
from apps.marketing.services import CampaignService

class CampaignViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing advertising campaigns
    """
    queryset = Campaign.objects.all().order_by('-created_at')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter campaigns based on user permissions"""
        user = self.request.user
        
        # Staff can see all campaigns
        if user.is_staff:
            return self.queryset
        
        # Regular users can only see campaigns they created
        return self.queryset.filter(created_by=user)
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a campaign"""
        campaign = self.get_object()
        
        if campaign.activate():
            return Response({'status': 'campaign activated'})
        return Response(
            {'error': 'Cannot activate campaign with current status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a campaign"""
        campaign = self.get_object()
        
        if campaign.pause():
            return Response({'status': 'campaign paused'})
        return Response(
            {'error': 'Cannot pause campaign with current status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a campaign as completed"""
        campaign = self.get_object()
        
        if campaign.complete():
            return Response({'status': 'campaign completed'})
        return Response(
            {'error': 'Cannot complete campaign with current status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a campaign"""
        campaign = self.get_object()
        
        if campaign.cancel():
            return Response({'status': 'campaign cancelled'})
        return Response(
            {'error': 'Cannot cancel campaign with current status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get campaign analytics"""
        campaign = self.get_object()
        
        # Get basic metrics
        recipients = CampaignRecipient.objects.filter(campaign=campaign)
        total_recipients = recipients.count()
        delivered = recipients.filter(is_delivered=True).count()
        viewed = recipients.filter(is_viewed=True).count()
        clicked = recipients.filter(is_clicked=True).count()
        converted = recipients.filter(is_converted=True).count()
        
        # Calculate rates
        delivery_rate = (delivered / total_recipients) * 100 if total_recipients > 0 else 0
        view_rate = (viewed / delivered) * 100 if delivered > 0 else 0
        click_rate = (clicked / viewed) * 100 if viewed > 0 else 0
        conversion_rate = (converted / clicked) * 100 if clicked > 0 else 0
        
        # Get channel breakdown
        channels = {}
        for channel in ['email', 'push', 'in_app', 'sms']:
            channel_count = recipients.filter(channels_delivered__contains=[channel]).count()
            channels[channel] = {
                'count': channel_count,
                'percentage': (channel_count / total_recipients) * 100 if total_recipients > 0 else 0
            }
        
        return Response({
            'campaign_id': str(campaign.id),
            'name': campaign.name,
            'status': campaign.status,
            'target_audience_size': campaign.target_audience_size,
            'metrics': {
                'total_recipients': total_recipients,
                'delivered': delivered,
                'viewed': viewed,
                'clicked': clicked,
                'converted': converted,
                'delivery_rate': round(delivery_rate, 2),
                'view_rate': round(view_rate, 2),
                'click_rate': round(click_rate, 2),
                'conversion_rate': round(conversion_rate, 2),
            },
            'channels': channels,
            'updated_at': timezone.now().isoformat()
        })
    
    @action(detail=True, methods=['post'])
    def track_interaction(self, request, pk=None):
        """Track user interaction with a campaign"""
        campaign = self.get_object()
        user_id = request.data.get('user_id') or request.user.id
        interaction_type = request.data.get('type')
        metadata = request.data.get('metadata')
        
        if not interaction_type or interaction_type not in ['view', 'click', 'conversion']:
            return Response(
                {'error': 'Invalid interaction type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = CampaignService.track_campaign_interaction(
            campaign_id=campaign.id,
            user_id=user_id,
            interaction_type=interaction_type,
            metadata=metadata
        )
        
        if success:
            return Response({'status': 'interaction tracked'})
        return Response(
            {'error': 'Failed to track interaction'},
            status=status.HTTP_400_BAD_REQUEST
        )

class CampaignTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing campaign templates
    """
    queryset = CampaignTemplate.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = CampaignTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates based on user permissions"""
        user = self.request.user
        
        # Staff can see all templates
        if user.is_staff:
            return CampaignTemplate.objects.all().order_by('-created_at')
        
        # Regular users can only see active templates and ones they created
        return self.queryset.filter(is_active=True).filter(
            models.Q(created_by=user) | models.Q(created_by__isnull=True)
        )
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_campaign(self, request, pk=None):
        """Create a campaign from this template"""
        template = self.get_object()
        
        # Get required parameters
        name = request.data.get('name')
        variables = request.data.get('variables', {})
        
        if not name:
            return Response(
                {'error': 'Campaign name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create campaign from template
        campaign = CampaignService.create_from_template(
            template=template,
            name=name,
            variables=variables,
            created_by=request.user,
            **{k: v for k, v in request.data.items() if k not in ['name', 'variables']}
        )
        
        if campaign:
            serializer = CampaignSerializer(campaign)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Failed to create campaign from template'},
            status=status.HTTP_400_BAD_REQUEST
        )