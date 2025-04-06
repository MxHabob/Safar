from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import action

from apps.geographic_data.models import Country, Region, City
from apps.geographic_data.serializers import CountrySerializer, RegionSerializer, CitySerializer


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        iso_code = self.request.query_params.get('iso_code')
        if iso_code:
            queryset = queryset.filter(iso_code__iexact=iso_code)

        return queryset.select_related().only(
            'id', 'name', 'iso_code', 'iso3_code', 'phone_code',
            'capital', 'currency', 'languages', 'centroid'
        )

    @action(detail=True, methods=['get'])
    def regions(self, request, pk=None):
        country = self.get_object()
        regions = country.regions.all().select_related('country').only(
            'id', 'name', 'code', 'admin_level', 'country', 'centroid'
        )
        serializer = RegionSerializer(regions, many=True)
        return Response(serializer.data)


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country_id')
        if country_id:
            queryset = queryset.filter(country_id=country_id)

        return queryset.select_related('country').only(
            'id', 'name', 'code', 'admin_level', 'country', 'centroid'
        )

    @action(detail=True, methods=['get'])
    def cities(self, request, pk=None):
        region = self.get_object()
        cities = region.cities.all().select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        )
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country_id')
        region_id = self.request.query_params.get('region_id')

        if country_id:
            queryset = queryset.filter(country_id=country_id)
        if region_id:
            queryset = queryset.filter(region_id=region_id)

        return queryset.select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        )


class NearbyCitiesView(generics.ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 50)

        try:
            point = Point(float(lng), float(lat), srid=4326)
            radius = float(radius)
        except (TypeError, ValueError):
            return City.objects.none()

        return City.objects.annotate(
            distance=Distance('geometry', point)
        ).filter(
            geometry__distance_lte=(point, D(km=radius))
        ).select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        ).order_by('distance')


class CitiesInCountryView(generics.ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        country_code = self.kwargs.get('country_code')
        return City.objects.filter(
            country__iso_code__iexact=country_code
        ).select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        ).order_by('name')


class CitiesInRegionView(generics.ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        region_id = self.kwargs.get('region_id')
        return City.objects.filter(
            region_id=region_id
        ).select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        ).order_by('name')


class CitySearchView(generics.ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        country_code = self.request.query_params.get('country')
        try:
            limit = int(self.request.query_params.get('limit', 10))
        except ValueError:
            limit = 10

        queryset = City.objects.all()
        if query:
            queryset = queryset.filter(name__icontains=query)
        if country_code:
            queryset = queryset.filter(country__iso_code__iexact=country_code)

        return queryset.select_related('country', 'region').only(
            'id', 'name', 'name_ascii', 'country', 'region',
            'timezone', 'population', 'elevation', 'geometry'
        )[:limit]
