import uuid
from django.contrib.gis.db import models as gis_models
from django.db import models
from apps.core_apps.general import BaseModel

PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv']

def upload_file(instance, filename):
    file_uuid = uuid.uuid4().hex
    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    if extension not in PHOTO_EXTENSIONS + VIDEO_EXTENSIONS:
        raise ValueError(f"Unsupported file type. Allowed: {PHOTO_EXTENSIONS + VIDEO_EXTENSIONS}")
    media_type = 'photos' if extension in PHOTO_EXTENSIONS else 'videos'
    return f'{media_type}/{file_uuid}.{extension}'


class Media(BaseModel):
    FILE_TYPE_CHOICES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
    ]
    url = models.URLField(verbose_name="Media URL", blank=True, null=True)
    file = models.FileField( upload_to=upload_file, null=True, blank=True, validators=[FileExtensionValidator( allowed_extensions=PHOTO_EXTENSIONS + VIDEO_EXTENSIONS)])
    type = models.CharField( max_length=10, choices=FILE_TYPE_CHOICES, verbose_name="Media Type", default='photo')
    uploaded_by = models.ForeignKey( User, on_delete=models.CASCADE, related_name="uploaded_media", verbose_name="Uploaded By")
    
    def save(self, *args, **kwargs):
        if self.file:
            extension = self.file.name.split('.')[-1].lower()
            if extension in PHOTO_EXTENSIONS:
                self.type = 'photo'
            elif extension in VIDEO_EXTENSIONS:
                self.type = 'video'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.file.name if self.file else self.url}"
    
    class Meta:
        verbose_name = "Media"
        verbose_name_plural = "Media"
        indexes = [
            models.Index(fields=["url", "file"]),
            models.Index(fields=["type"]),
        ]

class Country(BaseModel):
    """Country model with geographic data"""
    name = models.CharField(max_length=100, db_index=True)
    iso_code = models.CharField(max_length=6, null=True, blank=True, db_index=True)
    iso3_code = models.CharField(max_length=6, null=True, blank=True, db_index=True)
    phone_code = models.CharField(max_length=10, null=True, blank=True)
    media = models.ManyToManyField(Media, blank=True, related_name="country", verbose_name="Media")
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
    media = models.ManyToManyField(Media, blank=True, related_name="region", verbose_name="Media")
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
    media = models.ManyToManyField(Media, blank=True, related_name="city", verbose_name="Media")
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