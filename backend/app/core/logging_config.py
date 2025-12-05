"""
Enhanced logging configuration for structured JSON and file/console handlers.
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any
import json
from datetime import datetime

from app.core.config import get_settings

settings = get_settings()


class RateLimitErrorFilter(logging.Filter):
    """Filter to suppress noisy 429 error tracebacks in ASGI logs."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Suppress full tracebacks for 429 errors - they're expected behavior
        message = record.getMessage()
        if "429" in message or "Too many requests" in message:
            # If this is an ASGI error log with a traceback, suppress it
            # We still want warnings from our middleware, but not the full ASGI stack trace
            if record.exc_info and "ASGI application" in message:
                # Remove exception info to suppress traceback
                record.exc_info = None
                record.exc_text = None
        return True


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "ip_address"):
            log_data["ip_address"] = record.ip_address
        
        return json.dumps(log_data, ensure_ascii=False)


# Global flag to prevent multiple setups
_logging_configured = False

def setup_logging():
    """Configure root logging with console and rotating file handlers."""
    global _logging_configured
    
    # Prevent multiple configurations
    if _logging_configured:
        return
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    # Always clear existing handlers to ensure clean setup
    root_logger.handlers.clear()
    
    # Console handler - CRITICAL: Must use sys.stdout for Docker
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        logs_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Use JSON formatter in production
    if settings.environment == "production":
        file_formatter = JSONFormatter()
    else:
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = RotatingFileHandler(
        logs_dir / "errors.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_handler)
    
    # Set levels for third-party loggers
    # Ensure uvicorn loggers use the same handlers
    # Note: These will be configured again in run.py after uvicorn imports
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)
    uvicorn_logger.handlers = []  # Clear existing handlers
    uvicorn_logger.addHandler(console_handler)  # Use our console handler
    uvicorn_logger.propagate = True  # Allow propagation to root logger
    
    # Add filter to suppress 429 error tracebacks
    rate_limit_filter = RateLimitErrorFilter()
    uvicorn_logger.addFilter(rate_limit_filter)
    
    # Configure uvicorn.error logger
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.setLevel(logging.INFO)
    uvicorn_error_logger.handlers = []
    uvicorn_error_logger.addHandler(console_handler)
    uvicorn_error_logger.propagate = True  # Allow propagation
    
    # Configure uvicorn.access logger
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.setLevel(logging.INFO)  # Show access logs
    uvicorn_access_logger.handlers = []
    uvicorn_access_logger.addHandler(console_handler)
    uvicorn_access_logger.propagate = True  # Allow propagation
    
    # Mark as configured
    _logging_configured = True
    
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Configure Celery loggers
    celery_logger = logging.getLogger("celery")
    celery_logger.setLevel(logging.INFO)
    celery_task_logger = logging.getLogger("celery.task")
    celery_task_logger.setLevel(logging.INFO)
    celery_beat_logger = logging.getLogger("celery.beat")
    celery_beat_logger.setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Convenience helper to retrieve a named logger."""
    return logging.getLogger(name)


def get_uvicorn_log_config() -> dict[str, Any]:
    """
    Get logging configuration dictionary for uvicorn.
    This ensures uvicorn uses the same logging setup as the application.
    """
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": "INFO",
                "propagate": False,
            },
        },
        "root": {
            "level": "INFO",
            "handlers": ["default"],
        },
    }
