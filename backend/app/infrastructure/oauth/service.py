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
    
    @staticmethod
    async def verify_facebook_token(token: str) -> Dict[str, Any]:
        """Verify a Facebook access token."""
        if not settings.facebook_app_id or not settings.facebook_app_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Facebook OAuth is not configured"
            )
        
        try:
            async with httpx.AsyncClient() as client:
                # First, verify the token and get user info
                response = await client.get(
                    "https://graph.facebook.com/me",
                    params={
                        "access_token": token,
                        "fields": "id,name,email,picture",
                        "appsecret_proof": settings.facebook_app_secret  # For security
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Verify token is valid for our app
                debug_response = await client.get(
                    "https://graph.facebook.com/debug_token",
                    params={
                        "input_token": token,
                        "access_token": f"{settings.facebook_app_id}|{settings.facebook_app_secret}"
                    }
                )
                debug_response.raise_for_status()
                debug_data = debug_response.json()
                
                if debug_data.get("data", {}).get("app_id") != settings.facebook_app_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Facebook token app ID"
                    )
                
                return {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "picture": data.get("picture", {}).get("data", {}).get("url") if data.get("picture") else None,
                    "sub": data.get("id"),  # Facebook user ID
                    "email_verified": True  # Facebook emails are verified
                }
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Facebook token: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying Facebook token: {str(e)}"
            )
    
    @staticmethod
    async def verify_github_token(token: str) -> Dict[str, Any]:
        """Verify a GitHub access token."""
        if not settings.github_client_id or not settings.github_client_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub OAuth is not configured"
            )
        
        try:
            async with httpx.AsyncClient() as client:
                # Get user info from GitHub
                response = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Get user email (may require additional request)
                email = data.get("email")
                if not email:
                    # Try to get primary email
                    email_response = await client.get(
                        "https://api.github.com/user/emails",
                        headers={
                            "Authorization": f"token {token}",
                            "Accept": "application/vnd.github.v3+json"
                        }
                    )
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        primary_email = next((e for e in emails if e.get("primary")), None)
                        if primary_email:
                            email = primary_email.get("email")
                            email_verified = primary_email.get("verified", False)
                        else:
                            email_verified = False
                    else:
                        email_verified = False
                else:
                    email_verified = True
                
                return {
                    "email": email,
                    "name": data.get("name") or data.get("login"),
                    "picture": data.get("avatar_url"),
                    "sub": str(data.get("id")),  # GitHub user ID
                    "email_verified": email_verified
                }
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid GitHub token: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying GitHub token: {str(e)}"
            )

