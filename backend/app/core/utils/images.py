"""
Image URL utilities for CDN integration.
Ensures all image URLs go through CDN for optimization and caching.
"""
from typing import Optional
from app.core.config import get_settings
from app.infrastructure.storage.cdn import CDNService

settings = get_settings()


def get_cdn_url(url: Optional[str]) -> Optional[str]:
    """
    Convert any image URL (S3, OAuth, direct) to CDN URL.
    
    If URL is already a CDN URL, returns as-is.
    If URL is None or empty, returns None.
    If CDN is not configured, returns original URL.
    
    Args:
        url: Original image URL (can be S3, OAuth provider URL, or None)
    
    Returns:
        CDN URL if configured, otherwise original URL or None
    """
    if not url:
        return None
    
    # If already a CDN URL, return as-is
    cdn_base_url = getattr(settings, 'cdn_base_url', None)
    if cdn_base_url and url.startswith(cdn_base_url):
        return url
    
    # If CDN is not configured, return original URL
    if not cdn_base_url:
        return url
    
    # Extract filename from URL
    # Handle various URL formats:
    # - https://s3.amazonaws.com/bucket/path/image.jpg
    # - https://lh3.googleusercontent.com/...
    # - https://graph.facebook.com/.../picture
    # - /uploads/image.jpg
    
    # Try to extract filename
    filename = url.split('/')[-1].split('?')[0]  # Remove query params
    
    # If filename looks valid (has extension), use CDN
    if '.' in filename and len(filename.split('.')[-1]) <= 5:
        # Use CDN service to get proper URL
        try:
            return CDNService.get_image_url(filename)
        except Exception:
            # Fallback to original URL if CDN fails
            return url
    
    # If we can't determine filename, return original URL
    return url

