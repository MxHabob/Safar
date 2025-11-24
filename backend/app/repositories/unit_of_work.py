"""
Unit of Work Pattern - Transaction Management
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.listings import ListingRepository, IListingRepository
from app.repositories.users import UserRepository, IUserRepository
from app.repositories.bookings import BookingRepository, IBookingRepository
from app.repositories.reviews import ReviewRepository, IReviewRepository
from app.repositories.messages import MessageRepository, ConversationRepository


class IUnitOfWork:
    """Unit of Work interface"""
    
    @property
    def listings(self) -> IListingRepository:
        """Listing repository"""
        pass
    
    @property
    def users(self) -> IUserRepository:
        """User repository"""
        pass
    
    @property
    def bookings(self) -> IBookingRepository:
        """Booking repository"""
        pass
    
    async def commit(self):
        """Commit transaction"""
        pass
    
    async def rollback(self):
        """Rollback transaction"""
        pass
    
    async def __aenter__(self):
        """Async context manager entry"""
        pass
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        pass


class UnitOfWork(IUnitOfWork):
    """Unit of Work implementation"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._listings: Optional[IListingRepository] = None
        self._users: Optional[IUserRepository] = None
        self._bookings: Optional[IBookingRepository] = None
        self._reviews: Optional[ReviewRepository] = None
        self._messages: Optional[MessageRepository] = None
        self._conversations: Optional[ConversationRepository] = None
    
    @property
    def listings(self) -> IListingRepository:
        """Listing repository"""
        if self._listings is None:
            self._listings = ListingRepository(self.db)
        return self._listings
    
    @property
    def users(self) -> IUserRepository:
        """User repository"""
        if self._users is None:
            self._users = UserRepository(self.db)
        return self._users
    
    @property
    def bookings(self) -> IBookingRepository:
        """Booking repository"""
        if self._bookings is None:
            self._bookings = BookingRepository(self.db)
        return self._bookings
    
    @property
    def reviews(self) -> ReviewRepository:
        """Review repository"""
        if self._reviews is None:
            self._reviews = ReviewRepository(self.db)
        return self._reviews
    
    @property
    def messages(self) -> MessageRepository:
        """Message repository"""
        if self._messages is None:
            self._messages = MessageRepository(self.db)
        return self._messages
    
    @property
    def conversations(self) -> ConversationRepository:
        """Conversation repository"""
        if self._conversations is None:
            self._conversations = ConversationRepository(self.db)
        return self._conversations
    
    async def commit(self):
        """Commit transaction"""
        await self.db.commit()
    
    async def rollback(self):
        """Rollback transaction"""
        await self.db.rollback()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if exc_type:
            await self.rollback()
        else:
            await self.commit()

