"""
Payment schemas.
"""
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

from app.modules.bookings.models import PaymentMethodType, PaymentStatus


class PaymentIntentCreate(BaseModel):
    """Create payment intent request"""
    booking_id: str = Field(..., description="Booking ID")
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="USD", description="Currency code")


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str = Field(..., description="Stripe client secret")
    payment_intent_id: str = Field(..., description="Stripe payment intent ID")


class PaymentProcess(BaseModel):
    """Process payment request"""
    booking_id: str = Field(..., description="Booking ID")
    payment_intent_id: str = Field(..., description="Stripe payment intent ID")
    payment_method: PaymentMethodType = Field(..., description="Payment method")


class PaymentResponse(BaseModel):
    """Payment response"""
    id: str
    booking_id: Optional[str]
    amount: Decimal
    currency: str
    status: PaymentStatus
    payment_method: Optional[PaymentMethodType]
    stripe_payment_intent_id: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

