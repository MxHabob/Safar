"""
OAuth2 service.
"""
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()


class OAuthService:
    """OAuth2 service."""
    
    @staticmethod
    async def verify_google_token(token: str) -> Dict[str, Any]:
        """Verify a Google ID token."""
        if not settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        try:
            async with httpx.AsyncClient() as client:
                # Verify token with Google
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
                )
                response.raise_for_status()
                data = response.json()
                
                # Verify audience
                if data.get("aud") != settings.google_client_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid token audience"
                    )
                
                return {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "given_name": data.get("given_name"),
                    "family_name": data.get("family_name"),
                    "picture": data.get("picture"),
                    "sub": data.get("sub"),  # Google user ID
                    "email_verified": data.get("email_verified", False)
                }
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying Google token: {str(e)}"
            )
    
    @staticmethod
    async def verify_apple_token(token: str) -> Dict[str, Any]:
        """Verify an Apple ID token."""
        if not settings.apple_client_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Apple OAuth is not configured"
            )
        
        try:
            # Apple uses JWT tokens, need to decode and verify
            from jose import jwt
            from jose import jwk
            from jose.exceptions import JWTError, ExpiredSignatureError, JWTClaimsError
            import json
            
            # Get Apple public keys
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    response = await client.get("https://appleid.apple.com/auth/keys")
                    response.raise_for_status()
                    keys = response.json()
                except httpx.HTTPStatusError as e:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Failed to fetch Apple public keys: {str(e)}"
                    )
                except httpx.RequestError as e:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Network error fetching Apple keys: {str(e)}"
                    )
            
            # Decode token header to get key ID
            try:
                unverified_header = jwt.get_unverified_header(token)
                kid = unverified_header.get("kid")
            except JWTError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Apple token format: {str(e)}"
                )
            
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Apple token missing key ID"
                )
            
            # Find the matching key
            key = None
            for key_data in keys.get("keys", []):
                if key_data.get("kid") == kid:
                    key = key_data
                    break
            
            if not key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Apple token key ID"
                )
            
            # Verify and decode token
            try:
                public_key = jwk.construct(key)
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    audience=settings.apple_client_id
                )
            except ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Apple token has expired"
                )
            except JWTClaimsError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Apple token validation failed: {str(e)}"
                )
            except JWTError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Apple token: {str(e)}"
                )
            
            return {
                "email": payload.get("email"),
                "sub": payload.get("sub"),  # Apple user ID
                "email_verified": payload.get("email_verified", False)
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Error verifying Apple token: {str(e)}"
            )

