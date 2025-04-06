from django.contrib.gis.db import models as gis_models
from django.db import models
from apps.core_apps.general import BaseModel

class Country(BaseModel):
    """Country model with geographic data"""
    name = models.CharField(max_length=100, db_index=True)
    iso_code = models.CharField(max_length=6, null=True, blank=True, db_index=True)
    iso3_code = models.CharField(max_length=6, null=True, blank=True, db_index=True)
    phone_code = models.CharField(max_length=10, null=True, blank=True)
    capital = models.CharField(max_length=100, null=True, blank=True)
    currency = models.CharField(max_length=3, null=True, blank=True)
    languages = models.JSONField(default=list, blank=True)
    geometry = gis_models.MultiPolygonField(null=True, blank=True, srid=4326)
    centroid = gis_models.PointField(null=True, blank=True, srid=4326)
    bounding_box = gis_models.PolygonField(null=True, blank=True, srid=4326)

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['iso_code']),
            models.Index(fields=['iso3_code']),
            gis_models.Index(fields=['geometry']),
            gis_models.Index(fields=['centroid']),
        ]

    def __str__(self):
        return self.name

class Region(BaseModel):
    """First-level administrative division (state/province)"""
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='regions')
    name = models.CharField(max_length=100, db_index=True)
    code = models.CharField(max_length=10, null=True, blank=True, db_index=True)
    admin_level = models.PositiveSmallIntegerField(default=1)
    geometry = gis_models.MultiPolygonField(null=True, blank=True, srid=4326)
    centroid = gis_models.PointField(null=True, blank=True, srid=4326)
    bounding_box = gis_models.PolygonField(null=True, blank=True, srid=4326)

    class Meta:
        verbose_name_plural = "Regions"
        unique_together = ('country', 'name')
        ordering = ['country', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['code']),
            models.Index(fields=['country']),
            models.Index(fields=['admin_level']),
            gis_models.Index(fields=['geometry']),
            gis_models.Index(fields=['centroid']),
            models.Index(fields=['country', 'name']),
        ]

    def __str__(self):
        return f"{self.name}, {self.country}"

class City(BaseModel):
    """City model with geographic data"""
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='cities')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='cities')
    name = models.CharField(max_length=255, db_index=True)
    name_ascii = models.CharField(max_length=255, db_index=True, blank=True)
    timezone = models.CharField(max_length=40, null=True, blank=True)
    population = models.PositiveIntegerField(null=True, blank=True)
    elevation = models.IntegerField(null=True, blank=True)
    feature_code = models.CharField(max_length=10, null=True, blank=True)
    geometry = gis_models.PointField(srid=4326)
    bounding_box = gis_models.PolygonField(null=True, blank=True, srid=4326)

    class Meta:
        verbose_name_plural = "Cities"
        unique_together = ('country', 'region', 'name')
        ordering = ['country', 'region', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['name_ascii']),
            models.Index(fields=['country']),
            models.Index(fields=['region']),
            models.Index(fields=['population']),
            models.Index(fields=['feature_code']),
            gis_models.Index(fields=['geometry']),
            models.Index(fields=['country', 'region', 'name']),
            models.Index(fields=['country', 'population']),
        ]

    def __str__(self):
        if self.region:
            return f"{self.name}, {self.region}, {self.country}"
        return f"{self.name}, {self.country}"