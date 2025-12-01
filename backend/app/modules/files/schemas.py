"""
File schemas.
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.modules.files.models import FileType, FileCategory


class FileResponse(BaseModel):
    """File response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    filename: str
    original_filename: str
    file_url: str
    file_type: FileType
    file_category: FileCategory
    mime_type: str
    file_size: int
    uploaded_by: int
    description: Optional[str] = None
    created_at: str


class FileUploadResponse(BaseModel):
    """File upload response schema."""
    message: str
    file: FileResponse

