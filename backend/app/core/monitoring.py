"""
نظام المراقبة والـ Health Checks - Monitoring & Health Checks
"""
from datetime import datetime
from typing import Dict, Any
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal, engine
from app.infrastructure.cache.redis import get_redis
from app.core.config import get_settings

settings = get_settings()


class HealthChecker:
    """فحص صحة النظام - Health checker"""
    
    @staticmethod
    async def check_database() -> Dict[str, Any]:
        """فحص قاعدة البيانات - Check database"""
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
        """فحص Redis - Check Redis"""
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
    async def check_stripe() -> Dict[str, Any]:
        """فحص Stripe - Check Stripe configuration"""
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
        """الحصول على معلومات النظام - Get system info"""
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
        """الحصول على حالة الصحة العامة - Get overall health status"""
        db_status = await HealthChecker.check_database()
        redis_status = await HealthChecker.check_redis()
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
                "database": db_status,
                "redis": redis_status,
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

