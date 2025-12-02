"""
Loyalty Program Service
Full implementation of points, tiers, and redemption system.
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.loyalty.models import LoyaltyProgram, LoyaltyLedger
from app.modules.bookings.models import Booking, BookingStatus
from app.core.id import ID

logger = logging.getLogger(__name__)


class LoyaltyTier:
    """Loyalty tier definitions."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    
    TIER_THRESHOLDS = {
        BRONZE: 0,
        SILVER: 1000,
        GOLD: 5000,
        PLATINUM: 10000
    }
    
    TIER_MULTIPLIERS = {
        BRONZE: 1.0,      # 1 point per $1 spent
        SILVER: 1.25,    # 1.25 points per $1 spent
        GOLD: 1.5,       # 1.5 points per $1 spent
        PLATINUM: 2.0    # 2 points per $1 spent
    }
    
    TIER_BENEFITS = {
        BRONZE: {
            "name": "Bronze",
            "points_per_dollar": 1.0,
            "discount_percentage": 0,
            "priority_support": False
        },
        SILVER: {
            "name": "Silver",
            "points_per_dollar": 1.25,
            "discount_percentage": 5,
            "priority_support": False
        },
        GOLD: {
            "name": "Gold",
            "points_per_dollar": 1.5,
            "discount_percentage": 10,
            "priority_support": True
        },
        PLATINUM: {
            "name": "Platinum",
            "points_per_dollar": 2.0,
            "discount_percentage": 15,
            "priority_support": True
        }
    }


