"""
Klarna Payment Service
Klarna is a Buy Now Pay Later (BNPL) service popular in Europe and US.
Also supports Tamara (Middle East) and Tabby (UAE/Saudi) with similar APIs.
"""
import httpx
from typing import Dict, Any, Optional, Literal
from datetime import datetime, timedelta
import base64
from app.core.config import get_settings

settings = get_settings()


class KlarnaService:
    """Klarna payment service for Buy Now Pay Later transactions."""
    
    @staticmethod
    def _get_base_url(provider: str = "klarna") -> str:
        """Get API base URL based on provider."""
        if provider == "tamara":
            if settings.environment == "production":
                return "https://api.tamara.co"
            return "https://api-sandbox.tamara.co"
        elif provider == "tabby":
            if settings.environment == "production":
                return "https://api.tabby.ai"
            return "https://api.sandbox.tabby.ai"
        else:  # Klarna
            if settings.environment == "production":
                return "https://api.klarna.com"
            return "https://api.playground.klarna.com"
    
    @staticmethod
    def _get_auth_headers(provider: str = "klarna") -> Dict[str, str]:
        """Get authentication headers based on provider."""
        if provider == "tamara":
            token = getattr(settings, 'tamara_token', None)
            if not token:
                raise ValueError("Tamara token must be configured")
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        elif provider == "tabby":
            secret_key = getattr(settings, 'tabby_secret_key', None)
            if not secret_key:
                raise ValueError("Tabby secret key must be configured")
            return {
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json"
            }
        else:  # Klarna
            username = getattr(settings, 'klarna_username', None)
            password = getattr(settings, 'klarna_password', None)
            if not username or not password:
                raise ValueError("Klarna username and password must be configured")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            return {
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
    
    @staticmethod
    async def create_session(
        amount: float,
        currency: str,
        order_lines: list,
        billing_address: Optional[Dict] = None,
        shipping_address: Optional[Dict] = None,
        provider: Literal["klarna", "tamara", "tabby"] = "klarna"
    ) -> Dict[str, Any]:
        """
        Create a Klarna/Tamara/Tabby payment session.
        
        Args:
            amount: Total amount
            currency: Currency code (USD, EUR, SAR, AED, etc.)
            order_lines: List of order line items
            billing_address: Billing address
            shipping_address: Shipping address
            provider: Payment provider (klarna, tamara, tabby)
            
        Returns:
            Dictionary with session_id and client_token
        """
        base_url = KlarnaService._get_base_url(provider)
        headers = KlarnaService._get_auth_headers(provider)
        
        if provider == "tamara":
            session_url = f"{base_url}/checkout/v1/checkouts"
            payload = {
                "order_reference_id": f"order_{datetime.now().timestamp()}",
                "total_amount": {
                    "amount": f"{amount:.2f}",
                    "currency": currency
                },
                "description": "Booking payment",
                "items": order_lines,
                "billing_address": billing_address,
                "shipping_address": shipping_address,
                "country_code": currency[:2] if len(currency) >= 2 else "SA",
                "payment_type": "PAY_BY_INSTALMENTS",
                "instalments": 4,  # Default to 4 instalments
                "locale": "en_US",
                "success_url": getattr(settings, 'klarna_success_url', f"{settings.app_name}/payment/success"),
                "failure_url": getattr(settings, 'klarna_failure_url', f"{settings.app_name}/payment/failure"),
                "cancel_url": getattr(settings, 'klarna_cancel_url', f"{settings.app_name}/payment/cancel")
            }
        elif provider == "tabby":
            session_url = f"{base_url}/v2/checkout"
            payload = {
                "payment": {
                    "amount": f"{amount:.2f}",
                    "currency": currency,
                    "description": "Booking payment",
                    "buyer": {
                        "phone": billing_address.get("phone", "") if billing_address else "",
                        "email": billing_address.get("email", "") if billing_address else "",
                        "name": billing_address.get("name", "") if billing_address else ""
                    },
                    "order": {
                        "reference_id": f"order_{datetime.now().timestamp()}",
                        "items": order_lines
                    },
                    "shipping_address": shipping_address,
                    "buyer_history": {
                        "registered_since": datetime.now().isoformat(),
                        "loyalty_level": 0
                    }
                },
                "lang": "en",
                "merchant_code": getattr(settings, 'tabby_merchant_code', None)
            }
        else:  # Klarna
            session_url = f"{base_url}/payments/v1/sessions"
            payload = {
                "purchase_country": currency[:2] if len(currency) >= 2 else "US",
                "purchase_currency": currency,
                "locale": "en-US",
                "order_amount": int(amount * 100),  # Klarna uses cents
                "order_tax_amount": 0,
                "order_lines": order_lines,
                "billing_address": billing_address,
                "shipping_address": shipping_address
            }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(session_url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def create_order(
        authorization_token: str,
        amount: float,
        currency: str,
        order_lines: list,
        billing_address: Optional[Dict] = None,
        shipping_address: Optional[Dict] = None,
        provider: Literal["klarna", "tamara", "tabby"] = "klarna"
    ) -> Dict[str, Any]:
        """Create a Klarna/Tamara/Tabby order from authorization token."""
        base_url = KlarnaService._get_base_url(provider)
        headers = KlarnaService._get_auth_headers(provider)
        
        if provider == "tamara":
            order_url = f"{base_url}/orders/v1/orders"
            payload = {
                "order_reference_id": f"order_{datetime.now().timestamp()}",
                "total_amount": {
                    "amount": f"{amount:.2f}",
                    "currency": currency
                },
                "description": "Booking payment",
                "items": order_lines,
                "billing_address": billing_address,
                "shipping_address": shipping_address,
                "country_code": currency[:2] if len(currency) >= 2 else "SA",
                "payment_type": "PAY_BY_INSTALMENTS",
                "instalments": 4
            }
        elif provider == "tabby":
            order_url = f"{base_url}/v2/payments"
            payload = {
                "payment": {
                    "amount": f"{amount:.2f}",
                    "currency": currency,
                    "description": "Booking payment",
                    "buyer": {
                        "phone": billing_address.get("phone", "") if billing_address else "",
                        "email": billing_address.get("email", "") if billing_address else "",
                        "name": billing_address.get("name", "") if billing_address else ""
                    },
                    "order": {
                        "reference_id": f"order_{datetime.now().timestamp()}",
                        "items": order_lines
                    }
                }
            }
        else:  # Klarna
            order_url = f"{base_url}/payments/v1/authorizations/{authorization_token}/order"
            payload = {
                "purchase_country": currency[:2] if len(currency) >= 2 else "US",
                "purchase_currency": currency,
                "locale": "en-US",
                "order_amount": int(amount * 100),
                "order_tax_amount": 0,
                "order_lines": order_lines,
                "billing_address": billing_address,
                "shipping_address": shipping_address
            }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(order_url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

