import os
from pathlib import Path
import environ
from django.core.management.utils import get_random_secret_key
from django.core.exceptions import ImproperlyConfigured
from datetime import timedelta

env = environ.Env(
    DEBUG=(bool, False),
    DEVELOPMENT_MODE=(bool, False),
    USE_S3=(bool, False),
)

# ======================
#  PATH CONFIGURATION
# ======================
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ======================
#  ENVIRONMENT SETUP
# ======================
ENVIRONMENT = env("ENVIRONMENT", default="development")
DEVELOPMENT_MODE = env("DEVELOPMENT_MODE", default=(ENVIRONMENT == "development"))
DEBUG = env("DEBUG", default=DEVELOPMENT_MODE)

# ======================
#  SECURITY SETTINGS
# ======================
SECRET_KEY = env("DJANGO_SECRET_KEY", default=get_random_secret_key())

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[
    "127.0.0.1",
    "localhost",
    "backend",
])

# Security middleware settings
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=3600 if not DEVELOPMENT_MODE else 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=not DEVELOPMENT_MODE)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=not DEVELOPMENT_MODE)
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEVELOPMENT_MODE)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEVELOPMENT_MODE)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEVELOPMENT_MODE)
CSRF_TRUSTED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
# Content Security Policy (if using django-csp)
if not DEVELOPMENT_MODE:
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://trusted.cdn.com")
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://trusted.cdn.com")
    CSP_IMG_SRC = ("'self'", "data:", "https://trusted.cdn.com")
    CSP_CONNECT_SRC = ("'self'", "https://api.example.com")

# ======================
#  CORS & CSRF SETTINGS
# ======================
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
])

if DEVELOPMENT_MODE:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True

# ======================
#  APPLICATION DEFINITION
# ======================
INSTALLED_APPS = [
    # ASGI server must come before staticfiles
    "daphne",

    # Django core apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    
    # Third-party apps
    "corsheaders",
    "drf_yasg",
    "rest_framework",
    "rest_framework_api_key",
    "djoser",
    "storages",
    "social_django",
    "phonenumber_field",
    "django_filters",
    "django_celery_beat",
    "django_celery_results",
    "channels",
    
    # Local apps
    "apps.authentication",
    "apps.safar",
    "apps.real_time",
    "apps.geographic_data",
    "apps.core_apps",
    'apps.marketing',
    'apps.languages',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.authentication.middleware.UserActivityMiddleware",
    "apps.authentication.middleware.UserLoginTracker",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "apps/core_apps/templates"],
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

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# ======================
#  DATABASE CONFIGURATION
# ======================
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST"),
        "PORT": env("POSTGRES_PORT", default="5432"),
    }
}

DATABASE_OPTIONS = {
    'timeout': 20,
}

# ======================
#  AUTHENTICATION
# ======================
AUTH_USER_MODEL = "authentication.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTHENTICATION_BACKENDS = [
    "social_core.backends.google.GoogleOAuth2",
    "social_core.backends.facebook.FacebookOAuth2",
    "django.contrib.auth.backends.ModelBackend",
]

# ======================
#  INTERNATIONALIZATION
# ======================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ======================
#  STATIC & MEDIA FILES CONFIGURATION
# ======================
STATIC_DIR = env("STATIC_DIR", default="/app/static")
STATICFILES_DIR = BASE_DIR / 'staticfiles'
MEDIA_DIR = BASE_DIR / 'media'

if env.bool("USE_S3", default=False):
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="us-east-1")
    AWS_S3_CUSTOM_DOMAIN = env('AWS_S3_CUSTOM_DOMAIN', default=f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com')
    
    AWS_S3_OBJECT_PARAMETERS = {
        "CacheControl": "max-age=86400",
    }
    
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    
    AWS_S3_ADDRESSING_STYLE = 'virtual'
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    
    STATIC_LOCATION = "static"
    STATICFILES_STORAGE = "core.storage_backends.StaticStorage"
    STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{STATIC_LOCATION}/"

    PUBLIC_MEDIA_LOCATION = "media"
    DEFAULT_FILE_STORAGE = "core.storage_backends.MediaStorage"
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{PUBLIC_MEDIA_LOCATION}/"
    
    STATIC_ROOT = STATICFILES_DIR
    
    STORAGES_DEBUG = True
    
else:
    STATIC_URL = '/static/'
    STATIC_ROOT = BASE_DIR / 'staticfiles'
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / 'media'
    if not DEVELOPMENT_MODE:
        STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
    else:
        STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

STATICFILES_DIRS = [STATIC_DIR]
STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]

FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.authentication.authentication.CustomJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
        "rest_framework_api_key.permissions.HasAPIKey",
    ],
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    'DEFAULT_THROTTLE_CLASSES': [],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day"
    },
}

