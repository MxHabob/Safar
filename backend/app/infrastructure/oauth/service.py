"""
OAuth2 service.
"""
from typing import Optional, Dict, Any
import logging
import httpx
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class OAuthService:
    """OAuth2 service."""
    
    @staticmethod
    async def verify_google_token(token: str) -> Dict[str, Any]:
        """
        Verify a Google ID token using Google Identity Services.
        
        Uses Google's tokeninfo endpoint to verify the ID token.
        This endpoint validates the token signature, expiration, and audience.
        """
        logger.info("Verifying Google OAuth token")
        
        if not settings.google_client_id:
            logger.error("Google OAuth is not configured - missing google_client_id")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Verify token with Google's tokeninfo endpoint
                # This endpoint validates the token signature, expiration, and audience
                logger.debug(f"Calling Google tokeninfo endpoint for token (first 20 chars): {token[:20]}...")
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
                )
                response.raise_for_status()
                data = response.json()
                
                logger.debug(f"Google tokeninfo response: audience={data.get('aud')}, email={data.get('email')}, exp={data.get('exp')}")
                
                # Verify audience matches our client ID
                token_audience = data.get("aud")
                if token_audience != settings.google_client_id:
                    logger.warning(
                        f"Google token audience mismatch: expected={settings.google_client_id}, "
                        f"got={token_audience}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Invalid token audience. Expected {settings.google_client_id}, got {token_audience}"
                    )
                
                # Check if token is expired (tokeninfo endpoint should handle this, but double-check)
                exp = data.get("exp")
                if exp:
                    import time
                    try:
                        # Convert exp to float (it might be string or number from JSON)
                        exp_timestamp = float(exp) if exp else None
                        current_time = time.time()
                        if exp_timestamp and current_time > exp_timestamp:
                            logger.warning(
                                f"Google token expired: exp={exp_timestamp}, current={current_time}, "
                                f"diff={current_time - exp_timestamp} seconds"
                            )
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Google token has expired"
                            )
                    except (ValueError, TypeError):
                        # If exp is not a valid number, skip expiration check
                        # Google's tokeninfo endpoint should handle this anyway
                        logger.debug(f"Could not parse expiration timestamp: {exp}")
                        pass
                
                # Convert email_verified to boolean (Google API may return string "true"/"false")
                email_verified = data.get("email_verified", False)
                if isinstance(email_verified, str):
                    email_verified = email_verified.lower() in ("true", "1", "yes")
                elif email_verified is None:
                    email_verified = False
                else:
                    email_verified = bool(email_verified)
                
                user_info = {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "given_name": data.get("given_name"),
                    "family_name": data.get("family_name"),
                    "picture": data.get("picture"),
                    "sub": data.get("sub"),  # Google user ID
                    "email_verified": email_verified
                }
                logger.info(f"Google token verified successfully for email: {user_info.get('email')}")
                return user_info
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(
                f"Google token verification failed with HTTP {e.response.status_code}: {error_detail}"
            )
            if e.response.status_code == 400:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Google token format or signature: {error_detail}"
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to verify Google token: {error_detail}"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"Unexpected error verifying Google token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying Google token: {str(e)}"
            )
    
    @staticmethod
    async def verify_apple_token(token: str) -> Dict[str, Any]:
        """Verify an Apple ID token."""
        logger.info("Verifying Apple OAuth token")
        
        if not settings.apple_client_id:
            logger.error("Apple OAuth is not configured - missing apple_client_id")
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
            
            user_info = {
                "email": payload.get("email"),
                "sub": payload.get("sub"),  # Apple user ID
                "email_verified": payload.get("email_verified", False)
            }
            logger.info(f"Apple token verified successfully for email: {user_info.get('email')}")
            return user_info
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"Unexpected error verifying Apple token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Error verifying Apple token: {str(e)}"
            )
    
    @staticmethod
    async def verify_facebook_token(token: str) -> Dict[str, Any]:
        """Verify a Facebook access token."""
        logger.info("Verifying Facebook OAuth token")
        
        if not settings.facebook_app_id or not settings.facebook_app_secret:
            logger.error("Facebook OAuth is not configured - missing facebook_app_id or facebook_app_secret")
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
                
                token_app_id = debug_data.get("data", {}).get("app_id")
                if token_app_id != settings.facebook_app_id:
                    logger.warning(
                        f"Facebook token app ID mismatch: expected={settings.facebook_app_id}, "
                        f"got={token_app_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Invalid Facebook token app ID. Expected {settings.facebook_app_id}, got {token_app_id}"
                    )
                
                user_info = {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "picture": data.get("picture", {}).get("data", {}).get("url") if data.get("picture") else None,
                    "sub": data.get("id"),  # Facebook user ID
                    "email_verified": True  # Facebook emails are verified
                }
                logger.info(f"Facebook token verified successfully for email: {user_info.get('email')}")
                return user_info
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(
                f"Facebook token verification failed with HTTP {e.response.status_code}: {error_detail}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Facebook token: {error_detail}"
            )
        except Exception as e:
            logger.exception(f"Unexpected error verifying Facebook token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying Facebook token: {str(e)}"
            )
    
    @staticmethod
    async def verify_github_token(token: str) -> Dict[str, Any]:
        """Verify a GitHub access token."""
        logger.info("Verifying GitHub OAuth token")
        
        if not settings.github_client_id or not settings.github_client_secret:
            logger.error("GitHub OAuth is not configured - missing github_client_id or github_client_secret")
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
                
                user_info = {
                    "email": email,
                    "name": data.get("name") or data.get("login"),
                    "picture": data.get("avatar_url"),
                    "sub": str(data.get("id")),  # GitHub user ID
                    "email_verified": email_verified
                }
                logger.info(f"GitHub token verified successfully for email: {user_info.get('email')}")
                return user_info
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(
                f"GitHub token verification failed with HTTP {e.response.status_code}: {error_detail}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid GitHub token: {error_detail}"
            )
        except Exception as e:
            logger.exception(f"Unexpected error verifying GitHub token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error verifying GitHub token: {str(e)}"
            )

