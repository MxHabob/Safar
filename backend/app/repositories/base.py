"""
Base Repository Interface
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.base import DomainEntity
from app.core.id import ID

T = TypeVar('T', bound=DomainEntity)


class IRepository(ABC, Generic[T]):
    """Base repository interface"""
    
    @abstractmethod
    async def get_by_id(self, id: ID) -> Optional[T]:
        """Get entity by ID"""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all entities"""
        pass
    
    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create new entity"""
        pass
    
    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update entity"""
        pass
    
    @abstractmethod
    async def delete(self, id: ID) -> bool:
        """Delete entity by ID"""
        pass
    
    @abstractmethod
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count entities with optional filters"""
        pass


class BaseRepository(IRepository[T]):
    """Base repository implementation"""
    
    def __init__(self, db: AsyncSession, model_class, entity_class):
        self.db = db
        self.model_class = model_class
        self.entity_class = entity_class
    
    def _model_to_entity(self, model) -> T:
        """Convert SQLAlchemy model to domain entity"""
        if not model:
            return None
        
        data = {}
        for column in model.__table__.columns:
            value = getattr(model, column.name, None)
            if value is not None:
                data[column.name] = value
        
        return self.entity_class(**data)
    
    def _entity_to_model(self, entity: T):
        """Convert domain entity to SQLAlchemy model"""
        data = {}
        for key, value in entity.__dict__.items():
            if not key.startswith('_') and value is not None:
                data[key] = value
        
        return self.model_class(**data)
    
    async def get_by_id(self, id: ID) -> Optional[T]:
        """Get entity by ID"""
        from sqlalchemy import select
        result = await self.db.execute(
            select(self.model_class).where(self.model_class.id == id)
        )
        model = result.scalar_one_or_none()
        return self._model_to_entity(model) if model else None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all entities"""
        from sqlalchemy import select
        result = await self.db.execute(
            select(self.model_class).offset(skip).limit(limit)
        )
        models = result.scalars().all()
        return [self._model_to_entity(model) for model in models]
    
    async def create(self, entity: T) -> T:
        """Create new entity"""
        model = self._entity_to_model(entity)
        self.db.add(model)
        await self.db.commit()
        await self.db.refresh(model)
        return self._model_to_entity(model)
    
    async def update(self, entity: T) -> T:
        """Update entity"""
        from sqlalchemy import select
        result = await self.db.execute(
            select(self.model_class).where(self.model_class.id == entity.id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise ValueError(f"Entity with id {entity.id} not found")
        
        # Update model fields from entity
        for key, value in entity.__dict__.items():
            if not key.startswith('_') and hasattr(model, key):
                setattr(model, key, value)
        
        await self.db.commit()
        await self.db.refresh(model)
        return self._model_to_entity(model)
    
    async def delete(self, id: ID) -> bool:
        """Delete entity by ID"""
        from sqlalchemy import select
        result = await self.db.execute(
            select(self.model_class).where(self.model_class.id == id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return False
        
        await self.db.delete(model)
        await self.db.commit()
        return True
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count entities with optional filters"""
        from sqlalchemy import select, func
        query = select(func.count()).select_from(self.model_class)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model_class, key):
                    query = query.where(getattr(self.model_class, key) == value)
        
        result = await self.db.execute(query)
        return result.scalar() or 0

