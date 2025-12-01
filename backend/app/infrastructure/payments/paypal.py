"""
PayPal payment integration service.
"""
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()


class PayPalService:
    """PayPal payment service for creating and processing payments."""
    
    # PayPal API endpoints
    SANDBOX_BASE_URL = "https://api.sandbox.paypal.com"
    PRODUCTION_BASE_URL = "https://api.paypal.com"
    
    @staticmethod
    def _get_base_url() -> str:
        """Get PayPal API base URL based on environment."""
        if settings.environment.lower() == "production":
            return PayPalService.PRODUCTION_BASE_URL
        return PayPalService.SANDBOX_BASE_URL
    
    @staticmethod
    async def _get_access_token() -> str:
        """Get PayPal OAuth access token."""
        if not settings.paypal_client_id or not settings.paypal_client_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="PayPal is not configured"
            )
        
        base_url = PayPalService._get_base_url()
        auth_url = f"{base_url}/v1/oauth2/token"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                auth_url,
                auth=(settings.paypal_client_id, settings.paypal_client_secret),
                data={"grant_type": "client_credentials"},
                headers={"Accept": "application/json", "Accept-Language": "en_US"}
            )
            response.raise_for_status()
            data = response.json()
            return data["access_token"]
    
    @staticmethod
    async def create_order(
        amount: float,
        currency: str = "USD",
        booking_id: Optional[str] = None,
        return_url: Optional[str] = None,
        cancel_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a PayPal order.
        
        Returns:
            dict with order_id and approval_url
        """
        access_token = await PayPalService._get_access_token()
        base_url = PayPalService._get_base_url()
        order_url = f"{base_url}/v2/checkout/orders"
        
        # Build order payload
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency.upper(),
                        "value": f"{amount:.2f}"
                    },
                    "description": f"Booking {booking_id}" if booking_id else "Travel booking",
                    "custom_id": booking_id
                }
            ],
            "application_context": {
                "return_url": return_url or "https://safar.com/payment/success",
                "cancel_url": cancel_url or "https://safar.com/payment/cancel",
                "brand_name": "Safar",
                "locale": "en-US",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                order_url,
                json=order_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract approval URL
            approval_url = None
            for link in data.get("links", []):
                if link.get("rel") == "approve":
                    approval_url = link.get("href")
                    break
            
            return {
                "order_id": data["id"],
                "status": data["status"],
                "approval_url": approval_url
            }
    
    @staticmethod
    async def capture_order(order_id: str) -> Dict[str, Any]:
        """
        Capture a PayPal order after user approval.
        
        Returns:
            dict with payment details
        """
        access_token = await PayPalService._get_access_token()
        base_url = PayPalService._get_base_url()
        capture_url = f"{base_url}/v2/checkout/orders/{order_id}/capture"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                capture_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract payment details
            purchase_unit = data.get("purchase_units", [{}])[0]
            payment = purchase_unit.get("payments", {}).get("captures", [{}])[0]
            
            return {
                "order_id": data["id"],
                "status": data["status"],
                "payment_id": payment.get("id"),
                "amount": float(payment.get("amount", {}).get("value", 0)),
                "currency": payment.get("amount", {}).get("currency_code", "USD"),
                "capture_id": payment.get("id")
            }
    
    @staticmethod
    async def get_order(order_id: str) -> Dict[str, Any]:
        """Get PayPal order details."""
        access_token = await PayPalService._get_access_token()
        base_url = PayPalService._get_base_url()
        order_url = f"{base_url}/v2/checkout/orders/{order_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                order_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def refund_payment(capture_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Refund a PayPal payment.
        
        Args:
            capture_id: PayPal capture ID
            amount: Optional partial refund amount. If None, full refund.
        """
        access_token = await PayPalService._get_access_token()
        base_url = PayPalService._get_base_url()
        refund_url = f"{base_url}/v2/payments/captures/{capture_id}/refund"
        
        refund_data = {}
        if amount:
            # Get original payment to get currency
            order_data = await PayPalService.get_order(capture_id)
            currency = "USD"  # Default, should extract from order
            refund_data = {
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency_code": currency
                }
            }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                refund_url,
                json=refund_data if refund_data else None,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()

