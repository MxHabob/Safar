"""
خدمة MinIO للتخزين - MinIO Storage Service
"""
import io
from typing import Optional, BinaryIO
from pathlib import Path
import logging
from urllib.parse import urljoin

from minio import Minio
from minio.error import S3Error
from minio.commonconfig import REPLACE
from minio.deleteobjects import DeleteObject

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MinIOStorageService:
    """خدمة تخزين الملفات باستخدام MinIO - MinIO file storage service"""
    
    def __init__(self):
        """تهيئة عميل MinIO - Initialize MinIO client"""
        self.client = Minio(
            f"{settings.MINIO_ENDPOINT}:{settings.MINIO_PORT}",
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """التأكد من وجود الـ bucket - Ensure bucket exists"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
            else:
                logger.info(f"MinIO bucket already exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    def upload_file(
        self,
        file_data: bytes,
        object_name: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> str:
        """
        رفع ملف إلى MinIO - Upload file to MinIO
        
        Args:
            file_data: محتوى الملف - File content as bytes
            object_name: اسم الملف في MinIO - Object name in MinIO
            content_type: نوع المحتوى - Content type (MIME type)
            metadata: بيانات إضافية - Additional metadata
        
        Returns:
            رابط الملف - File URL
        """
        try:
            # Convert bytes to file-like object
            file_obj = io.BytesIO(file_data)
            
            # Upload file
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_obj,
                length=len(file_data),
                content_type=content_type or "application/octet-stream",
                metadata=metadata or {}
            )
            
            # Generate file URL
            file_url = self.get_file_url(object_name)
            logger.info(f"File uploaded successfully: {object_name}")
            return file_url
            
        except S3Error as e:
            logger.error(f"Error uploading file to MinIO: {e}")
            raise
    
    def download_file(self, object_name: str) -> bytes:
        """
        تحميل ملف من MinIO - Download file from MinIO
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
        
        Returns:
            محتوى الملف - File content as bytes
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            file_data = response.read()
            response.close()
            response.release_conn()
            return file_data
        except S3Error as e:
            logger.error(f"Error downloading file from MinIO: {e}")
            raise
    
    def delete_file(self, object_name: str) -> bool:
        """
        حذف ملف من MinIO - Delete file from MinIO
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
        
        Returns:
            True إذا تم الحذف بنجاح - True if deleted successfully
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            logger.info(f"File deleted successfully: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file from MinIO: {e}")
            return False
    
    def delete_files(self, object_names: list[str]) -> list[str]:
        """
        حذف عدة ملفات - Delete multiple files
        
        Args:
            object_names: قائمة أسماء الملفات - List of object names
        
        Returns:
            قائمة الملفات المحذوفة - List of deleted files
        """
        try:
            delete_objects = [DeleteObject(name) for name in object_names]
            errors = self.client.remove_objects(
                bucket_name=self.bucket_name,
                delete_object_list=delete_objects
            )
            
            # Collect error object names
            error_names = set()
            for error in errors:
                if error:
                    error_names.add(error.object_name)
                    logger.error(f"Error deleting {error.object_name}: {error}")
            
            # Return successfully deleted files (those not in error_names)
            deleted = [name for name in object_names if name not in error_names]
            logger.info(f"Successfully deleted {len(deleted)} files")
            return deleted
        except S3Error as e:
            logger.error(f"Error deleting files from MinIO: {e}")
            return []
    
    def file_exists(self, object_name: str) -> bool:
        """
        التحقق من وجود ملف - Check if file exists
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
        
        Returns:
            True إذا كان الملف موجوداً - True if file exists
        """
        try:
            self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            return True
        except S3Error:
            return False
    
    def get_file_url(self, object_name: str) -> str:
        """
        الحصول على رابط الملف - Get file URL
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
        
        Returns:
            رابط الملف - File URL
        """
        base_url = settings.MINIO_URL
        return urljoin(base_url, f"{self.bucket_name}/{object_name}")
    
    def get_presigned_url(self, object_name: str, expires_seconds: int = 3600) -> str:
        """
        الحصول على رابط مؤقت للملف - Get presigned URL for file
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
            expires_seconds: مدة صلاحية الرابط بالثواني - URL expiration in seconds
        
        Returns:
            رابط مؤقت - Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=expires_seconds
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def get_file_info(self, object_name: str) -> dict:
        """
        الحصول على معلومات الملف - Get file information
        
        Args:
            object_name: اسم الملف في MinIO - Object name in MinIO
        
        Returns:
            معلومات الملف - File information
        """
        try:
            stat = self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            return {
                "size": stat.size,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
                "metadata": stat.metadata
            }
        except S3Error as e:
            logger.error(f"Error getting file info: {e}")
            raise


# Singleton instance
_minio_service: Optional[MinIOStorageService] = None


def get_minio_service() -> MinIOStorageService:
    """الحصول على خدمة MinIO - Get MinIO service instance"""
    global _minio_service
    if _minio_service is None:
        _minio_service = MinIOStorageService()
    return _minio_service

