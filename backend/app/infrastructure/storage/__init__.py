"""Storage module"""
from app.infrastructure.storage.minio_service import (
    MinIOStorageService,
    get_minio_service
)

__all__ = [
    "MinIOStorageService",
    "get_minio_service"
]

