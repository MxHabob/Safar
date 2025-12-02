"""
Celery tasks for loyalty program.
"""
from celery import shared_task
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import get_settings
from app.modules.loyalty.service import LoyaltyService
from app.modules.bookings.models import Booking, BookingStatus
from sqlalchemy import select
from decimal import Decimal

settings = get_settings()

# Create async engine for Celery tasks
task_engine = create_async_engine(str(settings.database_url))
TaskSessionLocal = async_sessionmaker(task_engine, class_=AsyncSession, expire_on_commit=False)


@shared_task(name="loyalty.award_points_for_booking")
def award_points_for_booking_task(booking_id: str):
    """
    Celery task to award loyalty points for a completed booking.
    
    This task is triggered when a booking is marked as COMPLETED.
    """
    import asyncio
    
    async def _award_points():
        async with TaskSessionLocal() as db:
            # Get booking
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            
            if not booking:
                return {"error": "Booking not found"}
            
            # Only award points for completed bookings
            if booking.status != BookingStatus.COMPLETED.value:
                return {"error": "Booking not completed"}
            
            # Award points
            try:
                result = await LoyaltyService.award_points(
                    db,
                    user_id=booking.guest_id,
                    amount=booking.total_amount,
                    booking_id=booking.id,
                    reason="booking_completed"
                )
                return result
            except Exception as e:
                return {"error": str(e)}
    
    return asyncio.run(_award_points())


@shared_task(name="loyalty.expire_points")
def expire_points_task():
    """
    Celery task to expire old loyalty points.
    
    Should be run daily via Celery Beat.
    """
    import asyncio
    
    async def _expire_points():
        async with TaskSessionLocal() as db:
            try:
                expired_count = await LoyaltyService.expire_points(db)
                return {"expired_points": expired_count}
            except Exception as e:
                return {"error": str(e)}
    
    return asyncio.run(_expire_points())

