from pathlib import Path
import environ
from django.core.management.utils import get_random_secret_key
import os
from django.core.exceptions import ImproperlyConfigured
from datetime import timedelta

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    DEVELOPMENTMODE=(bool, False)
)


# Logging Directory
log_dir = BASE_DIR / "logs"
try:
    log_dir.mkdir(parents=True, exist_ok=True)
except OSError as e:
    raise ImproperlyConfigured(f"Unable to create log directory: {e}")

DEBUG = env("DJANGO_DEBUG", default=False)
DEVELOPMENTMODE = env("DEVELOPMENTMODE", default=False)

# Secret key
SECRET_KEY = env('DJANGO_SECRET_KEY', default=get_random_secret_key())

# Allowed hosts
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    "127.0.0.1",
    "localhost",
])

# CORS settings
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    "http://localhost",
    "http://127.0.0.1",
])

CORS_ALLOW_CREDENTIALS = True

if DEVELOPMENTMODE:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False



CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": ["redis://red-ctk0mhbtq21c73e5i4gg:6379/0"],
        },
    },
}




# Application definition
INSTALLED_APPS = [
    "daphne",
    "django.contrib.gis",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "drf_yasg",
    "rest_framework",
    "rest_framework_api_key",
    "djoser",
    "storages",
    "social_django",
    'cities_light',
    'phonenumber_field',
    'django_filters',
    "django_celery_beat",
    "django_celery_results",
    "channels",
    "apps.authentication",
    "apps.safar",
    "apps.real_time",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# WSGI and ASGI applications
WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# Database configuration
DATABASES = {
    'default': {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        'NAME': env('POSTGRES_DB', default=''),
        'USER': env('POSTGRES_USER', default=''),
        'PASSWORD': env('POSTGRES_PASSWORD', default=''),
        "HOST": env("POSTGRES_HOST", default=""),
        "PORT": env("POSTGRES_PORT", default="5432"),
    }
}

# Password validators
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Localization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# if DEVELOPMENTMODE:
#     STATIC_URL = '/static/'
#     STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
#     STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
#     MEDIA_URL = '/media/'
#     MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# else:
#     # AWS S3 Settings
#     AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
#     AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
#     AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
#     AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
#     AWS_S3_OBJECT_PARAMETERS = {
#         'CacheControl': 'max-age=86400',
#     }
#     AWS_LOCATION = 'static'
#     AWS_DEFAULT_ACL = 'public-read'
#     AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')    

#     # Static and media files
#     STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
#     # STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
#     DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'    

#     STATIC_URL = '/static/'
#     MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'


# Domain and site settings
DOMAIN = env("DOMAIN", default="safar.com")
SITE_NAME = "Safer"

# Custom user model
AUTH_USER_MODEL = "authentication.User"

# Stripe settings
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="https://painfx.in")


# Twilio settings
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID", default="")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN", default="")
TWILIO_FROM_NUMBER = env("TWILIO_FROM_NUMBER", default="")

# Email settings
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER',default="supernovasoftwareco@gmail.com")
SUPPORT_EMAIL = env('SUPPORT_EMAIL',default="supernovasoftwareco@gmail.com")
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD',default="clza azel tsbs khlx")
DEFAULT_FROM_EMAIL = f"{SITE_NAME} <{EMAIL_HOST_USER}>"

# Default auto field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
    'django.contrib.auth.backends.ModelBackend',
]


# REST framework settings
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_AUTHENTICATION_CLASSES': [
          'apps.authentication.authentication.CustomJWTAuthentication',
          'rest_framework_api_key.permissions.HasAPIKey',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('DJANGO_REDIS_CACHS_URL',default='redis://red-ctk0mhbtq21c73e5i4gg:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
    }
}

# Djoser settings
DJOSER = {
    'PASSWORD_RESET_CONFIRM_URL': 'password-reset/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL': True,
    'ACTIVATION_URL': 'activation/{uid}/{token}',
    'USER_CREATE_PASSWORD_RETYPE': True,
    'PASSWORD_RESET_CONFIRM_RETYPE': True,
    'TOKEN_MODEL': None,
    'SOCIAL_AUTH_ALLOWED_REDIRECT_URIS': env('REDIRECT_URLS',default="https://painfx.in/google,https://painfx.in/facebook" ).split(','),
    'SERIALIZERS': {
        'current_user': 'apps.authentication.serializers.UserSerializer',
        'user': 'apps.authentication.serializers.UserSerializer',
    },
}


# JWT settings
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('JWT', 'Bearer'),
    "AUTH_COOKIE": "jwt_token",
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None'

# Cookie settings for web
AUTH_COOKIE = 'access'
AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 1 week
AUTH_COOKIE_SECURE = env('AUTH_COOKIE_SECURE', default="True") == "True"
AUTH_COOKIE_HTTP_ONLY = True
AUTH_COOKIE_PATH = '/'
AUTH_COOKIE_SAMESITE = 'None'

# Cookie settings for mobile apps
MOBILE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365  # 1 year
MOBILE_AUTH_COOKIE_SECURE = False
MOBILE_AUTH_COOKIE_HTTP_ONLY = False
MOBILE_AUTH_COOKIE_SAMESITE = 'Lax'

# Social authentication settings
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('GOOGLE_AUTH_KEY',default="")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('GOOGLE_AUTH_SECRET_KEY',default="")
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]
SOCIAL_AUTH_GOOGLE_OAUTH2_EXTRA_DATA = ['first_name', 'last_name']

# Celery settings
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://red-ctk0mhbtq21c73e5i4gg:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://red-ctk0mhbtq21c73e5i4gg:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_RESULT_EXPIRES = 3600  # 1 hour
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Logging settings
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": log_dir / "django.log",
            "maxBytes": 1024*1024*5,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {module} {message}", "style": "{"},
        "simple": {"format": "{levelname} {message}", "style": "{"},
    },
}

CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# Security settings for production
if not DEVELOPMENTMODE:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 3600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

    # Additional security settings
    SECURE_REFERRER_POLICY = "same-origin"
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    CSRF_TRUSTED_ORIGINS = [
    'https://painfx.in',
    'https://www.painfx.in',
    'https://painfx.onrender.com',
    'https://painfx.onrender.com',
    'wss://painfx.onrender.com'
]

    # Content Security Policy (CSP)
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", 'https://trustedscripts.example.com')
    CSP_STYLE_SRC = ("'self'", 'https://trustedstyles.example.com')
    CSP_IMG_SRC = ("'self'", 'data:')
    CSP_CONNECT_SRC = ("'self'", 'https://painfx-backend.onrender.com')
    CSP_FONT_SRC = ("'self'",)
    CSP_OBJECT_SRC = ("'none'",)
    CSP_BASE_URI = ("'self'",)
    CSP_FORM_ACTION = ("'self'",)
    CSP_FRAME_ANCESTORS = ("'none'",)
