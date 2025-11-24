"""
نماذج الملفات - File Models
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.shared.base import BaseModel


class FileType(str, enum.Enum):
    """أنواع الملفات - File types"""
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"
    AUDIO = "audio"
    OTHER = "other"


class FileCategory(str, enum.Enum):
    """فئات الملفات - File categories"""
    AVATAR = "avatar"
    LISTING_PHOTO = "listing_photo"
    PROPERTY_PHOTO = "property_photo"  # Legacy alias
    DOCUMENT = "document"
    IDENTIFICATION = "identification"
    OTHER = "other"


class File(BaseModel):
    """
    جدول الملفات
    Files table
    """
    __tablename__ = "files"
    
    # File Info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False, index=True)
    file_category = Column(SQLEnum(FileCategory), nullable=False, index=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    
    # Owner
    uploaded_by = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string
    
    # Relationships
    uploader = relationship("User", lazy="selectin")

