"""
Promotion and coupon services.
"""
from typing import Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from fastapi import HTTPException, status

from app.modules.promotions.models import Coupon, Promotion, DiscountType
from app.modules.listings.models import Listing
from app.core.id import ID


class PromotionService:
    """Service for managing promotions and coupons."""
    
    @staticmethod
    async def validate_coupon(
        db: AsyncSession,
        coupon_code: str,
        listing_id: ID,
        booking_amount: Decimal,
        check_in_date: date,
        check_out_date: date,
        nights: int,
        guests: int,
        user_id: Optional[ID] = None
    ) -> Dict[str, Any]:
        """
        Validate a coupon code and calculate discount.
        
        Returns:
            dict with discount_amount, coupon_id, and validation details
        """
        # Find active coupon
        today = date.today()
        coupon_result = await db.execute(
            select(Coupon).where(
                and_(
                    Coupon.code == coupon_code.upper(),
                    Coupon.is_active == True,
                    Coupon.start_date <= today,
                    Coupon.end_date >= today
                )
            )
        )
        coupon = coupon_result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or expired coupon code"
            )
        
        # Check usage limits
        if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon has reached maximum usage limit"
            )
        
        # Check minimum purchase amount
        if coupon.min_purchase_amount and booking_amount < coupon.min_purchase_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum purchase amount of {coupon.min_purchase_amount} required"
            )
        
        # Check if applicable to specific properties
        if coupon.applicable_to_properties:
            if listing_id not in coupon.applicable_to_properties:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon is not applicable to this property"
                )
        
        # Check if applicable to specific users (targeted coupons)
        if coupon.applicable_to_users and user_id:
            if user_id not in coupon.applicable_to_users:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon is not available for your account"
                )
        
        # Check user usage limit (only if user_id provided)
        if user_id:
            from app.modules.bookings.models import Booking
            user_usage_result = await db.execute(
                select(func.count(Booking.id)).where(
                    and_(
                        Booking.guest_id == user_id,
                        Booking.coupon_code == coupon_code.upper()
                    )
                )
            )
            user_usage_count = user_usage_result.scalar() or 0
            
            if user_usage_count >= coupon.max_uses_per_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already used this coupon the maximum number of times"
                )
        
        # Calculate discount
        discount_amount = Decimal("0")
        
        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount_amount = (booking_amount * coupon.discount_value) / Decimal("100")
            if coupon.max_discount_amount:
                discount_amount = min(discount_amount, coupon.max_discount_amount)
        elif coupon.discount_type == DiscountType.FIXED_AMOUNT:
            discount_amount = min(coupon.discount_value, booking_amount)
        elif coupon.discount_type == DiscountType.FREE_NIGHTS:
            # Calculate per-night rate
            per_night = booking_amount / Decimal(str(nights))
            free_nights = min(int(coupon.discount_value), nights)
            discount_amount = per_night * Decimal(str(free_nights))
        
        # Ensure discount doesn't exceed booking amount
        discount_amount = min(discount_amount, booking_amount)
        
        return {
            "coupon_id": coupon.id,
            "coupon_code": coupon.code,
            "discount_amount": discount_amount,
            "discount_type": coupon.discount_type.value,
            "discount_value": coupon.discount_value
        }
    
    @staticmethod
    async def apply_coupon(
        db: AsyncSession,
        coupon_code: str,
        booking_id: ID
    ) -> None:
        """Apply a coupon to a booking and increment usage counter."""
        from app.modules.bookings.models import Booking
        
        # Get booking
        booking_result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = booking_result.scalar_one_or_none()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Get coupon
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == coupon_code.upper())
        )
        coupon = coupon_result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Increment usage counter
        coupon.current_uses += 1
        await db.flush()
    
    @staticmethod
    async def get_applicable_promotions(
        db: AsyncSession,
        listing_id: Optional[ID] = None,
        check_in_date: Optional[date] = None,
        nights: Optional[int] = None,
        guests: Optional[int] = None
    ) -> list[Promotion]:
        """Get active promotions applicable to a listing or booking."""
        today = date.today()
        now = datetime.now().time()
        
        query = select(Promotion).where(
            and_(
                Promotion.is_active == True,
                Promotion.start_date <= today,
                Promotion.end_date >= today
            )
        )
        
        # Filter by listing if provided
        if listing_id:
            query = query.where(
                or_(
                    Promotion.listing_id == listing_id,
                    Promotion.listing_id.is_(None)
                )
            )
        
        # Filter by date/time for flash sales
        if check_in_date:
            # Check if promotion is valid for check-in date
            query = query.where(
                or_(
                    Promotion.start_date <= check_in_date,
                    Promotion.start_date.is_(None)
                )
            )
            query = query.where(
                or_(
                    Promotion.end_date >= check_in_date,
                    Promotion.end_date.is_(None)
                )
            )
        
        # Filter by nights
        if nights:
            query = query.where(
                or_(
                    Promotion.min_nights.is_(None),
                    Promotion.min_nights <= nights
                )
            )
            query = query.where(
                or_(
                    Promotion.max_nights.is_(None),
                    Promotion.max_nights >= nights
                )
            )
        
        # Filter by guests
        if guests:
            query = query.where(
                or_(
                    Promotion.min_guests.is_(None),
                    Promotion.min_guests <= guests
                )
            )
        
        result = await db.execute(query)
        return list(result.scalars().all())

