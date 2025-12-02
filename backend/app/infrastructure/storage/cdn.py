"""
CDN (Content Delivery Network) integration for listing images.

Supports Cloudflare and AWS CloudFront with automatic WebP/AVIF conversion.
"""
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from io import BytesIO
from PIL import Image
import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize S3 client for CloudFront (if using AWS)
s3_client = None
cloudfront_client = None

if getattr(settings, 'aws_access_key_id', None) and getattr(settings, 'aws_secret_access_key', None):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=getattr(settings, 'aws_region', 'us-east-1')
    )
    cloudfront_client = boto3.client(
        'cloudfront',
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=getattr(settings, 'aws_region', 'us-east-1')
    )


class CDNService:
    """Service for CDN operations including image optimization."""
    
    @staticmethod
    def convert_to_webp(image_data: bytes, quality: int = 85) -> bytes:
        """
        Convert image to WebP format.
        
        Args:
            image_data: Original image bytes
            quality: WebP quality (1-100, default 85)
        
        Returns:
            WebP image bytes
        """
        try:
            img = Image.open(BytesIO(image_data))
            
            # Convert RGBA to RGB if necessary (WebP supports transparency but some use cases don't)
            if img.mode == 'RGBA':
                # Keep transparency for WebP
                pass
            elif img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            
            output = BytesIO()
            img.save(output, format='WEBP', quality=quality, method=6)  # method=6 for best compression
            return output.getvalue()
        except Exception as e:
            logger.error(f"Failed to convert image to WebP: {e}")
            raise
    
    @staticmethod
    def convert_to_avif(image_data: bytes, quality: int = 80) -> bytes:
        """
        Convert image to AVIF format.
        
        Args:
            image_data: Original image bytes
            quality: AVIF quality (1-100, default 80)
        
        Returns:
            AVIF image bytes
        """
        try:
            img = Image.open(BytesIO(image_data))
            
            # Convert to RGB/RGBA
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            
            output = BytesIO()
            # Note: AVIF support requires pillow-avif-plugin or pillow-simd
            # Fallback to WebP if AVIF not available
            try:
                img.save(output, format='AVIF', quality=quality)
            except (ValueError, OSError):
                # AVIF not available, fallback to WebP
                logger.warning("AVIF format not available, falling back to WebP")
                img.save(output, format='WEBP', quality=quality)
            return output.getvalue()
        except Exception as e:
            logger.error(f"Failed to convert image to AVIF: {e}")
            raise
    
    @staticmethod
    async def upload_to_cdn(
        image_data: bytes,
        filename: str,
        content_type: str = "image/jpeg",
        optimize: bool = True,
        formats: list = None
    ) -> Dict[str, str]:
        """
        Upload image to CDN with automatic format conversion.
        
        Args:
            image_data: Image bytes
            filename: Filename (without extension)
            content_type: Original content type
            optimize: Whether to optimize images
            formats: List of formats to generate (default: ['webp', 'avif'])
        
        Returns:
            Dictionary with URLs for each format
        """
        if formats is None:
            formats = ['webp', 'avif']
        
        urls = {}
        cdn_type = getattr(settings, 'cdn_type', 'cloudflare').lower()
        
        if cdn_type == 'cloudflare' or cdn_type == 'cloudflare_images':
            # Cloudflare Images API
            return await CDNService._upload_to_cloudflare_images(
                image_data, filename, content_type, optimize, formats
            )
        elif cdn_type == 'cloudfront' or cdn_type == 's3':
            # AWS CloudFront + S3
            return await CDNService._upload_to_s3_cloudfront(
                image_data, filename, content_type, optimize, formats
            )
        else:
            # Fallback: return original URL (no CDN)
            logger.warning(f"Unknown CDN type: {cdn_type}, returning original URL")
            base_url = getattr(settings, 'cdn_base_url', '')
            return {
                'original': f"{base_url}/{filename}",
                'webp': f"{base_url}/{filename}.webp" if 'webp' in formats else None,
                'avif': f"{base_url}/{filename}.avif" if 'avif' in formats else None,
            }
    
    @staticmethod
    async def _upload_to_cloudflare_images(
        image_data: bytes,
        filename: str,
        content_type: str,
        optimize: bool,
        formats: list
    ) -> Dict[str, str]:
        """Upload to Cloudflare Images API."""
        import httpx
        
        cloudflare_account_id = getattr(settings, 'cloudflare_account_id', None)
        cloudflare_api_token = getattr(settings, 'cloudflare_api_token', None)
        
        if not cloudflare_account_id or not cloudflare_api_token:
            raise ValueError("Cloudflare credentials not configured")
        
        urls = {}
        
        # Upload original
        async with httpx.AsyncClient() as client:
            # Cloudflare Images API endpoint
            upload_url = f"https://api.cloudflare.com/client/v4/accounts/{cloudflare_account_id}/images/v1"
            
            files = {
                'file': (filename, image_data, content_type)
            }
            data = {
                'requireSignedURLs': 'false',
                'metadata': f'{{"filename":"{filename}"}}'
            }
            
            response = await client.post(
                upload_url,
                files=files,
                data=data,
                headers={
                    'Authorization': f'Bearer {cloudflare_api_token}'
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    image_info = result.get('result', {})
                    original_url = image_info.get('variants', [])[0] if image_info.get('variants') else None
                    urls['original'] = original_url
                    
                    # Cloudflare automatically generates WebP/AVIF variants
                    # Extract variant URLs
                    variants = image_info.get('variants', [])
                    for variant in variants:
                        if 'webp' in variant.lower():
                            urls['webp'] = variant
                        elif 'avif' in variant.lower():
                            urls['avif'] = variant
            else:
                logger.error(f"Cloudflare Images upload failed: {response.status_code} - {response.text}")
                raise Exception(f"Cloudflare upload failed: {response.status_code}")
        
        return urls
    
    @staticmethod
    async def _upload_to_s3_cloudfront(
        image_data: bytes,
        filename: str,
        content_type: str,
        optimize: bool,
        formats: list
    ) -> Dict[str, str]:
        """Upload to S3 with CloudFront distribution."""
        if not s3_client:
            raise ValueError("AWS S3 client not configured")
        
        bucket_name = getattr(settings, 's3_bucket_name', None)
        cloudfront_domain = getattr(settings, 'cloudfront_domain', None)
        
        if not bucket_name:
            raise ValueError("S3 bucket name not configured")
        
        urls = {}
        base_path = getattr(settings, 'cdn_base_path', 'images')
        
        # Upload original
        original_key = f"{base_path}/{filename}"
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=original_key,
                Body=image_data,
                ContentType=content_type,
                CacheControl='public, max-age=31536000'  # 1 year cache
            )
            urls['original'] = f"https://{cloudfront_domain}/{original_key}" if cloudfront_domain else f"s3://{bucket_name}/{original_key}"
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise
        
        # Upload optimized formats
        if optimize:
            if 'webp' in formats:
                try:
                    webp_data = CDNService.convert_to_webp(image_data)
                    webp_key = f"{base_path}/{filename}.webp"
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=webp_key,
                        Body=webp_data,
                        ContentType='image/webp',
                        CacheControl='public, max-age=31536000'
                    )
                    urls['webp'] = f"https://{cloudfront_domain}/{webp_key}" if cloudfront_domain else f"s3://{bucket_name}/{webp_key}"
                except Exception as e:
                    logger.error(f"WebP conversion/upload failed: {e}")
            
            if 'avif' in formats:
                try:
                    avif_data = CDNService.convert_to_avif(image_data)
                    avif_key = f"{base_path}/{filename}.avif"
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=avif_key,
                        Body=avif_data,
                        ContentType='image/avif',
                        CacheControl='public, max-age=31536000'
                    )
                    urls['avif'] = f"https://{cloudfront_domain}/{avif_key}" if cloudfront_domain else f"s3://{bucket_name}/{avif_key}"
                except Exception as e:
                    logger.error(f"AVIF conversion/upload failed: {e}")
        
        return urls
    
    @staticmethod
    def get_image_url(filename: str, format: Optional[str] = None) -> str:
        """
        Get CDN URL for an image.
        
        Args:
            filename: Image filename
            format: Preferred format ('webp', 'avif', or None for original)
        
        Returns:
            CDN URL
        """
        cdn_base_url = getattr(settings, 'cdn_base_url', '')
        cloudfront_domain = getattr(settings, 'cloudfront_domain', None)
        
        if cloudfront_domain:
            base_url = f"https://{cloudfront_domain}"
        elif cdn_base_url:
            base_url = cdn_base_url
        else:
            base_url = getattr(settings, 'base_url', '')
        
        base_path = getattr(settings, 'cdn_base_path', 'images')
        
        if format:
            # Add format extension
            if format == 'webp':
                return f"{base_url}/{base_path}/{filename}.webp"
            elif format == 'avif':
                return f"{base_url}/{base_path}/{filename}.avif"
        
        return f"{base_url}/{base_path}/{filename}"
    
    @staticmethod
    async def invalidate_cache(urls: list) -> bool:
        """
        Invalidate CDN cache for given URLs.
        
        Args:
            urls: List of URLs to invalidate
        
        Returns:
            True if successful
        """
        cdn_type = getattr(settings, 'cdn_type', 'cloudflare').lower()
        
        if cdn_type == 'cloudfront':
            # CloudFront cache invalidation
            distribution_id = getattr(settings, 'cloudfront_distribution_id', None)
            if not distribution_id or not cloudfront_client:
                logger.warning("CloudFront distribution ID not configured")
                return False
            
            try:
                cloudfront_client.create_invalidation(
                    DistributionId=distribution_id,
                    InvalidationBatch={
                        'Paths': {
                            'Quantity': len(urls),
                            'Items': urls
                        },
                        'CallerReference': f"invalidation-{int(datetime.now().timestamp())}"
                    }
                )
                return True
            except ClientError as e:
                logger.error(f"CloudFront cache invalidation failed: {e}")
                return False
        elif cdn_type == 'cloudflare':
            # Cloudflare cache purge
            zone_id = getattr(settings, 'cloudflare_zone_id', None)
            cloudflare_api_token = getattr(settings, 'cloudflare_api_token', None)
            
            if not zone_id or not cloudflare_api_token:
                logger.warning("Cloudflare zone ID not configured")
                return False
            
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache",
                    json={"files": urls},
                    headers={'Authorization': f'Bearer {cloudflare_api_token}'},
                    timeout=30.0
                )
                return response.status_code == 200
        else:
            logger.warning(f"Cache invalidation not supported for CDN type: {cdn_type}")
            return False

