"""
Message and conversation services.
Enhanced with the Conversation model.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.messages.models import Message, Conversation
from app.modules.messages.schemas import MessageCreate, ConversationCreate
from app.modules.users.models import User


class MessageService:
    """Service layer for working with messages and conversations."""
    
    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession,
        participant_ids: List[int],
        listing_id: Optional[int] = None,
        booking_id: Optional[int] = None
    ) -> Conversation:
        """Get an existing conversation for the given participants or create a new one."""
        # Check if conversation exists
        from app.modules.messages.models import conversation_participants
        
        # Find conversation with exact participants
        result = await db.execute(
            select(Conversation)
            .join(conversation_participants)
            .where(conversation_participants.c.user_id.in_(participant_ids))
            .group_by(Conversation.id)
            .having(func.count(conversation_participants.c.user_id) == len(participant_ids))
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            # Create new conversation
            conversation = Conversation(
                listing_id=listing_id,
                booking_id=booking_id
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
            
            # Add participants
            for user_id in participant_ids:
                await db.execute(
                    conversation_participants.insert().values(
                        conversation_id=conversation.id,
                        user_id=user_id
                    )
                )
            await db.commit()
        
        return conversation
    
    @staticmethod
    async def create_message(
        db: AsyncSession,
        message_data: MessageCreate,
        sender_id: int
    ) -> Message:
        """Create a new message within a conversation or direct thread."""
        conversation_id = message_data.conversation_id
        
        # If conversation_id not provided, get or create one
        if not conversation_id and message_data.receiver_id:
            conversation = await MessageService.get_or_create_conversation(
                db,
                [sender_id, message_data.receiver_id],
                message_data.listing_id,
                message_data.booking_id
            )
            conversation_id = conversation.id
        
        # Determine source
        source = "guest"  # Default
        if message_data.listing_id:
            # Check if sender is host
            from app.modules.listings.models import Listing
            listing_result = await db.execute(
                select(Listing).where(Listing.id == message_data.listing_id)
            )
            listing = listing_result.scalar_one_or_none()
            if listing and listing.host_id == sender_id:
                source = "host"
        
        # Create message
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id if not conversation_id else sender_id,
            receiver_id=message_data.receiver_id if not conversation_id else None,
            listing_id=message_data.listing_id,
            booking_id=message_data.booking_id,
            source=source,
            subject=message_data.subject,
            body=message_data.body or message_data.content or "",
            content=message_data.content or message_data.body or "",  # Legacy
            attachments=message_data.attachments or []
        )
        
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        return message
    
    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Message], int]:
        """Get a conversation's messages for a participant, with pagination."""
        # Verify user is participant
        from app.modules.messages.models import conversation_participants
        participant_check = await db.execute(
            select(conversation_participants)
            .where(
                conversation_participants.c.conversation_id == conversation_id,
                conversation_participants.c.user_id == user_id
            )
        )
        if not participant_check.first():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this conversation"
            )
        
        query = select(Message).where(Message.conversation_id == conversation_id)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        ).offset(skip).limit(limit).order_by(Message.created_at.desc())
        
        result = await db.execute(query)
        messages = result.scalars().all()
        
        return messages, total
    
    @staticmethod
    async def get_user_conversations(
        db: AsyncSession,
        user_id: int
    ) -> List[Conversation]:
        """Get all conversations for the given user."""
        from app.modules.messages.models import conversation_participants
        
        query = select(Conversation).join(conversation_participants).where(
            conversation_participants.c.user_id == user_id
        ).options(
            selectinload(Conversation.participants),
            selectinload(Conversation.messages)
        ).order_by(Conversation.updated_at.desc())
        
        result = await db.execute(query)
        conversations = result.scalars().unique().all()
        
        return conversations
    
    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        message_id: int,
        user_id: int
    ) -> Message:
        """Mark a single message as read for the given user."""
        result = await db.execute(
            select(Message).where(Message.id == message_id)
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Check authorization (user must be receiver or in conversation)
        if message.receiver_id and message.receiver_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        if not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
            await db.commit()
            await db.refresh(message)
        
        return message
    
    @staticmethod
    async def mark_conversation_read(
        db: AsyncSession,
        conversation_id: int,
        user_id: int
    ) -> int:
        """Mark all messages in a conversation as read for the given user."""
        from app.modules.messages.models import conversation_participants
        
        # Verify user is participant
        participant_check = await db.execute(
            select(conversation_participants)
            .where(
                conversation_participants.c.conversation_id == conversation_id,
                conversation_participants.c.user_id == user_id
            )
        )
        if not participant_check.first():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Mark all unread messages as read
        result = await db.execute(
            select(Message).where(
                Message.conversation_id == conversation_id,
                Message.receiver_id == user_id,
                Message.is_read == False
            )
        )
        messages = result.scalars().all()
        
        count = 0
        for message in messages:
            message.is_read = True
            message.read_at = datetime.utcnow()
            count += 1
        
        await db.commit()
        return count
