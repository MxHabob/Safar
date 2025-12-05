#!/usr/bin/env python3
"""
Uvicorn runner script with proper logging configuration.
This ensures logs appear correctly in Docker containers.
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup logging BEFORE importing uvicorn
from app.core.logging_config import setup_logging, get_uvicorn_log_config

# Initialize logging
setup_logging()

# Now import and run uvicorn
import uvicorn
from app.core.config import get_settings

settings = get_settings()

if __name__ == "__main__":
    # Determine if we're in development or production
    is_reload = os.getenv("ENVIRONMENT", "development").lower() != "production"
    workers = int(os.getenv("UVICORN_WORKERS", "1"))
    
    # Get log config
    log_config = get_uvicorn_log_config()
    
    # Run uvicorn with proper logging
    if workers > 1:
        # Production mode with multiple workers
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            workers=workers,
            log_config=log_config,
            use_colors=False,  # Disable colors in Docker
            access_log=True,  # Enable access logs
        )
    else:
        # Development mode with reload
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=is_reload,
            log_config=log_config,
            use_colors=False,  # Disable colors in Docker
            access_log=True,  # Enable access logs
        )

