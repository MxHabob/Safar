"""
File schemas.
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.modules.files.models import FileType, FileCategory
from app.core.id import ID


class FileResponse(BaseModel):
    """File response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ID
    filename: str
    original_filename: str
    file_url: str
    file_type: FileType
    file_category: FileCategory
    mime_type: str
    file_size: int
    uploaded_by: ID
    description: Optional[str] = None
    created_at: str


class FileUploadResponse(BaseModel):
    """File upload response schema."""
    message: str
    file: FileResponse

