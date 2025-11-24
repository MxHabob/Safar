"""
Dependencies for FastAPI
"""
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.unit_of_work import UnitOfWork, IUnitOfWork
from app.modules.users.models import User


async def get_unit_of_work(
    db: AsyncSession = Depends(get_db)
) -> AsyncGenerator[IUnitOfWork, None]:
    """
    Dependency للحصول على Unit of Work
    Unit of Work dependency for FastAPI
    """
    async with UnitOfWork(db) as uow:
        yield uow
