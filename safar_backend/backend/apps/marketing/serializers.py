from rest_framework import serializers
from apps.marketing.models import Campaign, CampaignRecipient, CampaignTemplate
from apps.authentication.serializers import UserSerializer
from apps.safar.serializers import DiscountSerializer

class CampaignTemplateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = CampaignTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

class CampaignRecipientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CampaignRecipient
        fields = '__all__'
        read_only_fields = ('created_at', 'delivered_at', 'viewed_at', 'clicked_at', 'converted_at')

class CampaignSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    related_discounts = DiscountSerializer(many=True, read_only=True)
    recipients_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = (
            'created_at', 'updated_at', 'actual_start', 'actual_end',
            'impressions_count', 'clicks_count', 'conversions_count',
            'created_by', 'approved_by', 'recipients_count'
        )
    
    def get_recipients_count(self, obj):
        return obj.recipients.count()
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Add analytics data if available
        if instance.metadata and 'analytics' in instance.metadata:
            representation['analytics'] = instance.metadata['analytics']
        
        return representation