from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from apps.geographic_data.models import Country, Region, City


@admin.register(Country)
class CountryAdmin(GISModelAdmin):
    list_display = ('name', 'iso_code', 'iso3_code', 'phone_code', 'capital', 'currency')
    search_fields = ('name', 'iso_code', 'iso3_code', 'capital')
    list_filter = ('currency',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    default_lon = 0
    default_lat = 20
    default_zoom = 2


@admin.register(Region)
class RegionAdmin(GISModelAdmin):
    list_display = ('name', 'code', 'country', 'admin_level')
    search_fields = ('name', 'code', 'country__name')
    list_filter = ('country', 'admin_level')
    ordering = ('country__name', 'name')
    readonly_fields = ('created_at', 'updated_at')
    default_lon = 0
    default_lat = 20
    default_zoom = 4


@admin.register(City)
class CityAdmin(GISModelAdmin):
    list_display = ('name', 'country', 'region', 'population', 'timezone')
    search_fields = ('name', 'name_ascii', 'country__name', 'region__name')
    list_filter = ('country', 'region', 'timezone')
    ordering = ('country__name', 'region__name', 'name')
    readonly_fields = ('created_at', 'updated_at')
    default_lon = 0
    default_lat = 20
    default_zoom = 5
