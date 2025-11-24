"""
Background Tasks للمدفوعات
Payment Background Tasks
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.modules.payments.models import Payment
from app.modules.payments.services import PaymentService


async def _process_payment_async(payment_id: int):
    """معالجة دفعة - Process payment (async)"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        
        if payment:
            # Payment processing logic
            pass


@celery_app.task(name="process_payment")
def process_payment(payment_id: int):
    """معالجة دفعة - Process payment"""
    asyncio.run(_process_payment_async(payment_id))


async def _refund_payment_async(payment_id: int, amount: float = None):
    """استرداد دفعة - Refund payment (async)"""
    async with AsyncSessionLocal() as db:
        await PaymentService.refund_payment(db, payment_id, amount)


@celery_app.task(name="refund_payment")
def refund_payment(payment_id: int, amount: float = None):
    """استرداد دفعة - Refund payment"""
    asyncio.run(_refund_payment_async(payment_id, amount))

