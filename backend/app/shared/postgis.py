"""
PostGIS Support for SQLAlchemy
"""
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import UserDefinedType
from geoalchemy2 import Geography, Geometry
from geoalchemy2.types import Geometry as GeoGeometry


class GeographyPoint(Geography):
    """PostGIS Geography Point type"""
    def __init__(self):
        super().__init__(geometry_type='POINT', srid=4326)


def create_geography_point_column(**kwargs):
    """Helper function to create a Geography Point column"""
    return Column(Geography('POINT', srid=4326), **kwargs)

