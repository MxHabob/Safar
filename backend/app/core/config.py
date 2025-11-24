"""
إعدادات التطبيق الرئيسية
Application Core Configuration
"""
from functools import lru_cache
from typing import Optional
import os
import warnings
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, validator


class Settings(BaseSettings):
    """إعدادات التطبيق - Application Settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    APP_NAME: str = "Safar API"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database - PostgreSQL
    POSTGRES_USER: str = Field(default="safar_user")
    POSTGRES_PASSWORD: str = Field(default="safar_pass")
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="safar_db")
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """بناء رابط قاعدة البيانات - Build database connection URL"""
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"/{values.get('POSTGRES_DB')}",
        )
    
    # Redis
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    REDIS_DB: int = Field(default=0)
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    @validator("REDIS_URL", pre=True)
    def assemble_redis_connection(cls, v: Optional[str], values: dict) -> str:
        """بناء رابط Redis - Build Redis connection URL"""
        if isinstance(v, str):
            return v
        password = values.get("REDIS_PASSWORD", "")
        auth = f":{password}@" if password else ""
        return f"redis://{auth}{values.get('REDIS_HOST')}:{values.get('REDIS_PORT')}/{values.get('REDIS_DB')}"
    
    # JWT Authentication
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production-use-openssl-rand-hex-32"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        """التحقق من قوة SECRET_KEY - Validate SECRET_KEY strength"""
        weak_keys = [
            "your-secret-key-change-in-production-use-openssl-rand-hex-32",
            "secret",
            "changeme",
            "default",
        ]
        if v in weak_keys or len(v) < 32:
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters long and not use default values in production. "
                    "Generate a strong key using: openssl rand -hex 32"
                )
            else:
                warnings.warn(
                    "⚠️ WARNING: Using weak SECRET_KEY. This is unsafe for production! "
                    "Generate a strong key using: openssl rand -hex 32",
                    UserWarning
                )
        return v
    
    # OAuth2 Providers
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    APPLE_CLIENT_ID: Optional[str] = None
    APPLE_CLIENT_SECRET: Optional[str] = None
    
    # SMS/OTP (Twilio or similar)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # File Storage
    STORAGE_TYPE: str = "local"  # local, s3, minio, cloudinary
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    # MinIO Configuration
    MINIO_ENDPOINT: str = Field(default="localhost")
    MINIO_PORT: int = Field(default=9000)
    MINIO_ACCESS_KEY: str = Field(default="minioadmin")
    MINIO_SECRET_KEY: str = Field(default="minioadmin")
    MINIO_BUCKET_NAME: str = Field(default="safar-files")
    MINIO_USE_SSL: bool = Field(default=False)
    MINIO_URL: Optional[str] = None
    
    @validator("MINIO_URL", pre=True)
    def assemble_minio_url(cls, v: Optional[str], values: dict) -> str:
        """بناء رابط MinIO - Build MinIO URL"""
        if isinstance(v, str):
            return v
        protocol = "https" if values.get("MINIO_USE_SSL", False) else "http"
        endpoint = values.get("MINIO_ENDPOINT", "localhost")
        port = values.get("MINIO_PORT", 9000)
        return f"{protocol}://{endpoint}:{port}"
    
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@safar.com"
    SMTP_FROM_NAME: str = "Safar"
    
    # Payments
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: str = "development"
    
    # CORS
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: (
            ["*"] if os.getenv("ENVIRONMENT", "development") == "development"
            else ["http://localhost:3000", "http://localhost:8000"]
        )
    )
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = Field(
        default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    )
    CORS_ALLOW_HEADERS: list[str] = Field(
        default_factory=lambda: [
            "Content-Type",
            "Authorization",
            "Accept",
            "X-Requested-With",
            "X-CSRF-Token"
        ]
    )
    
    @validator("CORS_ORIGINS")
    def validate_cors_origins(cls, v: list[str], values: dict) -> list[str]:
        """التحقق من CORS origins - Validate CORS origins"""
        env = values.get("ENVIRONMENT", "development")
        if env == "production" and "*" in v:
            warnings.warn(
                "⚠️ WARNING: CORS_ORIGINS contains '*' in production. This is a security risk!",
                UserWarning
            )
        return v
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Multi-tenancy
    MULTI_TENANCY_ENABLED: bool = True
    
    # Languages & Currencies
    DEFAULT_LANGUAGE: str = "ar"
    SUPPORTED_LANGUAGES: list[str] = Field(default_factory=lambda: ["ar", "en", "fr", "es"])
    DEFAULT_CURRENCY: str = "USD"
    SUPPORTED_CURRENCIES: list[str] = Field(
        default_factory=lambda: ["USD", "EUR", "GBP", "SAR", "AED", "EGP"]
    )
    
    # Search
    ENABLE_VECTOR_SEARCH: bool = True
    SEARCH_RESULTS_LIMIT: int = 50
    
    # WebSocket
    WEBSOCKET_ENABLED: bool = True
    WEBSOCKET_HEARTBEAT_INTERVAL: int = 30


@lru_cache()
def get_settings() -> Settings:
    """الحصول على إعدادات التطبيق - Get application settings (cached)"""
    return Settings()

