"""
خدمات الملفات - File Services
"""
import os
import secrets
import logging
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.files.models import File, FileType, FileCategory

logger = logging.getLogger(__name__)

# Try to import magic for file content validation
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False

settings = get_settings()

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", 
    "image/webp", "image/svg+xml"
}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"
}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"
}

ALLOWED_MIME_TYPES = (
    ALLOWED_IMAGE_TYPES | 
    ALLOWED_DOCUMENT_TYPES | 
    ALLOWED_VIDEO_TYPES | 
    ALLOWED_AUDIO_TYPES
)

# File size limits (in bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB


def get_file_type_from_mime(mime_type: str) -> FileType:
    """تحديد نوع الملف من MIME type - Determine file type from MIME"""
    if mime_type in ALLOWED_IMAGE_TYPES:
        return FileType.IMAGE
    elif mime_type in ALLOWED_DOCUMENT_TYPES:
        return FileType.DOCUMENT
    elif mime_type in ALLOWED_VIDEO_TYPES:
        return FileType.VIDEO
    elif mime_type in ALLOWED_AUDIO_TYPES:
        return FileType.AUDIO
    return FileType.OTHER


def validate_file_type(file: UploadFile) -> Tuple[bool, Optional[str]]:
    """
    التحقق من نوع الملف - Validate file type
    Returns: (is_valid, error_message)
    """
    if not file.content_type:
        return False, "File content type is missing"
    
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"File type {file.content_type} is not allowed"
    
    return True, None


def validate_file_size(file: UploadFile, file_type: FileType) -> Tuple[bool, Optional[str]]:
    """
    التحقق من حجم الملف - Validate file size
    """
    # Get file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    max_size = {
        FileType.IMAGE: MAX_IMAGE_SIZE,
        FileType.DOCUMENT: MAX_DOCUMENT_SIZE,
        FileType.VIDEO: MAX_VIDEO_SIZE,
        FileType.AUDIO: MAX_AUDIO_SIZE,
        FileType.OTHER: settings.max_upload_size
    }.get(file_type, settings.max_upload_size)
    
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum allowed size of {max_mb}MB"
    
    return True, None


async def validate_file_content(file: UploadFile) -> Tuple[bool, Optional[str]]:
    """
    التحقق من محتوى الملف باستخدام magic - Validate file content
    """
    if not MAGIC_AVAILABLE:
        # Skip content validation if magic is not available
        return True, None
    
    try:
        # Read first chunk for magic number detection
        content = await file.read(1024)
        await file.seek(0)  # Reset
        
        # Use python-magic to detect actual file type
        mime = magic.Magic(mime=True)
        detected_mime = mime.from_buffer(content)
        
        # Verify detected MIME matches declared MIME
        if file.content_type and detected_mime != file.content_type:
            # Allow some flexibility for similar types
            if not (detected_mime.startswith(file.content_type.split('/')[0])):
                return False, f"File content does not match declared type. Detected: {detected_mime}"
        
        return True, None
    except Exception:
        # If magic fails, skip content validation
        return True, None


def generate_unique_filename(original_filename: str) -> str:
    """إنشاء اسم ملف فريد - Generate unique filename"""
    ext = Path(original_filename).suffix
    unique_id = secrets.token_urlsafe(16)
    return f"{unique_id}{ext}"


async def save_file(
    file: UploadFile,
    category: FileCategory,
    user_id: int,
    db: AsyncSession
) -> File:
    """
    حفظ الملف - Save file
    """
    # Validate file type
    is_valid, error = validate_file_type(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Determine file type
    file_type = get_file_type_from_mime(file.content_type)
    
    # Validate file size
    is_valid, error = validate_file_size(file, file_type)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Validate file content
    is_valid, error = await validate_file_content(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Determine storage path based on category
    if settings.storage_type == "local":
        # Local storage
        category_path = category.value
        upload_dir = Path("uploads") / category_path
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / unique_filename
        file_url = f"/uploads/{category_path}/{unique_filename}"
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
    
    elif settings.storage_type == "minio":
        # MinIO storage
        from app.infrastructure.storage.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        category_path = category.value
        object_name = f"{category_path}/{unique_filename}"
        
        # Upload to MinIO
        file_url = minio_service.upload_file(
            file_data=content,
            object_name=object_name,
            content_type=file.content_type,
            metadata={
                "original_filename": file.filename,
                "category": category.value,
                "file_type": file_type.value
            }
        )
        file_path = object_name  # Store object name as path
    
    elif settings.storage_type == "s3":
        # S3 storage (to be implemented)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="S3 storage not yet implemented"
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Storage type {settings.storage_type} is not supported"
        )
    
    # Create file record
    file_record = File(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_url=file_url,
        file_type=file_type,
        file_category=category,
        mime_type=file.content_type,
        file_size=file_size,
        uploaded_by=user_id
    )
    
    db.add(file_record)
    await db.commit()
    await db.refresh(file_record)
    
    return file_record


async def delete_file(
    file_record: File,
    db: AsyncSession
) -> bool:
    """
    حذف ملف - Delete file
    """
    from app.core.config import get_settings
    settings = get_settings()
    
    try:
        # Delete from storage
        if settings.storage_type == "local":
            # Delete local file
            file_path = Path(file_record.file_path)
            if file_path.exists():
                file_path.unlink()
        
        elif settings.storage_type == "minio":
            # Delete from MinIO
            from app.infrastructure.storage.minio_service import get_minio_service
            minio_service = get_minio_service()
            minio_service.delete_file(file_record.file_path)  # file_path contains object_name for MinIO
        
        elif settings.storage_type == "s3":
            # S3 deletion (to be implemented)
            pass
        
        # Delete database record
        await db.delete(file_record)
        await db.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        await db.rollback()
        return False

