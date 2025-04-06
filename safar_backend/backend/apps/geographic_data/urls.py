from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.geographic_data.views import (
    CountryViewSet,
    RegionViewSet,
    CityViewSet,
    NearbyCitiesView,
    CitiesInCountryView,
    CitiesInRegionView,
    CitySearchView
)

router = DefaultRouter()
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'cities', CityViewSet, basename='city')

urlpatterns = [
    path('cities/nearby/', NearbyCitiesView.as_view(), name='nearby-cities'),
    path('cities/search/', CitySearchView.as_view(), name='city-search'),
    path('countries/<str:country_code>/cities/', CitiesInCountryView.as_view(), name='country-cities'),
    path('regions/<int:region_id>/cities/', CitiesInRegionView.as_view(), name='region-cities'),
] + router.urls