"""
File routes.
"""
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.files.models import FileCategory
from app.modules.files.schemas import FileResponse, FileUploadResponse
from app.modules.files.services import save_file

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    category: FileCategory = FileCategory.OTHER,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a single file and return its metadata."""
    file_record = await save_file(file, category, current_user.id, db)
    
    return {
        "message": "File uploaded successfully",
        "file": file_record
    }


@router.post("/upload-multiple", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    category: FileCategory = FileCategory.OTHER,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple files in a single request and return their metadata."""
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files allowed per request"
        )
    
    uploaded_files = []
    for file in files:
        file_record = await save_file(file, category, current_user.id, db)
        uploaded_files.append(file_record)
    
    return {
        "message": f"Successfully uploaded {len(uploaded_files)} files",
        "files": uploaded_files
    }

