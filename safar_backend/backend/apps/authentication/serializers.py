from rest_framework import serializers
from apps.authentication.models import User, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()
    region = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'phone_number', 'gender', 'avatar', 'bio', 'notification_push_token', 'country', 'region', 'city', 'postal_code', 'address']
        read_only_fields = ['id']

    def get_country(self, obj):
        return obj.country.name if obj.country else None

    def get_region(self, obj):
        return obj.region.name if obj.region else None

    def get_city(self, obj):
        return obj.city.name if obj.city else None

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name','username','is_online', 'is_active','created_at', 'last_login', 'profile']
        read_only_fields = ['id', 'is_active', 'last_login']
