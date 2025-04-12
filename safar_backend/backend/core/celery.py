import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# Add these to your CELERYBEAT_SCHEDULE
CELERYBEAT_SCHEDULE = {
    'notify-expiring-discounts': {
        'task': 'apps.core_apps.tasks.notify_expiring_discounts',
        'schedule': crontab(hour='10,18', minute=0),  # Run at 10 AM and 6 PM
    },
    'schedule-campaigns': {
        'task': 'apps.marketing.tasks.schedule_campaigns',
        'schedule': crontab(minute='*/15'),  # Run every 15 minutes
    },
    'end-expired-campaigns': {
        'task': 'apps.marketing.tasks.end_expired_campaigns',
        'schedule': crontab(minute='*/30'),  # Run every 30 minutes
    },
    'process-campaign-analytics': {
        'task': 'apps.marketing.tasks.process_campaign_analytics',
        'schedule': crontab(hour='*/3', minute=0),  # Run every 3 hours
    },
}
