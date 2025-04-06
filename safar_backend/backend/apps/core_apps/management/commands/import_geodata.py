import os
import requests
import zipfile
import tempfile
import time
from django.core.management.base import BaseCommand
from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon, Polygon, GEOSGeometry
from django.db import transaction
from apps.geographic_data.models import Country, Region, City


class Command(BaseCommand):
    help = 'Import geographic data from Natural Earth or other sources'
    
    # Updated download URLs with more reliable sources
    NATURAL_EARTH_SOURCES = [
        {
            'name': 'Natural Earth Latest',
            'base_url': 'https://naciscdn.org/naturalearth',
            'paths': {
                'countries': '110m/cultural/ne_110m_admin_0_countries.zip',
                'regions': '10m/cultural/ne_10m_admin_1_states_provinces.zip',
                'cities': '10m/cultural/ne_10m_populated_places.zip'
            }
        },
        {
            'name': 'Natural Earth AWS Mirror',
            'base_url': 'https://naturalearth.s3.amazonaws.com',
            'paths': {
                'countries': '110m_cultural/ne_110m_admin_0_countries.zip',
                'regions': '10m_cultural/ne_10m_admin_1_states_provinces.zip',
                'cities': '10m_cultural/ne_10m_populated_places.zip'
            }
        },
        {
            'name': 'Natural Earth GitHub (legacy)',
            'base_url': 'https://github.com/nvkelso/natural-earth-vector/raw/master',
            'paths': {
                'countries': '110m_cultural/ne_110m_admin_0_countries.zip',
                'regions': '10m_cultural/ne_10m_admin_1_states_provinces.zip',
                'cities': '10m_cultural/ne_10m_populated_places.zip'
            }
        }
    ]
    
    # Download settings
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # seconds
    REQUEST_TIMEOUT = 30  # seconds

    def handle(self, *args, **options):
        self.stdout.write("Starting geographic data import...")
        try:
            self.import_countries()
            self.import_regions()
            self.import_cities()
            self.stdout.write(self.style.SUCCESS("Successfully imported geographic data"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Import failed: {str(e)}"))
            raise

    def download_file(self, file_type):
        """Download a file with retry logic using multiple sources."""
        errors = []
        
        for source in self.NATURAL_EARTH_SOURCES:
            url = f"{source['base_url']}/{source['paths'][file_type]}"
            for attempt in range(self.MAX_RETRIES):
                try:
                    local_filename = os.path.join(tempfile.gettempdir(), url.split('/')[-1])
                    self.stdout.write(f"Attempt {attempt + 1} to download {file_type} from {source['name']} ({url})")
                    
                    # Skip if we've already downloaded this file
                    if os.path.exists(local_filename):
                        self.stdout.write(f"Using cached file: {local_filename}")
                        return local_filename
                    
                    with requests.get(url, stream=True, timeout=self.REQUEST_TIMEOUT) as r:
                        r.raise_for_status()
                        total_size = int(r.headers.get('content-length', 0))
                        downloaded = 0
                        
                        with open(local_filename, 'wb') as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                downloaded += len(chunk)
                                f.write(chunk)
                                if total_size > 0:
                                    progress = (downloaded / total_size) * 100
                                    self.stdout.write(f"\rDownload progress: {progress:.1f}%", ending='')
                    
                    self.stdout.write("")  # New line after progress
                    return local_filename
                except requests.exceptions.RequestException as e:
                    errors.append(f"{source['name']}: {str(e)}")
                    if attempt < self.MAX_RETRIES - 1:
                        time.sleep(self.RETRY_DELAY)
                    continue
        
        # If all attempts fail, try to use a local fallback if available
        local_fallback = os.path.join(os.path.dirname(__file__), 'data', f"ne_10m_populated_places.zip")
        if file_type == 'cities' and os.path.exists(local_fallback):
            self.stdout.write(self.style.WARNING("Using local fallback data for cities"))
            return local_fallback
        
        raise Exception(f"All download attempts failed for {file_type}. Errors: {', '.join(errors)}")

    def extract_shapefile(self, zip_path):
        extract_dir = tempfile.mkdtemp()
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith('.shp'):
                    return os.path.join(root, file)
        return None

    def import_countries(self):
        self.stdout.write("Starting countries import...")
        try:
            zip_path = self.download_file('countries')
            shp_path = self.extract_shapefile(zip_path)
            if not shp_path:
                raise Exception("Could not find shapefile in downloaded archive")

            country_mapping = {
                'name': 'NAME',
                'iso_code': 'ISO_A2',
                'iso3_code': 'ISO_A3',
                'geometry': 'MULTIPOLYGON',
            }

            lm = LayerMapping(
                Country,
                shp_path,
                country_mapping,
                transform=False,
                encoding='utf-8',
            )

            with transaction.atomic():
                lm.save(strict=True, verbose=True)
                self.stdout.write(f"Imported {Country.objects.count()} countries")

                self.stdout.write("Calculating centroids and bounding boxes...")
                for country in Country.objects.all():
                    if country.geometry:
                        country.centroid = country.geometry.centroid
                        country.bounding_box = country.geometry.envelope
                        country.save(update_fields=['centroid', 'bounding_box'])
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to import countries: {str(e)}"))
            raise

    def get_single_country(self, iso_code):
        """Returns one Country safely even if duplicates exist."""
        countries = Country.objects.filter(iso_code=iso_code)
        if countries.count() == 1:
            return countries.first()
        elif countries.exists():
            self.stderr.write(self.style.WARNING(f"Multiple countries found for ISO code {iso_code}. Using first."))
            return countries.first()
        return None

    def import_regions(self):
        self.stdout.write("Starting regions import...")
        try:
            zip_path = self.download_file('regions')
            shp_path = self.extract_shapefile(zip_path)
            if not shp_path:
                raise Exception("Could not find shapefile in downloaded archive")

            ds = DataSource(shp_path)
            layer = ds[0]

            with transaction.atomic():
                for feat in layer:
                    iso_code = feat.get('iso_a2')
                    if not iso_code or iso_code == '-99':
                        continue

                    country = self.get_single_country(iso_code)
                    if not country:
                        continue

                    name = feat.get('name')
                    if not name:
                        continue

                    code = feat.get('iso_3166_2') or feat.get('postal')
                    geom = GEOSGeometry(feat.geom.wkt)

                    if geom.geom_type == 'Polygon':
                        geom = MultiPolygon(geom)
                    elif geom.geom_type != 'MultiPolygon':
                        continue

                    region, created = Region.objects.update_or_create(
                        country=country,
                        name=name,
                        defaults={
                            'code': code,
                            'admin_level': 1,
                            'geometry': geom,
                            'centroid': geom.centroid,
                            'bounding_box': geom.envelope,
                        }
                    )

                    if not created:
                        region.code = code
                        region.admin_level = 1
                        region.geometry = geom
                        region.centroid = geom.centroid
                        region.bounding_box = geom.envelope
                        region.save()

                self.stdout.write(f"Imported {Region.objects.count()} regions")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to import regions: {str(e)}"))
            raise


    def import_cities(self):
        self.stdout.write("Starting cities import...")
        try:
            zip_path = self.download_file('cities')
            shp_path = self.extract_shapefile(zip_path)
            if not shp_path:
                raise Exception("Could not find shapefile in downloaded archive")        

            ds = DataSource(shp_path)
            layer = ds[0]        

            with transaction.atomic():
                for feat in layer:
                    iso_code = feat.get('ISO_A2')
                    if not iso_code or iso_code == '-99':
                        continue        

                    country = self.get_single_country(iso_code)
                    if not country:
                        continue        

                    region_name = feat.get('ADM1NAME')
                    region = Region.objects.filter(country=country, name=region_name).first() if region_name else None        

                    name = feat.get('NAME')
                    name_ascii = feat.get('NAMEASCII') or ''
                    population = feat.get('POP_MAX')        

                    try:
                        population = int(population) if population and int(population) > 0 else None
                    except (ValueError, TypeError):
                        population = None        

                    try:
                        geom = GEOSGeometry(feat.geom.wkt)
                        if geom.geom_type != 'Point':
                            continue
                    except Exception as e:
                        self.stderr.write(f"Invalid geometry for city {name}: {e}")
                        continue        

                    # Handle potentially long fields
                    timezone = (feat.get('TIMEZONE') or '')[:50]
                    elevation = feat.get('ELEVATION') if 'ELEVATION' in feat else None
                    feature_code = (feat.get('FEATURECLA') or '')[:10]    

                    defaults = {
                        'name_ascii': name_ascii[:100],
                        'population': population,
                        'timezone': timezone,
                        'elevation': elevation,
                        'feature_code': feature_code,
                        'geometry': geom,
                    }    

                    if geom:
                        defaults['bounding_box'] = geom.buffer(0.1).envelope    

                    try:
                        City.objects.update_or_create(
                            country=country,
                            region=region,
                            name=name[:100],
                            defaults=defaults
                        )
                    except Exception as e:
                        self.stderr.write(f"Failed to save city {name}: {str(e)}")
                        continue        

                self.stdout.write(f"Imported/updated {City.objects.count()} cities")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to import cities: {str(e)}"))
            raise