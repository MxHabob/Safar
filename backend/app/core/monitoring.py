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
    async def get_health_status() -> Dict[str, Any]:
        """الحصول على حالة الصحة العامة - Get overall health status"""
        db_status = await HealthChecker.check_database()
        redis_status = await HealthChecker.check_redis()
        
        overall_status = "healthy"
        if db_status["status"] != "healthy" or redis_status["status"] != "healthy":
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": db_status,
                "redis": redis_status
            },
            "version": settings.app_version,
            "environment": settings.environment
        }


# Add to requirements if needed
# psutil==5.9.8

