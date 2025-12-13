"""
Wishlist Services
Using Repository Pattern
"""
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.unit_of_work import IUnitOfWork
from app.modules.wishlist.models import Wishlist, WishlistShare
from app.modules.wishlist.schemas import WishlistItemCreate, WishlistShareCreate
from app.modules.users.models import User
from app.modules.listings.models import Listing
from app.core.id import ID


class WishlistService:
    """Wishlist service using repositories."""
    
    @staticmethod
    async def add_to_wishlist(
        uow: IUnitOfWork,
        user_id: ID,
        listing_id: ID
    ) -> Wishlist:
        """Add a listing to user's wishlist."""
        # Check if listing exists
        listing = await uow.listings.get_by_id(listing_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        # Check if already in wishlist
        result = await uow.db.execute(
            select(Wishlist).where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.listing_id == listing_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing already in wishlist"
            )
        
        # Create new wishlist item
        wishlist_item = Wishlist(
            user_id=user_id,
            listing_id=listing_id
        )
        uow.db.add(wishlist_item)
        await uow.db.flush()
        await uow.db.refresh(wishlist_item)
        
        return wishlist_item
    
    @staticmethod
    async def remove_from_wishlist(
        uow: IUnitOfWork,
        user_id: ID,
        listing_id: ID
    ) -> bool:
        """Remove a listing from user's wishlist."""
        result = await uow.db.execute(
            select(Wishlist).where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.listing_id == listing_id
                )
            )
        )
        wishlist_item = result.scalar_one_or_none()
        
        if not wishlist_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found in wishlist"
            )
        
        await uow.db.delete(wishlist_item)
        await uow.db.flush()
        
        return True
    
    @staticmethod
    async def get_user_wishlist(
        uow: IUnitOfWork,
        user_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Wishlist], int]:
        """Get user's wishlist items."""
        # Get total count
        count_result = await uow.db.execute(
            select(Wishlist).where(Wishlist.user_id == user_id)
        )
        total = len(count_result.scalars().all())
        
        # Get paginated items with listing details
        result = await uow.db.execute(
            select(Wishlist)
            .where(Wishlist.user_id == user_id)
            .options(
                selectinload(Wishlist.listing).selectinload(Listing.images),
                selectinload(Wishlist.listing).selectinload(Listing.photos),
                selectinload(Wishlist.listing).selectinload(Listing.host)
            )
            .offset(skip)
            .limit(limit)
            .order_by(Wishlist.created_at.desc())
        )
        items = result.scalars().all()
        
        return list(items), total
    
    @staticmethod
    async def check_in_wishlist(
        uow: IUnitOfWork,
        user_id: ID,
        listing_id: ID
    ) -> bool:
        """Check if a listing is in user's wishlist."""
        result = await uow.db.execute(
            select(Wishlist).where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.listing_id == listing_id
                )
            )
        )
        return result.scalar_one_or_none() is not None
    
    @staticmethod
    async def get_wishlist_by_ids(
        uow: IUnitOfWork,
        user_id: ID,
        listing_ids: List[ID]
    ) -> List[Wishlist]:
        """Get wishlist items for multiple listings (for checking which are in wishlist)."""
        if not listing_ids:
            return []
        
        result = await uow.db.execute(
            select(Wishlist).where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.listing_id.in_(listing_ids)
                )
            )
        )
        return list(result.scalars().all())


