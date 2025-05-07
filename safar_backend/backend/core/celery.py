import os
from celery import Celery
from celery.schedules import crontab
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


app.conf.beat_schedule = CELERYBEAT_SCHEDULE = {
    'notify-expiring-discounts': {
        'task': 'apps.core_apps.tasks.notify_expiring_discounts',
        'schedule': crontab(hour='10,18', minute=0),
    },
    'schedule-campaigns': {
        'task': 'apps.marketing.tasks.schedule_campaigns',
        'schedule': crontab(minute='*/15'),
    },
    'end-expired-campaigns': {
        'task': 'apps.marketing.tasks.end_expired_campaigns',
        'schedule': crontab(minute='*/30'),
    },
    'process-campaign-analytics': {
        'task': 'apps.marketing.tasks.process_campaign_analytics',
        'schedule': crontab(hour='*/3', minute=0),
    },
}
