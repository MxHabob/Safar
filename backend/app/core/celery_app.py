"""
Celery configuration for background tasks.
"""
from celery import Celery
from app.core.config import get_settings
from app.core.logging_config import setup_logging

settings = get_settings()

# Setup logging for Celery workers
# This ensures Celery workers use the same logging configuration as the main app
setup_logging()

# Create Celery app
celery_app = Celery(
    "safar",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.modules.notifications.tasks",
        "app.modules.payments.tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    # Ensure broker connections are retried on startup (Celery 6+ behavior)
    broker_connection_retry_on_startup=True,
    # Configure Celery logging
    worker_log_format='[%(asctime)s: %(levelname)s/%(processName)s] %(message)s',
    worker_task_log_format='[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s',
)