# ======================
#  DJOSER (AUTH)
# ======================
DJOSER = {
    'USER_ID_FIELD': 'id',
    "PASSWORD_RESET_CONFIRM_URL": "password-reset/{uid}/{token}",
    "SEND_ACTIVATION_EMAIL": True,
    "ACTIVATION_URL": "verify-email/{uid}/{token}",
    "USER_CREATE_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_RETYPE": True,
    "TOKEN_MODEL": None,
    "SOCIAL_AUTH_ALLOWED_REDIRECT_URIS": env.list("REDIRECT_URLS", default=[]),
    "SERIALIZERS": {
        'user': 'apps.authentication.serializers.UserPublicSerializer',
        'current_user': 'apps.authentication.serializers.UserPublicSerializer',
    },
    'PERMISSIONS': {
        'user': ['rest_framework.permissions.IsAuthenticatedOrReadOnly'],
        'user_list': ['rest_framework.permissions.AllowAny'],
    },
}

# ======================
#  COOKIE SETTINGS
# ======================
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEVELOPMENT_MODE)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "None"

# Auth cookie settings
AUTH_COOKIE_DOMAIN = env("DOMAIN", default="localhost:3000")
AUTH_COOKIE = "access"
AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
AUTH_COOKIE_SECURE = env.bool("AUTH_COOKIE_SECURE", default=not DEVELOPMENT_MODE)
AUTH_COOKIE_HTTP_ONLY = True
AUTH_COOKIE_PATH = "/"
AUTH_COOKIE_SAMESITE = "None"

# ======================
#  SOCIAL AUTH
# ======================
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env("GOOGLE_AUTH_KEY")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env("GOOGLE_AUTH_SECRET_KEY")
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
]
SOCIAL_AUTH_GOOGLE_OAUTH2_EXTRA_DATA = ["first_name", "last_name"]

# ======================
#  CELERY & REDIS
# ======================
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://redis:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_RESULT_EXPIRES = 3600
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Redis cache
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_CACHE_URL", default="redis://redis:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Channels (WebSockets)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        'CONFIG': {
            "hosts": [env("REDIS_CACHE_URL", default="redis://redis:6379/0")],
            'capacity': 1500,  
            'expiry': 10,
        },
    },
}

# ======================
#  EMAIL CONFIGURATION
# ======================
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default=f"{env('SITE_NAME', default='Safer')} <{EMAIL_HOST_USER}>")
SUPPORT_EMAIL = env("SUPPORT_EMAIL", default=EMAIL_HOST_USER)

# ======================
#  THIRD-PARTY SERVICES
# ======================
# Stripe
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET")

# Twilio
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = env("TWILIO_FROM_NUMBER")

# ======================
#  LOGGING CONFIGURATION
# ======================
LOGGING_DIR = BASE_DIR / "logs"
try:
    LOGGING_DIR.mkdir(parents=True, exist_ok=True)
except OSError as e:
    raise ImproperlyConfigured(f"Unable to create log directory: {e}")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGGING_DIR / "django.log",
            "maxBytes": 1024 * 1024 * 5,  # 5 MB
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
        "django.request": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console", "file"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        'boto3': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'botocore': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        's3transfer': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'channels': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ======================
#  MISC SETTINGS
# ======================
# Default auto field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Domain and site settings
DOMAIN = env("DOMAIN", default="localhost:3000")

# Notification Settings
NOTIFICATION_RETENTION_DAYS = 90
ENABLE_EMAIL_RATE_LIMITING = True
ENABLE_SMS_RATE_LIMITING = True
SITE_NAME = env("SITE_NAME", default="Safer")
SITE_URL = env("SITE_URL", default="http://localhost:3000")

# Firebase settings
FIREBASE_CREDENTIALS = {
    "type": "service_account",
    "project_id": env("FIREBASE_PROJECT_ID"),
    "private_key_id": env("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": env("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
    "client_email": env("FIREBASE_CLIENT_EMAIL"),
    "client_id": env("FIREBASE_CLIENT_ID"),
    "auth_uri": env("FIREBASE_AUTH_URI", default="https://accounts.google.com/o/oauth2/auth"),
    "token_uri": env("FIREBASE_TOKEN_URI", default="https://oauth2.googleapis.com/token"),
    "auth_provider_x509_cert_url": env("FIREBASE_AUTH_PROVIDER_CERT_URL", default="https://www.googleapis.com/oauth2/v1/certs"),
    "client_x509_cert_url": env("FIREBASE_CLIENT_CERT_URL")
}

# Phone number field settings
PHONENUMBER_DEFAULT_REGION = "YE"
PHONENUMBER_DB_FORMAT = "E164"

# ======================
#  ENVIRONMENT SPECIFIC
# ======================
if DEVELOPMENT_MODE:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]