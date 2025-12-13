"""
Wishlist routes.
Expose wishlist CRUD and sharing endpoints.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import (
    get_current_active_user,
    get_unit_of_work,
)
from app.repositories.unit_of_work import IUnitOfWork
from app.modules.users.models import User
from app.modules.wishlist.models import Wishlist, WishlistShare
from app.modules.wishlist.schemas import (
    WishlistItemCreate,
    WishlistItemResponse,
    WishlistListResponse,
    WishlistShareCreate,
    WishlistShareResponse,
    WishlistShareListResponse,
    WishlistShareByTokenResponse,
)
from app.modules.wishlist.services import WishlistService, WishlistShareService
from app.core.id import ID

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


def _wishlist_item_to_response(wishlist_item: Wishlist, include_listing_details: bool = True) -> WishlistItemResponse:
    """Convert Wishlist model to response schema."""
    listing = wishlist_item.listing if hasattr(wishlist_item, 'listing') and wishlist_item.listing else None
    
    return WishlistItemResponse(
        id=wishlist_item.id,
        user_id=wishlist_item.user_id,
        listing_id=wishlist_item.listing_id,
        created_at=wishlist_item.created_at,
        updated_at=wishlist_item.updated_at,
        listing_title=listing.title if listing else None,
        listing_image_url=(
            (listing.images[0].url if listing.images and len(listing.images) > 0 else None) or
            (listing.photos[0].url if listing.photos and len(listing.photos) > 0 else None)
        ) if listing else None,
        listing_city=listing.city if listing else None,
        listing_country=listing.country if listing else None,
        listing_price=float(listing.base_price) if listing and listing.base_price else None,
        listing_currency=listing.currency if listing else None,
    )


@router.post("", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    item: WishlistItemCreate,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Add a listing to the current user's wishlist.
    """
    wishlist_item = await WishlistService.add_to_wishlist(
        uow=uow,
        user_id=current_user.id,
        listing_id=item.listing_id
    )
    await uow.commit()
    
    # Reload with listing details
    from sqlalchemy import select
    result = await uow.db.execute(
        select(Wishlist)
        .where(Wishlist.id == wishlist_item.id)
        .options(
            selectinload(Wishlist.listing).selectinload("images"),
            selectinload(Wishlist.listing).selectinload("photos"),
        )
    )
    wishlist_item = result.scalar_one()
    
    return _wishlist_item_to_response(wishlist_item)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    listing_id: ID,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> None:
    """
    Remove a listing from the current user's wishlist.
    """
    await WishlistService.remove_from_wishlist(
        uow=uow,
        user_id=current_user.id,
        listing_id=listing_id
    )
    await uow.commit()


@router.get("", response_model=WishlistListResponse)
async def get_wishlist(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Get the current user's wishlist items.
    """
    items, total = await WishlistService.get_user_wishlist(
        uow=uow,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    response_items = [_wishlist_item_to_response(item) for item in items]
    
    return WishlistListResponse(
        items=response_items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/check/{listing_id}")
async def check_in_wishlist(
    listing_id: ID,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> dict:
    """
    Check if a listing is in the current user's wishlist.
    """
    is_in_wishlist = await WishlistService.check_in_wishlist(
        uow=uow,
        user_id=current_user.id,
        listing_id=listing_id
    )
    
    return {"is_in_wishlist": is_in_wishlist, "listing_id": listing_id}


@router.post("/{listing_id}/share", response_model=WishlistShareResponse, status_code=status.HTTP_201_CREATED)
async def share_wishlist_item(
    listing_id: ID,
    share_data: WishlistShareCreate,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Share a wishlist item with another user.
    Requires either shared_with_user_id or shared_with_email.
    """
    if not share_data.shared_with_user_id and not share_data.shared_with_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either shared_with_user_id or shared_with_email must be provided"
        )
    
    share = await WishlistShareService.create_share(
        uow=uow,
        user_id=current_user.id,
        listing_id=listing_id,
        share_data=share_data
    )
    await uow.commit()
    
    # Reload with relationships
    from sqlalchemy import select
    result = await uow.db.execute(
        select(WishlistShare)
        .where(WishlistShare.id == share.id)
        .options(
            selectinload(WishlistShare.wishlist),
            selectinload(WishlistShare.shared_with_user)
        )
    )
    share = result.scalar_one()
    
    return WishlistShareResponse.model_validate(share)


@router.get("/share/token/{share_token}", response_model=WishlistShareByTokenResponse)
async def get_shared_wishlist_by_token(
    share_token: str,
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Get a shared wishlist item by share token (public endpoint).
    """
    share = await WishlistShareService.get_share_by_token(
        uow=uow,
        share_token=share_token
    )
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found or expired"
        )
    
    # Get the wishlist item
    from sqlalchemy import select
    result = await uow.db.execute(
        select(Wishlist)
        .where(Wishlist.id == share.wishlist_id)
        .options(
            selectinload(Wishlist.listing).selectinload("images"),
            selectinload(Wishlist.listing).selectinload("photos"),
        )
    )
    wishlist_item = result.scalar_one_or_none()
    
    if not wishlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found"
        )
    
    return WishlistShareByTokenResponse(
        share=WishlistShareResponse.model_validate(share),
        wishlist_items=[_wishlist_item_to_response(wishlist_item)],
        shared_by_user_name=(
            share.shared_by_user.computed_full_name
            if share.shared_by_user
            else None
        )
    )


@router.get("/shares", response_model=WishlistShareListResponse)
async def get_my_shares(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Get all wishlist shares created by the current user.
    """
    shares, total = await WishlistShareService.get_user_shares(
        uow=uow,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return WishlistShareListResponse(
        items=[WishlistShareResponse.model_validate(share) for share in shares],
        total=total
    )


@router.get("/shared-with-me", response_model=WishlistShareListResponse)
async def get_shared_with_me(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> Any:
    """
    Get wishlists shared with the current user.
    """
    shares, total = await WishlistShareService.get_shared_wishlists_for_user(
        uow=uow,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return WishlistShareListResponse(
        items=[WishlistShareResponse.model_validate(share) for share in shares],
        total=total
    )


@router.delete("/share/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share(
    share_id: ID,
    current_user: User = Depends(get_current_active_user),
    uow: IUnitOfWork = Depends(get_unit_of_work)
) -> None:
    """
    Revoke a wishlist share (only by the owner).
    """
    await WishlistShareService.revoke_share(
        uow=uow,
        user_id=current_user.id,
        share_id=share_id
    )
    await uow.commit()

