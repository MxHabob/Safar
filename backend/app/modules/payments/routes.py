"""
Payment routes.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.bookings.models import PaymentMethodType
from app.modules.payments.services import PaymentService
from app.modules.payments.schemas import (
    PaymentIntentCreate, PaymentIntentResponse, PaymentProcess, PaymentResponse
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/intent", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a payment intent for a booking."""
    result = await PaymentService.create_payment_intent(
        db,
        booking_id=payment_data.booking_id,
        amount=payment_data.amount,
        currency=payment_data.currency
    )
    
    return result


@router.post("/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    payment_data: PaymentProcess,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Process a payment.

    CRITICAL: This endpoint is idempotent. Processing the same ``payment_intent_id``
    multiple times will return the existing payment record.
    """
    payment = await PaymentService.process_payment(
        db,
        booking_id=payment_data.booking_id,
        payment_intent_id=payment_data.payment_intent_id,
        payment_method=payment_data.payment_method
    )
    
    # Commit transaction
    await db.commit()
    await db.refresh(payment)
    
    return payment