class WishlistShareService:
    """Wishlist sharing service."""
    
    @staticmethod
    async def create_share(
        uow: IUnitOfWork,
        user_id: ID,
        listing_id: ID,
        share_data: WishlistShareCreate
    ) -> WishlistShare:
        """Create a share for a wishlist item."""
        # Verify the wishlist item belongs to the user
        wishlist_result = await uow.db.execute(
            select(Wishlist).where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.listing_id == listing_id
                )
            )
        )
        wishlist_item = wishlist_result.scalar_one_or_none()
        
        if not wishlist_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wishlist item not found"
            )
        
        # If sharing with email, try to find user
        shared_with_user_id = share_data.shared_with_user_id
        if share_data.shared_with_email and not shared_with_user_id:
            user_result = await uow.db.execute(
                select(User).where(User.email == share_data.shared_with_email)
            )
            user = user_result.scalar_one_or_none()
            if user:
                shared_with_user_id = user.id
        
        # Check for existing active share
        if shared_with_user_id:
            existing_result = await uow.db.execute(
                select(WishlistShare).where(
                    and_(
                        WishlistShare.wishlist_id == wishlist_item.id,
                        WishlistShare.shared_with_user_id == shared_with_user_id,
                        WishlistShare.is_active == True
                    )
                )
            )
            existing = existing_result.scalar_one_or_none()
            if existing:
                # Update existing share
                existing.permission = share_data.permission
                if share_data.expires_at:
                    existing.expires_at = share_data.expires_at
                await uow.db.flush()
                await uow.db.refresh(existing)
                return existing
        
        # Create new share
        share = WishlistShare(
            wishlist_id=wishlist_item.id,
            shared_by_user_id=user_id,
            shared_with_user_id=shared_with_user_id,
            shared_with_email=share_data.shared_with_email,
            permission=share_data.permission,
            expires_at=share_data.expires_at,
            is_active=True
        )
        uow.db.add(share)
        await uow.db.flush()
        await uow.db.refresh(share)
        
        return share
    
    @staticmethod
    async def get_share_by_token(
        uow: IUnitOfWork,
        share_token: str
    ) -> Optional[WishlistShare]:
        """Get share by token."""
        result = await uow.db.execute(
            select(WishlistShare)
            .where(WishlistShare.share_token == share_token)
            .options(
                selectinload(WishlistShare.wishlist).selectinload(Wishlist.listing),
                selectinload(WishlistShare.shared_by_user)
            )
        )
        share = result.scalar_one_or_none()
        
        if not share or not share.is_active:
            return None
        
        # Check expiration
        if share.expires_at and share.expires_at < datetime.now(timezone.utc):
            return None
        
        return share
    
    @staticmethod
    async def get_user_shares(
        uow: IUnitOfWork,
        user_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[WishlistShare], int]:
        """Get all shares created by user."""
        # Get all wishlist items for user
        wishlist_result = await uow.db.execute(
            select(Wishlist).where(Wishlist.user_id == user_id)
        )
        wishlist_items = wishlist_result.scalars().all()
        wishlist_ids = [item.id for item in wishlist_items]
        
        if not wishlist_ids:
            return [], 0
        
        # Get shares for these wishlist items
        count_result = await uow.db.execute(
            select(WishlistShare).where(
                and_(
                    WishlistShare.wishlist_id.in_(wishlist_ids),
                    WishlistShare.is_active == True
                )
            )
        )
        total = len(count_result.scalars().all())
        
        result = await uow.db.execute(
            select(WishlistShare)
            .where(
                and_(
                    WishlistShare.wishlist_id.in_(wishlist_ids),
                    WishlistShare.is_active == True
                )
            )
            .options(
                selectinload(WishlistShare.wishlist).selectinload(Wishlist.listing),
                selectinload(WishlistShare.shared_with_user)
            )
            .offset(skip)
            .limit(limit)
            .order_by(WishlistShare.created_at.desc())
        )
        shares = result.scalars().all()
        
        return list(shares), total
    
    @staticmethod
    async def revoke_share(
        uow: IUnitOfWork,
        user_id: ID,
        share_id: ID
    ) -> bool:
        """Revoke a share (only by owner)."""
        result = await uow.db.execute(
            select(WishlistShare)
            .where(WishlistShare.id == share_id)
            .options(selectinload(WishlistShare.wishlist))
        )
        share = result.scalar_one_or_none()
        
        if not share:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share not found"
            )
        
        # Verify ownership through wishlist
        if share.wishlist.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to revoke this share"
            )
        
        share.is_active = False
        await uow.db.flush()
        
        return True
    
    @staticmethod
    async def get_shared_wishlists_for_user(
        uow: IUnitOfWork,
        user_id: ID,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[WishlistShare], int]:
        """Get wishlists shared with user."""
        count_result = await uow.db.execute(
            select(WishlistShare).where(
                and_(
                    WishlistShare.shared_with_user_id == user_id,
                    WishlistShare.is_active == True
                )
            )
        )
        total = len(count_result.scalars().all())
        
        result = await uow.db.execute(
            select(WishlistShare)
            .where(
                and_(
                    WishlistShare.shared_with_user_id == user_id,
                    WishlistShare.is_active == True
                )
            )
            .options(
                selectinload(WishlistShare.wishlist).selectinload(Wishlist.listing),
                selectinload(WishlistShare.shared_by_user)
            )
            .offset(skip)
            .limit(limit)
            .order_by(WishlistShare.created_at.desc())
        )
        shares = result.scalars().all()
        
        return list(shares), total

