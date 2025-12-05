#!/usr/bin/env python3
"""
Uvicorn runner script with proper logging configuration.
This ensures logs appear correctly in Docker containers.
"""
import sys
import os
import logging

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup logging BEFORE importing uvicorn
# This is critical - logging must be configured before uvicorn starts
from app.core.logging_config import setup_logging

# Initialize logging FIRST
setup_logging()

# Test logging to ensure it works
logger = logging.getLogger(__name__)
logger.info("=" * 60)
logger.info("Starting Safar Backend Server...")
logger.info("=" * 60)

# Configure uvicorn loggers to use our handlers
# This must be done after setup_logging() but before importing uvicorn
root_logger = logging.getLogger()
console_handlers = [h for h in root_logger.handlers if isinstance(h, logging.StreamHandler) and h.stream == sys.stdout]

if console_handlers:
    console_handler = console_handlers[0]
    
    # Configure uvicorn loggers to use our console handler
    # Set propagate=True to ensure logs also go to root logger
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)
    uvicorn_logger.handlers = []
    uvicorn_logger.addHandler(console_handler)
    uvicorn_logger.propagate = True  # Allow propagation to root logger
    
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.setLevel(logging.INFO)
    uvicorn_error_logger.handlers = []
    uvicorn_error_logger.addHandler(console_handler)
    uvicorn_error_logger.propagate = True  # Allow propagation
    
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.setLevel(logging.INFO)  # Show access logs
    uvicorn_access_logger.handlers = []
    uvicorn_access_logger.addHandler(console_handler)
    uvicorn_access_logger.propagate = True  # Allow propagation
else:
    # Fallback: create a console handler if none exists
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # Configure uvicorn loggers
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)
        logger.handlers = []
        logger.addHandler(console_handler)
        logger.propagate = True

# Now import and run uvicorn
import uvicorn

if __name__ == "__main__":
    # Determine if we're in development or production
    is_reload = os.getenv("ENVIRONMENT", "development").lower() != "production"
    workers = int(os.getenv("UVICORN_WORKERS", "1"))
    
    # Run uvicorn WITHOUT log_config - we rely on setup_logging() instead
    # This ensures our logging configuration is used
    if workers > 1:
        # Production mode with multiple workers
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            workers=workers,
            use_colors=False,  # Disable colors in Docker
            access_log=True,  # Enable access logs
            log_level="info",  # Set log level explicitly
        )
    else:
        # Development mode with reload
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=is_reload,
            use_colors=False,  # Disable colors in Docker
            access_log=True,  # Enable access logs
            log_level="info",  # Set log level explicitly
        )

