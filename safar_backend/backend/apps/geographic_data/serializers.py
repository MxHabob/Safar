from rest_framework import serializers
from apps.geographic_data.models import Country, Region,City

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'iso_code', 'iso3_code', 'phone_code', 
                 'capital', 'currency', 'languages']
        
    def to_representation(self, instance):
        """Optimize for list vs detail views"""
        representation = super().to_representation(instance)
        
        if self.context.get('is_detail_view', False):
            representation['centroid'] = {
                'lat': instance.centroid.y,
                'lng': instance.centroid.x
            } if instance.centroid else None
        return representation

class RegionSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    
    class Meta:
        model = Region
        fields = ['id', 'name', 'code', 'country', 'admin_level']
        
    def to_representation(self, instance):
        """Optimize for list vs detail views"""
        representation = super().to_representation(instance)
        
        if self.context.get('is_detail_view', False):
            representation['centroid'] = {
                'lat': instance.centroid.y,
                'lng': instance.centroid.x
            } if instance.centroid else None
        return representation

class CitySerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    region = serializers.StringRelatedField() 
    
    class Meta:
        model = City
        fields = ['id', 'name', 'name_ascii', 'country', 'region', 
                 'timezone', 'population', 'elevation']
        
    def to_representation(self, instance):
        """Optimize for list vs detail views"""
        representation = super().to_representation(instance)
        
        if self.context.get('is_detail_view', False):
            representation['coordinates'] = {
                'lat': instance.geometry.y,
                'lng': instance.geometry.x
            } if instance.geometry else None
        return representation