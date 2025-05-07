from djoser.serializers import UserSerializer as DjoserUserSerializer
from rest_framework import serializers
from apps.authentication.models import User, UserProfile,PointsTransaction, UserInteraction, UserLoginLog, InteractionType
from apps.geographic_data.serializers import CitySerializer, CountrySerializer, RegionSerializer

class UserProfileSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    city = CitySerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'phone_number', 'gender', 'avatar', 'bio', 
            'notification_push_token', 'country', 'region', 'city',
            'postal_code', 'address', 'date_of_birth',
            'privacy_consent', 'consent_date'
        ]
        read_only_fields = ['id', 'consent_date']


    
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 
            'first_name', 'last_name',
            'username', 'is_online', 'is_active',
            'created_at', 'updated_at', 'last_login', 
            'profile', 'membership_level','points',
            'preferred_language', 'preferred_currency'
        ]
        read_only_fields = [
            'id', 'is_active', 'last_login', 
            'created_at', 'updated_at', 'role'
        ]

class UserPublicSerializer(DjoserUserSerializer):
    profile = UserProfileSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta(DjoserUserSerializer.Meta):
        fields = tuple(DjoserUserSerializer.Meta.fields) + (
            'id', 'email', 'role', 
            'profile', 'followers_count', 'following_count',
            'first_name', 'last_name', 'username','is_active',
            'created_at', 'updated_at', 'last_login', 
            'is_following', 'is_online', 'membership_level', 
            'points', 'preferred_language', 'preferred_currency'
        )
        read_only_fields = [
            'id', 'is_active', 'last_login', 
            'created_at', 'updated_at', 'role'
        ]
    
    def get_followers_count(self, obj):
        if hasattr(obj, 'get_followers_count'):
            return obj.get_followers_count()
        return 0

    def get_following_count(self, obj):
        if hasattr(obj, 'get_following_count'):
            return obj.get_following_count()
        return 0

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'is_following'):
            return request.user.is_following(obj)
        return False
    
class PointsTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for points transactions.
    """
    action_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PointsTransaction
        fields = ['id', 'action', 'action_display', 'points', 'metadata', 'balance_after', 'created_at']
    
    def get_action_display(self, obj):
        """
        Get a human-readable description of the action.
        """
        from .points import PointsManager
        
        config = PointsManager.get_points_config()
        
        if obj.action in config:
            return config[obj.action]['name']
        
        if obj.action.startswith('deduct:'):
            reason = obj.action.split(':', 1)[1]
            return f"Points deduction: {reason}"
        
        return obj.action.replace('_', ' ').title()

class PointsSummarySerializer(serializers.Serializer):
    """
    Serializer for points summary.
    """
    total_points = serializers.IntegerField()
    earned_points = serializers.DictField(child=serializers.IntegerField())
    spent_points = serializers.DictField(child=serializers.IntegerField())
    points_by_category = serializers.DictField(child=serializers.IntegerField())
    membership_level = serializers.CharField()
    next_level = serializers.CharField(allow_null=True)
    points_to_next_level = serializers.IntegerField()
    progress_percentage = serializers.IntegerField()
    recent_transactions = serializers.ListField(child=serializers.DictField())

class UserInteractionSerializer(serializers.ModelSerializer):
    """
    Serializer for user interactions.
    """
    content_type_display = serializers.SerializerMethodField()
    interaction_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserInteraction
        fields = ['id', 'interaction_type', 'interaction_type_display', 'content_type', 
                  'content_type_display', 'object_id', 'metadata', 'created_at']
    
    def get_content_type_display(self, obj):
        """
        Get a human-readable description of the content type.
        """
        return obj.content_type.model.replace('_', ' ').title()
    
    def get_interaction_type_display(self, obj):
        """
        Get a human-readable description of the interaction type.
        """
        try:
            interaction_type = InteractionType.objects.get(code=obj.interaction_type)
            return interaction_type.name
        except InteractionType.DoesNotExist:
            return obj.interaction_type.replace('_', ' ').title()

class UserLoginLogSerializer(serializers.ModelSerializer):
    """
    Serializer for user login logs.
    """
    class Meta:
        model = UserLoginLog
        fields = ['id', 'ip_address', 'device_type', 'login_status', 'country', 'city', 'created_at']

class InteractionTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for interaction types.
    """
    class Meta:
        model = InteractionType
        fields = ['id', 'code', 'name', 'description', 'points_value', 'daily_limit', 'category', 'is_active']
