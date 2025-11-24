"""
Message Repository
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.modules.messages.models import Message, Conversation
from app.core.id import ID


class IMessageRepository:
    """Message repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[Message]:
        """Get message by ID"""
        pass
    
    async def get_by_conversation(
        self,
        conversation_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        """Get messages by conversation"""
        pass
    
    async def create(self, message: Message) -> Message:
        """Create new message"""
        pass


class IConversationRepository:
    """Conversation repository interface"""
    
    async def get_by_id(self, id: ID) -> Optional[Conversation]:
        """Get conversation by ID"""
        pass
    
    async def get_by_participants(
        self,
        participant_ids: List[ID]
    ) -> Optional[Conversation]:
        """Get conversation by participants"""
        pass
    
    async def get_user_conversations(
        self,
        user_id: ID
    ) -> List[Conversation]:
        """Get all conversations for user"""
        pass
    
    async def create(self, conversation: Conversation) -> Conversation:
        """Create new conversation"""
        pass


class MessageRepository(BaseRepository, IMessageRepository):
    """Message repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, Message, Message)
    
    async def get_by_conversation(
        self,
        conversation_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        """Get messages by conversation"""
        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        ).offset(skip).limit(limit).order_by(Message.created_at.desc())
        
        result = await self.db.execute(query)
        return result.scalars().all()


class ConversationRepository(BaseRepository, IConversationRepository):
    """Conversation repository implementation"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, Conversation, Conversation)
    
    async def get_by_participants(
        self,
        participant_ids: List[ID]
    ) -> Optional[Conversation]:
        """Get conversation by participants"""
        from app.modules.messages.models import conversation_participants
        
        # This is a simplified version - in production, you'd need proper join logic
        query = select(Conversation).join(conversation_participants).where(
            conversation_participants.c.user_id.in_(participant_ids)
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_conversations(
        self,
        user_id: ID
    ) -> List[Conversation]:
        """Get all conversations for user"""
        from app.modules.messages.models import conversation_participants
        
        query = select(Conversation).join(conversation_participants).where(
            conversation_participants.c.user_id == user_id
        ).options(
            selectinload(Conversation.participants),
            selectinload(Conversation.messages)
        )
        
        result = await self.db.execute(query)
        return result.scalars().unique().all()

