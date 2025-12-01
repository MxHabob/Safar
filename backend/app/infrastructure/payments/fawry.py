"""
Fawry Payment Service
Fawry is a leading payment service provider in Egypt.
"""
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import hashlib
from app.core.config import get_settings

settings = get_settings()


class FawryService:
    """Fawry payment service for Egyptian market."""
    
    @staticmethod
    def _get_base_url() -> str:
        """Get Fawry API base URL."""
        if settings.environment == "production":
            return "https://www.atfawry.com"
        return "https://atfawry.fawrystaging.com"
    
    @staticmethod
    def _generate_signature(
        merchant_code: str,
        merchant_ref_num: str,
        amount: float,
        secure_key: str
    ) -> str:
        """Generate Fawry signature for request authentication."""
        data = f"{merchant_code}{merchant_ref_num}{amount:.2f}{secure_key}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    async def create_charge(
        merchant_ref_num: str,
        amount: float,
        customer_name: str,
        customer_mobile: str,
        customer_email: str,
        payment_method: str = "PAYATFAWRY",  # PAYATFAWRY, CARD, etc.
        description: str = "Booking payment"
    ) -> Dict[str, Any]:
        """
        Create a Fawry charge request.
        
        Args:
            merchant_ref_num: Unique merchant reference number
            amount: Amount to charge
            customer_name: Customer name
            customer_mobile: Customer mobile number
            customer_email: Customer email
            payment_method: Payment method (PAYATFAWRY, CARD, etc.)
            description: Charge description
            
        Returns:
            Dictionary with charge request details and payment URL
        """
        merchant_code = getattr(settings, 'fawry_merchant_code', None)
        secure_key = getattr(settings, 'fawry_secure_key', None)
        
        if not merchant_code or not secure_key:
            raise ValueError("Fawry merchant code and secure key must be configured")
        
        base_url = FawryService._get_base_url()
        charge_url = f"{base_url}/ECommerceWeb/Fawry/payments/charge"
        
        signature = FawryService._generate_signature(
            merchant_code, merchant_ref_num, amount, secure_key
        )
        
        payload = {
            "merchantCode": merchant_code,
            "merchantRefNum": merchant_ref_num,
            "customerName": customer_name,
            "customerMobile": customer_mobile,
            "customerEmail": customer_email,
            "amount": f"{amount:.2f}",
            "currencyCode": "EGP",
            "paymentMethod": payment_method,
            "description": description,
            "chargeItems": [
                {
                    "itemId": "1",
                    "description": description,
                    "price": f"{amount:.2f}",
                    "quantity": 1
                }
            ],
            "signature": signature,
            "returnUrl": getattr(settings, 'fawry_return_url', f"{settings.app_name}/payment/callback"),
            "language": "en"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                charge_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def verify_payment(merchant_ref_num: str) -> Dict[str, Any]:
        """Verify Fawry payment status."""
        merchant_code = getattr(settings, 'fawry_merchant_code', None)
        secure_key = getattr(settings, 'fawry_secure_key', None)
        
        if not merchant_code or not secure_key:
            raise ValueError("Fawry merchant code and secure key must be configured")
        
        base_url = FawryService._get_base_url()
        verify_url = f"{base_url}/ECommerceWeb/Fawry/payments/status"
        
        signature = FawryService._generate_signature(
            merchant_code, merchant_ref_num, 0, secure_key
        )
        
        params = {
            "merchantCode": merchant_code,
            "merchantRefNumber": merchant_ref_num,
            "signature": signature
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(verify_url, params=params)
            response.raise_for_status()
            return response.json()

