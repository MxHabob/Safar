"""
User Repository
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.domain.entities.user import UserEntity
from app.modules.users.models import User
from app.core.id import ID


class IUserRepository:
    """User repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[UserEntity]:
        """Get user by ID"""
        pass
    
    async def get_by_email(self, email: str) -> Optional[UserEntity]:
        """Get user by email"""
        pass
    
    async def get_by_username(self, username: str) -> Optional[UserEntity]:
        """Get user by username"""
        pass
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[UserEntity]:
        """Get all users"""
        pass
    
    async def create(self, entity: UserEntity) -> UserEntity:
        """Create new user"""
        pass
    
    async def update(self, entity: UserEntity) -> UserEntity:
        """Update user"""
        pass
    
    async def delete(self, id: ID) -> bool:
        """Delete user"""
        pass


class UserRepository(BaseRepository[UserEntity], IUserRepository):
    """User repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, User, UserEntity)
    
    def _model_to_entity(self, model) -> Optional[UserEntity]:
        """Convert SQLAlchemy model to domain entity"""
        if not model:
            return None
        
        return UserEntity(
            id=model.id,
            email=model.email,
            phone_number=model.phone_number,
            username=model.username,
            first_name=model.first_name,
            last_name=model.last_name,
            full_name=model.full_name,
            avatar_url=model.avatar_url,
            bio=model.bio,
            role=model.role.value if hasattr(model.role, 'value') else str(model.role),
            roles=model.roles or [],
            status=model.status.value if hasattr(model.status, 'value') else str(model.status),
            is_active=model.is_active,
            is_email_verified=model.is_email_verified,
            is_phone_verified=model.is_phone_verified,
            language=model.language,
            locale=model.locale,
            currency=model.currency,
            country=model.country,
            city=model.city,
            agency_id=model.agency_id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def get_by_email(self, email: str) -> Optional[UserEntity]:
        """Get user by email"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        model = result.scalar_one_or_none()
        return self._model_to_entity(model) if model else None
    
    async def get_by_username(self, username: str) -> Optional[UserEntity]:
        """Get user by username"""
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        model = result.scalar_one_or_none()
        return self._model_to_entity(model) if model else None
    
    async def create(self, entity: UserEntity) -> UserEntity:
        """Create new user"""
        from app.modules.users.models import UserRole, UserStatus
        
        model = User(
            id=entity.id,
            email=entity.email,
            phone_number=entity.phone_number,
            username=entity.username,
            first_name=entity.first_name,
            last_name=entity.last_name,
            full_name=entity.full_name,
            avatar_url=entity.avatar_url,
            bio=entity.bio,
            role=UserRole(entity.role) if entity.role else UserRole.GUEST,
            roles=entity.roles,
            status=UserStatus(entity.status) if entity.status else UserStatus.PENDING_VERIFICATION,
            is_active=entity.is_active,
            is_email_verified=entity.is_email_verified,
            is_phone_verified=entity.is_phone_verified,
            language=entity.language,
            locale=entity.locale,
            currency=entity.currency,
            country=entity.country,
            city=entity.city,
            agency_id=entity.agency_id
        )
        
        self.db.add(model)
        await self.db.flush()  # Flush to get ID, but don't commit (UnitOfWork manages commits)
        await self.db.refresh(model)
        return self._model_to_entity(model)