class LoyaltyService:
    """Service for managing loyalty program: points, tiers, and redemption."""
    
    DEFAULT_PROGRAM_CODE = "SAFAR_LOYALTY"
    POINTS_PER_DOLLAR = 1.0  # Base rate
    POINTS_EXPIRY_DAYS = 365  # Points expire after 1 year
    REDEMPTION_RATE = 100  # 100 points = $1 discount
    
    @staticmethod
    async def get_or_create_program(db: AsyncSession) -> LoyaltyProgram:
        """Get or create the default loyalty program."""
        result = await db.execute(
            select(LoyaltyProgram).where(LoyaltyProgram.code == LoyaltyService.DEFAULT_PROGRAM_CODE)
        )
        program = result.scalar_one_or_none()
        
        if not program:
            # Create default program with tier definitions
            program = LoyaltyProgram(
                code=LoyaltyService.DEFAULT_PROGRAM_CODE,
                name="Safar Loyalty Program",
                tiers={
                    "bronze": {"threshold": 0, "multiplier": 1.0, "name": "Bronze"},
                    "silver": {"threshold": 1000, "multiplier": 1.25, "name": "Silver"},
                    "gold": {"threshold": 5000, "multiplier": 1.5, "name": "Gold"},
                    "platinum": {"threshold": 10000, "multiplier": 2.0, "name": "Platinum"}
                }
            )
            db.add(program)
            await db.commit()
            await db.refresh(program)
        
        return program
    
    @staticmethod
    async def get_or_create_ledger(
        db: AsyncSession,
        user_id: ID,
        program_id: Optional[ID] = None
    ) -> LoyaltyLedger:
        """Get or create loyalty ledger for a user."""
        if not program_id:
            program = await LoyaltyService.get_or_create_program(db)
            program_id = program.id
        
        result = await db.execute(
            select(LoyaltyLedger).where(
                and_(
                    LoyaltyLedger.user_id == user_id,
                    LoyaltyLedger.program_id == program_id
                )
            )
        )
        ledger = result.scalar_one_or_none()
        
        if not ledger:
            ledger = LoyaltyLedger(
                user_id=user_id,
                program_id=program_id,
                balance=0,
                transactions=[]
            )
            db.add(ledger)
            await db.commit()
            await db.refresh(ledger)
        
        return ledger
    
    @staticmethod
    def calculate_tier(points: int) -> str:
        """Calculate user tier based on lifetime points."""
        if points >= LoyaltyTier.TIER_THRESHOLDS[LoyaltyTier.PLATINUM]:
            return LoyaltyTier.PLATINUM
        elif points >= LoyaltyTier.TIER_THRESHOLDS[LoyaltyTier.GOLD]:
            return LoyaltyTier.GOLD
        elif points >= LoyaltyTier.TIER_THRESHOLDS[LoyaltyTier.SILVER]:
            return LoyaltyTier.SILVER
        else:
            return LoyaltyTier.BRONZE
    
    @staticmethod
    def calculate_points_earned(amount: Decimal, tier: str = LoyaltyTier.BRONZE) -> int:
        """
        Calculate points earned based on spending amount and tier.
        
        Args:
            amount: Spending amount in dollars
            tier: User's current tier
        
        Returns:
            Points earned (rounded to nearest integer)
        """
        multiplier = LoyaltyTier.TIER_MULTIPLIERS.get(tier, 1.0)
        points = float(amount) * multiplier * LoyaltyService.POINTS_PER_DOLLAR
        return int(round(points))
    
    @staticmethod
    async def award_points(
        db: AsyncSession,
        user_id: ID,
        amount: Decimal,
        booking_id: Optional[ID] = None,
        reason: str = "booking_completed"
    ) -> Dict[str, Any]:
        """
        Award loyalty points to a user for a completed booking.
        
        Args:
            db: Database session
            user_id: User ID
            amount: Booking amount (for calculating points)
            booking_id: Optional booking ID
            reason: Reason for awarding points
        
        Returns:
            Dictionary with points awarded and new balance
        """
        # Get or create ledger
        ledger = await LoyaltyService.get_or_create_ledger(db, user_id)
        
        # Calculate current tier
        current_tier = LoyaltyService.calculate_tier(ledger.balance)
        
        # Calculate points to award
        points_awarded = LoyaltyService.calculate_points_earned(amount, current_tier)
        
        # Update balance
        ledger.balance += points_awarded
        
        # Add transaction record
        transaction = {
            "type": "earned",
            "points": points_awarded,
            "amount": float(amount),
            "booking_id": str(booking_id) if booking_id else None,
            "reason": reason,
            "tier": current_tier,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Append to transactions array
        current_transactions = list(ledger.transactions) if ledger.transactions else []
        current_transactions.append(transaction)
        ledger.transactions = current_transactions
        
        # Set expiry date (1 year from now)
        ledger.expires_at = datetime.now(timezone.utc) + timedelta(days=LoyaltyService.POINTS_EXPIRY_DAYS)
        
        await db.commit()
        await db.refresh(ledger)
        
        # Check if tier upgraded
        new_tier = LoyaltyService.calculate_tier(ledger.balance)
        tier_upgraded = new_tier != current_tier
        
        logger.info(
            f"Awarded {points_awarded} points to user {user_id} for booking {booking_id}. "
            f"New balance: {ledger.balance}, Tier: {current_tier} -> {new_tier}"
        )
        
        return {
            "points_awarded": points_awarded,
            "new_balance": ledger.balance,
            "current_tier": current_tier,
            "new_tier": new_tier,
            "tier_upgraded": tier_upgraded,
            "transaction_id": transaction["timestamp"]
        }
    
    @staticmethod
    async def redeem_points(
        db: AsyncSession,
        user_id: ID,
        points_to_redeem: int,
        booking_id: Optional[ID] = None
    ) -> Dict[str, Any]:
        """
        Redeem loyalty points for discount.
        
        Args:
            db: Database session
            user_id: User ID
            points_to_redeem: Points to redeem
            booking_id: Optional booking ID
        
        Returns:
            Dictionary with discount amount and new balance
        """
        # Get ledger
        ledger = await LoyaltyService.get_or_create_ledger(db, user_id)
        
        # Validate redemption
        if points_to_redeem <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Points to redeem must be greater than 0"
            )
        
        if ledger.balance < points_to_redeem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient points. Current balance: {ledger.balance}, requested: {points_to_redeem}"
            )
        
        # Check minimum redemption (must redeem in multiples of REDEMPTION_RATE)
        if points_to_redeem < LoyaltyService.REDEMPTION_RATE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum redemption is {LoyaltyService.REDEMPTION_RATE} points"
            )
        
        if points_to_redeem % LoyaltyService.REDEMPTION_RATE != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Points must be redeemed in multiples of {LoyaltyService.REDEMPTION_RATE}"
            )
        
        # Calculate discount amount
        discount_amount = Decimal(points_to_redeem) / Decimal(LoyaltyService.REDEMPTION_RATE)
        
        # Update balance
        ledger.balance -= points_to_redeem
        
        # Add redemption transaction
        transaction = {
            "type": "redeemed",
            "points": -points_to_redeem,
            "discount_amount": float(discount_amount),
            "booking_id": str(booking_id) if booking_id else None,
            "reason": "points_redemption",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Append to transactions array
        current_transactions = list(ledger.transactions) if ledger.transactions else []
        current_transactions.append(transaction)
        ledger.transactions = current_transactions
        
        await db.commit()
        await db.refresh(ledger)
        
        logger.info(
            f"User {user_id} redeemed {points_to_redeem} points for ${discount_amount} discount. "
            f"New balance: {ledger.balance}"
        )
        
        return {
            "points_redeemed": points_to_redeem,
            "discount_amount": float(discount_amount),
            "new_balance": ledger.balance,
            "transaction_id": transaction["timestamp"]
        }
    
    @staticmethod
    async def get_user_loyalty_status(
        db: AsyncSession,
        user_id: ID
    ) -> Dict[str, Any]:
        """
        Get comprehensive loyalty status for a user.
        
        Returns:
            Dictionary with balance, tier, benefits, and transaction history
        """
        ledger = await LoyaltyService.get_or_create_ledger(db, user_id)
        
        # Get program details
        program_result = await db.execute(
            select(LoyaltyProgram).where(LoyaltyProgram.id == ledger.program_id)
        )
        program = program_result.scalar_one_or_none()
        
        # Calculate tier
        tier = LoyaltyService.calculate_tier(ledger.balance)
        tier_info = LoyaltyTier.TIER_BENEFITS.get(tier, {})
        
        # Calculate points to next tier
        next_tier_threshold = None
        points_to_next_tier = None
        for tier_name, threshold in sorted(LoyaltyTier.TIER_THRESHOLDS.items(), key=lambda x: x[1]):
            if threshold > ledger.balance:
                next_tier_threshold = threshold
                points_to_next_tier = threshold - ledger.balance
                break
        
        # Get recent transactions (last 10)
        recent_transactions = list(ledger.transactions)[-10:] if ledger.transactions else []
        
        return {
            "balance": ledger.balance,
            "tier": tier,
            "tier_name": tier_info.get("name", tier),
            "points_per_dollar": tier_info.get("points_per_dollar", 1.0),
            "discount_percentage": tier_info.get("discount_percentage", 0),
            "priority_support": tier_info.get("priority_support", False),
            "points_to_next_tier": points_to_next_tier,
            "next_tier": next_tier_threshold,
            "expires_at": ledger.expires_at.isoformat() if ledger.expires_at else None,
            "recent_transactions": recent_transactions,
            "program_name": program.name if program else "Safar Loyalty Program"
        }
    
    @staticmethod
    async def expire_points(db: AsyncSession) -> int:
        """
        Expire points that have passed their expiry date.
        Called by scheduled task (Celery).
        
        Returns:
            Number of points expired
        """
        now = datetime.now(timezone.utc)
        
        result = await db.execute(
            select(LoyaltyLedger).where(
                and_(
                    LoyaltyLedger.expires_at.isnot(None),
                    LoyaltyLedger.expires_at < now,
                    LoyaltyLedger.balance > 0
                )
            )
        )
        ledgers = result.scalars().all()
        
        total_expired = 0
        for ledger in ledgers:
            expired_points = ledger.balance
            
            # Add expiry transaction
            transaction = {
                "type": "expired",
                "points": -expired_points,
                "reason": "points_expired",
                "timestamp": now.isoformat()
            }
            
            current_transactions = list(ledger.transactions) if ledger.transactions else []
            current_transactions.append(transaction)
            ledger.transactions = current_transactions
            
            ledger.balance = 0
            ledger.expires_at = None
            total_expired += expired_points
        
        if total_expired > 0:
            await db.commit()
            logger.info(f"Expired {total_expired} loyalty points across {len(ledgers)} accounts")
        
        return total_expired
    
    @staticmethod
    async def get_redemption_options(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Get available redemption options for users.
        
        Returns:
            List of redemption options with point costs
        """
        return [
            {
                "id": "discount_10",
                "name": "$10 Discount",
                "points_required": 1000,
                "value": 10.0,
                "type": "discount"
            },
            {
                "id": "discount_25",
                "name": "$25 Discount",
                "points_required": 2500,
                "value": 25.0,
                "type": "discount"
            },
            {
                "id": "discount_50",
                "name": "$50 Discount",
                "points_required": 5000,
                "value": 50.0,
                "type": "discount"
            },
            {
                "id": "discount_100",
                "name": "$100 Discount",
                "points_required": 10000,
                "value": 100.0,
                "type": "discount"
            },
            {
                "id": "free_night",
                "name": "Free Night (up to $200)",
                "points_required": 20000,
                "value": 200.0,
                "type": "free_night"
            }
        ]

