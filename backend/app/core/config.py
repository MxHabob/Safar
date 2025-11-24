"""
إعدادات التطبيق الرئيسية
Application Core Configuration

This module contains all application settings and configuration.
Supports loading from environment variables with proper type conversion.
"""
from functools import lru_cache
from typing import Optional, Union
import os
import json
import warnings
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, validator, root_validator, ConfigDict


def parse_list_from_env(value: Union[str, list, None]) -> list[str]:
    """
    Parse a list value from environment variable.
    
    Supports multiple formats:
    - JSON array: '["item1", "item2"]'
    - Comma-separated: 'item1,item2,item3'
    - Empty/None: returns empty list
    
    Args:
        value: The value to parse (can be string, list, or None)
        
    Returns:
        List of strings parsed from the input
    """
    if isinstance(value, list):
        return [str(item) for item in value]
    
    if value is None:
        return []
    
    if not isinstance(value, str):
        return []
    
    value = value.strip()
    if not value:
        return []
    
    # Try JSON format first
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Fall back to comma-separated format
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    """
    Application Settings Class
    
    جميع إعدادات التطبيق يتم تحميلها من متغيرات البيئة أو القيم الافتراضية.
    All application settings are loaded from environment variables or default values.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True
    )
    
    # ============================================================================
    # Application Settings
    # ============================================================================
    app_name: str = Field(default="Safar API", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    api_v1_prefix: str = Field(default="/api/v1", env="API_V1_PREFIX")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(
        default="development",
        env="ENVIRONMENT",
        description="Environment: development, staging, or production"
    )
    
    # ============================================================================
    # Server Configuration
    # ============================================================================
    host: str = Field(default="0.0.0.0", env="HOST", description="Server host")
    port: int = Field(default=8000, env="PORT", description="Server port")
    
    # ============================================================================
    # Database Configuration (PostgreSQL with PostGIS)
    # ============================================================================
    postgres_user: str = Field(default="safar_user", env="POSTGRES_USER")
    postgres_password: str = Field(default="safar_pass", env="POSTGRES_PASSWORD")
    postgres_server: str = Field(default="localhost", env="POSTGRES_SERVER")
    postgres_port: int = Field(default=5432, env="POSTGRES_PORT")
    postgres_db: str = Field(default="safar_db", env="POSTGRES_DB")
    database_url: Optional[PostgresDsn] = Field(default=None, env="DATABASE_URL")
    
    @validator("database_url", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """Build database connection URL from individual components"""
        if isinstance(v, str) and v:
            return v
        
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("postgres_user"),
            password=values.get("postgres_password"),
            host=values.get("postgres_server"),
            port=values.get("postgres_port"),
            path=f"/{values.get('postgres_db')}",
        )
    
    # ============================================================================
    # Redis Configuration
    # ============================================================================
    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    
    @validator("redis_url", pre=True)
    def assemble_redis_connection(cls, v: Optional[str], values: dict) -> str:
        """Build Redis connection URL from individual components"""
        if isinstance(v, str) and v:
            return v
        
        password = values.get("redis_password", "")
        auth = f":{password}@" if password else ""
        return f"redis://{auth}{values.get('redis_host')}:{values.get('redis_port')}/{values.get('redis_db')}"
    
    # ============================================================================
    # Security & Authentication
    # ============================================================================
    secret_key: str = Field(
        default="your-secret-key-change-in-production-use-openssl-rand-hex-32",
        env="SECRET_KEY",
        description="Secret key for JWT tokens. Must be at least 32 characters."
    )
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    @validator("secret_key")
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY strength"""
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
    
    # ============================================================================
    # OAuth2 Providers
    # ============================================================================
    google_client_id: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_SECRET")
    apple_client_id: Optional[str] = Field(default=None, env="APPLE_CLIENT_ID")
    apple_client_secret: Optional[str] = Field(default=None, env="APPLE_CLIENT_SECRET")
    
    # ============================================================================
    # SMS/OTP Configuration (Twilio)
    # ============================================================================
    twilio_account_sid: Optional[str] = Field(default=None, env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    twilio_phone_number: Optional[str] = Field(default=None, env="TWILIO_PHONE_NUMBER")
    
    # ============================================================================
    # File Storage Configuration
    # ============================================================================
    storage_type: str = Field(
        default="local",
        env="STORAGE_TYPE",
        description="Storage type: local, s3, minio, or cloudinary"
    )
    
    # AWS S3 Configuration
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    aws_region: str = Field(default="us-east-1", env="AWS_REGION")
    aws_s3_bucket: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    
    # Cloudinary Configuration
    cloudinary_cloud_name: Optional[str] = Field(default=None, env="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: Optional[str] = Field(default=None, env="CLOUDINARY_API_KEY")
    cloudinary_api_secret: Optional[str] = Field(default=None, env="CLOUDINARY_API_SECRET")
    
    # MinIO Configuration
    minio_endpoint: str = Field(default="localhost", env="MINIO_ENDPOINT")
    minio_port: int = Field(default=9000, env="MINIO_PORT")
    minio_access_key: str = Field(default="minioadmin", env="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin", env="MINIO_SECRET_KEY")
    minio_bucket_name: str = Field(default="safar-files", env="MINIO_BUCKET_NAME")
    minio_use_ssl: bool = Field(default=False, env="MINIO_USE_SSL")
    minio_url: Optional[str] = Field(default=None, env="MINIO_URL")
    
    @validator("minio_url", pre=True)
    def assemble_minio_url(cls, v: Optional[str], values: dict) -> str:
        """Build MinIO URL from individual components"""
        if isinstance(v, str) and v:
            return v
        
        protocol = "https" if values.get("minio_use_ssl", False) else "http"
        endpoint = values.get("minio_endpoint", "localhost")
        port = values.get("minio_port", 9000)
        return f"{protocol}://{endpoint}:{port}"
    
    max_upload_size: int = Field(
        default=10 * 1024 * 1024,
        env="MAX_UPLOAD_SIZE",
        description="Maximum upload size in bytes (default: 10MB)"
    )
    
    # ============================================================================
    # Email Configuration (SMTP)
    # ============================================================================
    smtp_host: Optional[str] = Field(default=None, env="SMTP_HOST")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    smtp_from_email: str = Field(default="noreply@safar.com", env="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="Safar", env="SMTP_FROM_NAME")
    
    # ============================================================================
    # Payment Gateways
    # ============================================================================
    stripe_secret_key: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    stripe_publishable_key: Optional[str] = Field(default=None, env="STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    paypal_client_id: Optional[str] = Field(default=None, env="PAYPAL_CLIENT_ID")
    paypal_client_secret: Optional[str] = Field(default=None, env="PAYPAL_CLIENT_SECRET")
    
    # ============================================================================
    # AI Services
    # ============================================================================
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", env="OPENAI_MODEL")
    
    # ============================================================================
    # Monitoring & Error Tracking
    # ============================================================================
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    sentry_environment: str = Field(default="development", env="SENTRY_ENVIRONMENT")
    
    # ============================================================================
    # CORS Configuration
    # ============================================================================
    # Store as Optional[str] to prevent pydantic-settings from auto-parsing JSON
    # Read directly from environment to bypass pydantic-settings JSON parsing
    cors_origins_raw: Optional[str] = Field(default=None)
    cors_allow_methods_raw: Optional[str] = Field(default=None)
    cors_allow_headers_raw: Optional[str] = Field(default=None)
    
    # These will be populated by root_validator - don't read from env to prevent auto-parsing
    cors_origins: list[str] = Field(default_factory=list, exclude=True)
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: list[str] = Field(default_factory=list, exclude=True)
    cors_allow_headers: list[str] = Field(default_factory=list, exclude=True)
    
    @root_validator(pre=True)
    def read_list_env_vars(cls, values: dict) -> dict:
        """
        Read list-type environment variables directly to bypass pydantic-settings JSON parsing.
        
        This runs before any field validation and prevents pydantic-settings from
        trying to parse empty or invalid JSON strings.
        """
        # Read CORS variables directly from environment, handling empty strings
        cors_origins = os.getenv("CORS_ORIGINS", "").strip()
        cors_methods = os.getenv("CORS_ALLOW_METHODS", "").strip()
        cors_headers = os.getenv("CORS_ALLOW_HEADERS", "").strip()
        
        values["cors_origins_raw"] = cors_origins if cors_origins else None
        values["cors_allow_methods_raw"] = cors_methods if cors_methods else None
        values["cors_allow_headers_raw"] = cors_headers if cors_headers else None
        
        # Read localization variables directly from environment
        supported_languages = os.getenv("SUPPORTED_LANGUAGES", "").strip()
        supported_currencies = os.getenv("SUPPORTED_CURRENCIES", "").strip()
        
        values["supported_languages_raw"] = supported_languages if supported_languages else None
        values["supported_currencies_raw"] = supported_currencies if supported_currencies else None
        
        return values
    
    # ============================================================================
    # Rate Limiting
    # ============================================================================
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")
    
    # ============================================================================
    # Multi-tenancy
    # ============================================================================
    multi_tenancy_enabled: bool = Field(default=True, env="MULTI_TENANCY_ENABLED")
    
    # ============================================================================
    # Localization
    # ============================================================================
    default_language: str = Field(default="ar", env="DEFAULT_LANGUAGE")
    supported_languages_raw: Optional[str] = Field(default=None)
    supported_languages: list[str] = Field(default_factory=list, exclude=True)
    
    default_currency: str = Field(default="USD", env="DEFAULT_CURRENCY")
    supported_currencies_raw: Optional[str] = Field(default=None)
    supported_currencies: list[str] = Field(default_factory=list, exclude=True)
    
    # ============================================================================
    # Search Configuration
    # ============================================================================
    enable_vector_search: bool = Field(default=True, env="ENABLE_VECTOR_SEARCH")
    search_results_limit: int = Field(default=50, env="SEARCH_RESULTS_LIMIT")
    
    # ============================================================================
    # WebSocket Configuration
    # ============================================================================
    websocket_enabled: bool = Field(default=True, env="WEBSOCKET_ENABLED")
    websocket_heartbeat_interval: int = Field(default=30, env="WEBSOCKET_HEARTBEAT_INTERVAL")
    
    # ============================================================================
    # Validators
    # ============================================================================
    
    @root_validator
    def parse_list_fields(cls, values: dict) -> dict:
        """
        Parse all list fields from environment variables.
        
        This validator runs after all fields are loaded and converts
        string values (JSON or comma-separated) to lists.
        """
        # Parse CORS_ORIGINS
        cors_origins_str = values.get("cors_origins_raw")
        parsed_origins = parse_list_from_env(cors_origins_str)
        if not parsed_origins:
            env = values.get("environment", "development")
            values["cors_origins"] = (
                ["*"] if env == "development"
                else ["http://localhost:3000", "http://localhost:8000"]
            )
        else:
            values["cors_origins"] = parsed_origins
        
        # Parse CORS_ALLOW_METHODS
        methods_str = values.get("cors_allow_methods_raw")
        parsed_methods = parse_list_from_env(methods_str)
        values["cors_allow_methods"] = (
            parsed_methods if parsed_methods
            else ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        )
        
        # Parse CORS_ALLOW_HEADERS
        headers_str = values.get("cors_allow_headers_raw")
        parsed_headers = parse_list_from_env(headers_str)
        values["cors_allow_headers"] = (
            parsed_headers if parsed_headers
            else [
                "Content-Type",
                "Authorization",
                "Accept",
                "X-Requested-With",
                "X-CSRF-Token"
            ]
        )
        
        # Parse SUPPORTED_LANGUAGES
        languages_str = values.get("supported_languages_raw")
        parsed_languages = parse_list_from_env(languages_str)
        values["supported_languages"] = (
            parsed_languages if parsed_languages
            else ["ar", "en", "fr", "es"]
        )
        
        # Parse SUPPORTED_CURRENCIES
        currencies_str = values.get("supported_currencies_raw")
        parsed_currencies = parse_list_from_env(currencies_str)
        values["supported_currencies"] = (
            parsed_currencies if parsed_currencies
            else ["USD", "EUR", "GBP", "SAR", "AED", "EGP"]
        )
        
        return values
    
    @validator("cors_origins")
    def validate_cors_origins(cls, v: list[str], values: dict) -> list[str]:
        """Validate CORS origins and warn about security issues"""
        env = values.get("environment", "development")
        if env == "production" and "*" in v:
            warnings.warn(
                "⚠️ WARNING: CORS_ORIGINS contains '*' in production. This is a security risk!",
                UserWarning
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings (cached).
    
    Returns:
        Settings instance with all configuration loaded
        
    Example:
        >>> settings = get_settings()
        >>> print(settings.app_name)
        'Safar API'
    """
    return Settings()
