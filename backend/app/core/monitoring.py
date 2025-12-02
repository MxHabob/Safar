"""
Monitoring and health checks.
"""
from datetime import datetime
from typing import Dict, Any
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal, engine, get_read_replica_session
from app.infrastructure.cache.redis import get_redis
from app.core.config import get_settings
import httpx

settings = get_settings()


class HealthChecker:
    """Health checker utilities."""
    
    @staticmethod
    async def check_database() -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(text("SELECT 1"))
                result.scalar()
            return {
                "status": "healthy",
                "message": "Database connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Database connection failed: {str(e)}"
            }
    
    @staticmethod
    async def check_redis() -> Dict[str, Any]:
        """Check Redis connectivity."""
        try:
            redis = await get_redis()
            await redis.ping()
            return {
                "status": "healthy",
                "message": "Redis connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Redis connection failed: {str(e)}"
            }
    
    @staticmethod
    async def check_replica_database() -> Dict[str, Any]:
        """Check read replica database connectivity."""
        try:
            replica_session_factory = get_read_replica_session()
            if not replica_session_factory:
                return {
                    "status": "not_configured",
                    "message": "Read replica not configured"
                }
            
            async with replica_session_factory() as session:
                result = await session.execute(text("SELECT 1"))
                result.scalar()
            return {
                "status": "healthy",
                "message": "Read replica connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Read replica connection failed: {str(e)}"
            }
    
    @staticmethod
    async def check_cdn() -> Dict[str, Any]:
        """Check CDN reachability."""
        try:
            cdn_base_url = getattr(settings, 'cdn_base_url', None)
            if not cdn_base_url:
                return {
                    "status": "not_configured",
                    "message": "CDN not configured"
                }
            
            # Try HEAD request to CDN base URL or health endpoint
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Try health endpoint first, fallback to base URL
                health_urls = [
                    f"{cdn_base_url.rstrip('/')}/health",
                    f"{cdn_base_url.rstrip('/')}/.well-known/health",
                    cdn_base_url
                ]
                
                for url in health_urls:
                    try:
                        response = await client.head(url, follow_redirects=True)
                        if response.status_code < 500:
                            return {
                                "status": "healthy",
                                "message": f"CDN reachable at {url}"
                            }
                    except Exception:
                        continue
                
                # If all URLs fail, return unhealthy
                return {
                    "status": "unhealthy",
                    "message": "CDN not reachable"
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"CDN check failed: {str(e)}"
            }
    
    @staticmethod
    async def check_stripe() -> Dict[str, Any]:
        """Check Stripe configuration."""
        try:
            if not settings.stripe_secret_key:
                return {
                    "status": "unhealthy",
                    "message": "Stripe secret key not configured"
                }
            # Verify Stripe key format (starts with sk_)
            if not settings.stripe_secret_key.startswith(("sk_test_", "sk_live_")):
                return {
                    "status": "unhealthy",
                    "message": "Invalid Stripe secret key format"
                }
            return {
                "status": "healthy",
                "message": "Stripe configuration valid"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Stripe check failed: {str(e)}"
            }
    
    @staticmethod
    async def get_system_info() -> Dict[str, Any]:
        """Get basic system information metrics."""
        import psutil
        import os
        
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
            "process_count": len(psutil.pids()),
            "uptime_seconds": (datetime.utcnow() - datetime.utcnow()).total_seconds()  # Placeholder
        }
    
    @staticmethod
    async def check_exclusion_constraint() -> Dict[str, Any]:
        """Check if booking exclusion constraint exists (CRITICAL for double-booking prevention)"""
        try:
            async with AsyncSessionLocal() as session:
                query = text("""
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = 'bookings' 
                    AND constraint_name = 'excl_booking_overlap'
                    AND constraint_type = 'EXCLUDE'
                """)
                result = await session.execute(query)
                constraint = result.scalar_one_or_none()
                
                if constraint:
                    return {
                        "status": "healthy",
                        "message": "Exclusion constraint exists"
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "message": "CRITICAL: Exclusion constraint 'excl_booking_overlap' not found"
                    }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Failed to check exclusion constraint: {str(e)}"
            }
    
    @staticmethod
    async def get_health_status() -> Dict[str, Any]:
        """Get overall health status for core services."""
        db_status = await HealthChecker.check_database()
        replica_db_status = await HealthChecker.check_replica_database()
        redis_status = await HealthChecker.check_redis()
        cdn_status = await HealthChecker.check_cdn()
        stripe_status = await HealthChecker.check_stripe()
        
        # Only check exclusion constraint in production (it's critical there)
        exclusion_constraint_status = None
        if settings.environment == "production":
            exclusion_constraint_status = await HealthChecker.check_exclusion_constraint()
        
        overall_status = "healthy"
        critical_services = [db_status, redis_status, stripe_status]
        if exclusion_constraint_status:
            critical_services.append(exclusion_constraint_status)
        
        if any(s["status"] != "healthy" for s in critical_services):
            overall_status = "unhealthy"
        
        health_data = {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "primary_db": db_status,
                "replica_db": replica_db_status,
                "redis_cluster": redis_status,
                "cdn": cdn_status,
                "stripe": stripe_status
            },
            "version": settings.app_version,
            "environment": settings.environment
        }
        
        if exclusion_constraint_status:
            health_data["services"]["exclusion_constraint"] = exclusion_constraint_status
        
        return health_data


# Add to requirements if needed
# psutil==5.9.8

