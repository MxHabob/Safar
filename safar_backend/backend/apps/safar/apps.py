from django.apps import AppConfig


class SaferConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.safar'

    # def ready(self):
    #     import apps.safar.signals
