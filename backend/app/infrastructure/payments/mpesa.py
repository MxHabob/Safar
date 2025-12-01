"""
M-Pesa Payment Service
M-Pesa is a mobile money service popular in Kenya, Tanzania, and East Africa.
"""
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import base64
import hashlib
from app.core.config import get_settings

settings = get_settings()


class MPesaService:
    """M-Pesa payment service for mobile money transactions."""
    
    @staticmethod
    def _get_base_url() -> str:
        """Get M-Pesa API base URL (sandbox or production)."""
        if settings.environment == "production":
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"
    
    @staticmethod
    async def _get_access_token() -> str:
        """
        Get M-Pesa OAuth access token.
        Requires: MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
        """
        consumer_key = getattr(settings, 'mpesa_consumer_key', None)
        consumer_secret = getattr(settings, 'mpesa_consumer_secret', None)
        
        if not consumer_key or not consumer_secret:
            raise ValueError("M-Pesa consumer key and secret must be configured")
        
        base_url = MPesaService._get_base_url()
        auth_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        # Base64 encode consumer key:secret
        credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                auth_url,
                headers={
                    "Authorization": f"Basic {credentials}"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["access_token"]
    
    @staticmethod
    def _generate_password(timestamp: str, shortcode: str, passkey: str) -> str:
        """Generate M-Pesa API password."""
        data = f"{shortcode}{passkey}{timestamp}"
        return base64.b64encode(data.encode()).decode()
    
    @staticmethod
    async def stk_push(
        phone_number: str,
        amount: float,
        account_reference: str,
        transaction_desc: str = "Payment for booking"
    ) -> Dict[str, Any]:
        """
        Initiate M-Pesa STK Push (Lipa na M-Pesa Online).
        
        Args:
            phone_number: Customer phone number (format: 254712345678)
            amount: Amount to charge
            account_reference: Unique reference for the transaction
            transaction_desc: Transaction description
            
        Returns:
            Dictionary with checkout_request_id and customer_message
        """
        access_token = await MPesaService._get_access_token()
        base_url = MPesaService._get_base_url()
        stk_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
        
        shortcode = getattr(settings, 'mpesa_shortcode', None)
        passkey = getattr(settings, 'mpesa_passkey', None)
        callback_url = getattr(settings, 'mpesa_callback_url', None)
        
        if not shortcode or not passkey:
            raise ValueError("M-Pesa shortcode and passkey must be configured")
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password = MPesaService._generate_password(timestamp, shortcode, passkey)
        
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url or f"{settings.app_name}/api/v1/webhooks/mpesa",
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                stk_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def query_transaction_status(checkout_request_id: str) -> Dict[str, Any]:
        """Query M-Pesa transaction status."""
        access_token = await MPesaService._get_access_token()
        base_url = MPesaService._get_base_url()
        query_url = f"{base_url}/mpesa/stkpushquery/v1/query"
        
        shortcode = getattr(settings, 'mpesa_shortcode', None)
        passkey = getattr(settings, 'mpesa_passkey', None)
        
        if not shortcode or not passkey:
            raise ValueError("M-Pesa shortcode and passkey must be configured")
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password = MPesaService._generate_password(timestamp, shortcode, passkey)
        
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                query_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()

