"""
Application core configuration.

This module contains all application settings and configuration, and supports
loading from environment variables with proper type conversion.
"""
from functools import lru_cache
from typing import Optional, Union
import os
import json
import warnings
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, validator, field_validator, model_validator
from typing import List


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
    Application settings class.
    
    All application settings are loaded from environment variables or sensible
    default values.
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
    
    # PostgreSQL Read Replica Configuration
    postgres_read_replica_url: Optional[PostgresDsn] = Field(
        default=None,
        env="POSTGRES_READ_REPLICA_URL",
        description="PostgreSQL read replica connection URL (comma-separated for multiple replicas)"
    )
    postgres_read_replica_enabled: bool = Field(
        default=False,
        env="POSTGRES_READ_REPLICA_ENABLED",
        description="Enable read replica routing for read-only queries"
    )
    
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
    
    # Redis Cluster Configuration
    redis_cluster_enabled: bool = Field(default=False, env="REDIS_CLUSTER_ENABLED")
    redis_cluster_nodes: Optional[str] = Field(
        default=None,
        env="REDIS_CLUSTER_NODES",
        description="Comma-separated list of cluster nodes (e.g., 'redis-1:6379,redis-2:6379,redis-3:6379')"
    )
    
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
    refresh_token_expire_days: int = Field(default=3, env="REFRESH_TOKEN_EXPIRE_DAYS", description="Refresh token expiry in days (reduced from 7 to 3 for better security)")
    
    @validator("secret_key")
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY strength - CRITICAL: Fail hard in production"""
        weak_keys = [
            "your-secret-key-change-in-production-use-openssl-rand-hex-32",
            "secret",
            "changeme",
            "default",
            "change-this-secret-key-in-production",
            "change-this-secret-key-generate-using-openssl-rand-hex-32",
        ]
        
        is_weak = v in weak_keys or len(v) < 32
        
        if is_weak:
            env = os.getenv("ENVIRONMENT", "").lower()
            if env == "production":
                # CRITICAL: Fail startup in production if SECRET_KEY is weak
                raise ValueError(
                    "SECRET_KEY is weak or default. This is a CRITICAL security risk in production. "
                    "SECRET_KEY must be at least 32 characters long and not use default values. "
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
    facebook_app_id: Optional[str] = Field(default=None, env="FACEBOOK_APP_ID")
    facebook_app_secret: Optional[str] = Field(default=None, env="FACEBOOK_APP_SECRET")
    github_client_id: Optional[str] = Field(default=None, env="GITHUB_CLIENT_ID")
    github_client_secret: Optional[str] = Field(default=None, env="GITHUB_CLIENT_SECRET")
    
    # ============================================================================
    # SMS/OTP Configuration (Twilio)
    # ============================================================================
    twilio_account_sid: Optional[str] = Field(default=None, env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    twilio_phone_number: Optional[str] = Field(default=None, env="TWILIO_PHONE_NUMBER")
    
    # ============================================================================
    # Push Notifications (FCM)
    # ============================================================================
    fcm_server_key: Optional[str] = Field(default=None, env="FCM_SERVER_KEY")
    fcm_project_id: Optional[str] = Field(default=None, env="FCM_PROJECT_ID")
    fcm_service_account_key: Optional[str] = Field(default=None, env="FCM_SERVICE_ACCOUNT_KEY")
    
    # ============================================================================
    # CDN Configuration
    # ============================================================================
    cdn_type: Optional[str] = Field(
        default=None,
        env="CDN_TYPE",
        description="CDN type: 'cloudflare', 'cloudfront', or 's3'"
    )
    cdn_base_url: Optional[str] = Field(
        default=None,
        env="CDN_BASE_URL",
        description="Base URL for CDN (e.g., https://cdn.safar.com)"
    )
    cdn_base_path: str = Field(
        default="images",
        env="CDN_BASE_PATH",
        description="Base path for CDN assets"
    )
    
    # Cloudflare Configuration
    cloudflare_account_id: Optional[str] = Field(
        default=None,
        env="CLOUDFLARE_ACCOUNT_ID",
        description="Cloudflare account ID for Images API"
    )
    cloudflare_api_token: Optional[str] = Field(
        default=None,
        env="CLOUDFLARE_API_TOKEN",
        description="Cloudflare API token"
    )
    cloudflare_zone_id: Optional[str] = Field(
        default=None,
        env="CLOUDFLARE_ZONE_ID",
        description="Cloudflare zone ID for cache purging"
    )
    
    # AWS CloudFront Configuration
    cloudfront_domain: Optional[str] = Field(
        default=None,
        env="CLOUDFRONT_DOMAIN",
        description="CloudFront distribution domain (e.g., d1234abcd.cloudfront.net)"
    )
    cloudfront_distribution_id: Optional[str] = Field(
        default=None,
        env="CLOUDFRONT_DISTRIBUTION_ID",
        description="CloudFront distribution ID"
    )
    s3_bucket_name: Optional[str] = Field(
        default=None,
        env="S3_BUCKET_NAME",
        description="S3 bucket name for image storage (used with CloudFront)"
    )
    
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
    
    # Apple Pay Configuration (via Stripe)
    apple_pay_domain_association: Optional[str] = Field(
        default=None,
        env="APPLE_PAY_DOMAIN_ASSOCIATION",
        description="Apple Pay domain association file content (for .well-known/apple-developer-merchantid-domain-association)"
    )
    apple_pay_merchant_id: Optional[str] = Field(
        default=None,
        env="APPLE_PAY_MERCHANT_ID",
        description="Apple Pay Merchant ID (from Apple Developer account)"
    )
    
    # Google Pay Configuration (via Stripe)
    google_pay_merchant_id: Optional[str] = Field(
        default=None,
        env="GOOGLE_PAY_MERCHANT_ID",
        description="Google Pay Merchant ID (from Google Pay Console)"
    )
    
    paypal_client_id: Optional[str] = Field(default=None, env="PAYPAL_CLIENT_ID")
    paypal_client_secret: Optional[str] = Field(default=None, env="PAYPAL_CLIENT_SECRET")
    
    # M-Pesa Configuration (Kenya, Tanzania, East Africa)
    mpesa_consumer_key: Optional[str] = Field(default=None, env="MPESA_CONSUMER_KEY")
    mpesa_consumer_secret: Optional[str] = Field(default=None, env="MPESA_CONSUMER_SECRET")
    mpesa_shortcode: Optional[str] = Field(default=None, env="MPESA_SHORTCODE")
    mpesa_passkey: Optional[str] = Field(default=None, env="MPESA_PASSKEY")
    mpesa_callback_url: Optional[str] = Field(default=None, env="MPESA_CALLBACK_URL")
    
    # Fawry Configuration (Egypt)
    fawry_merchant_code: Optional[str] = Field(default=None, env="FAWRY_MERCHANT_CODE")
    fawry_secure_key: Optional[str] = Field(default=None, env="FAWRY_SECURE_KEY")
    fawry_return_url: Optional[str] = Field(default=None, env="FAWRY_RETURN_URL")
    
    # Klarna Configuration (Buy Now Pay Later - Europe, US)
    klarna_username: Optional[str] = Field(default=None, env="KLARNA_USERNAME")
    klarna_password: Optional[str] = Field(default=None, env="KLARNA_PASSWORD")
    klarna_success_url: Optional[str] = Field(default=None, env="KLARNA_SUCCESS_URL")
    klarna_failure_url: Optional[str] = Field(default=None, env="KLARNA_FAILURE_URL")
    klarna_cancel_url: Optional[str] = Field(default=None, env="KLARNA_CANCEL_URL")
    
    # Tamara Configuration (Buy Now Pay Later - Middle East)
    tamara_token: Optional[str] = Field(default=None, env="TAMARA_TOKEN")
    
    # Tabby Configuration (Buy Now Pay Later - UAE, Saudi Arabia)
    tabby_secret_key: Optional[str] = Field(default=None, env="TABBY_SECRET_KEY")
    tabby_merchant_code: Optional[str] = Field(default=None, env="TABBY_MERCHANT_CODE")
    
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
    
    # OpenTelemetry Configuration
    otel_enabled: bool = Field(
        default=False,
        env="OTEL_ENABLED",
        description="Enable OpenTelemetry distributed tracing"
    )
    otel_exporter_otlp_endpoint: Optional[str] = Field(
        default=None,
        env="OTEL_EXPORTER_OTLP_ENDPOINT",
        description="OTLP exporter endpoint (e.g., http://tempo:4318/v1/traces)"
    )
    otel_exporter_otlp_headers: Optional[str] = Field(
        default=None,
        env="OTEL_EXPORTER_OTLP_HEADERS",
        description="OTLP exporter headers (comma-separated key=value pairs)"
    )
    otel_exporter_jaeger_endpoint: Optional[str] = Field(
        default=None,
        env="OTEL_EXPORTER_JAEGER_ENDPOINT",
        description="Jaeger exporter endpoint (e.g., jaeger:6831)"
    )
    otel_service_name: Optional[str] = Field(
        default=None,
        env="OTEL_SERVICE_NAME",
        description="OpenTelemetry service name (defaults to app_name)"
    )
    
    # ============================================================================
    # CORS Configuration
    # ============================================================================
    # Store as str to prevent pydantic-settings from auto-parsing JSON
    # model_validator will read from env directly
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:8000",
    )
    cors_allow_methods: str = Field(
        default="GET,POST,PUT,DELETE,PATCH,OPTIONS",
    )
    cors_allow_headers: str = Field(
        default="Content-Type,Authorization,Accept,X-Requested-With,X-CSRF-Token",
    )
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    
    
    # ============================================================================
    # Rate Limiting
    # ============================================================================
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")
    
    # ============================================================================
    # Booking Configuration
    # ============================================================================
    booking_max_window_days: int = Field(
        default=365,
        env="BOOKING_MAX_WINDOW_DAYS",
        description="Maximum booking window in days (default: 365)"
    )
    booking_min_advance_hours: int = Field(
        default=0,
        env="BOOKING_MIN_ADVANCE_HOURS",
        description="Minimum advance booking time in hours (0 = same day allowed)"
    )
    booking_max_advance_days: int = Field(
        default=730,
        env="BOOKING_MAX_ADVANCE_DAYS",
        description="Maximum advance booking time in days (default: 730 = 2 years)"
    )
    
    # ============================================================================
    # Multi-tenancy
    # ============================================================================
    multi_tenancy_enabled: bool = Field(default=True, env="MULTI_TENANCY_ENABLED")
    
    # ============================================================================
    # Localization
    # ============================================================================
    default_language: str = Field(default="ar", env="DEFAULT_LANGUAGE")
    supported_languages: str = Field(
        default="ar,en,fr,es",
    )
    
    default_currency: str = Field(default="USD", env="DEFAULT_CURRENCY")
    supported_currencies: str = Field(
        default="USD,EUR,GBP,SAR,AED,EGP",
    )
    
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
    
    @model_validator(mode='before')
    @classmethod
    def read_cors_env_vars(cls, data: dict) -> dict:
        """
        Read CORS environment variables directly to bypass pydantic-settings JSON parsing.
        
        This runs before pydantic-settings tries to parse values, preventing JSON parsing errors.
        """
        if isinstance(data, dict):
            # Read CORS variables directly from environment
            cors_origins = os.getenv("CORS_ORIGINS", "")
            if cors_origins:
                data["cors_origins"] = cors_origins.strip()
            
            cors_methods = os.getenv("CORS_ALLOW_METHODS", "")
            if cors_methods:
                data["cors_allow_methods"] = cors_methods.strip()
            
            cors_headers = os.getenv("CORS_ALLOW_HEADERS", "")
            if cors_headers:
                data["cors_allow_headers"] = cors_headers.strip()
            
            # Read localization variables
            supported_languages = os.getenv("SUPPORTED_LANGUAGES", "")
            if supported_languages:
                data["supported_languages"] = supported_languages.strip()
            
            supported_currencies = os.getenv("SUPPORTED_CURRENCIES", "")
            if supported_currencies:
                data["supported_currencies"] = supported_currencies.strip()
        
        return data
    
    @field_validator('cors_origins', mode='after')
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        """Parse CORS origins from environment variable - keep as string for storage."""
        if v is None or v == '':
            return "http://localhost:3000,http://localhost:8000"
        if isinstance(v, str):
            if not v.strip():
                return "http://localhost:3000,http://localhost:8000"
            # Return as-is, parsing will happen in property
            return v
        return str(v)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as list."""
        if not self.cors_origins or not self.cors_origins.strip():
            origins = ["http://localhost:3000", "http://localhost:8000"]
        else:
            try:
                origins = json.loads(self.cors_origins)
            except json.JSONDecodeError:
                origins = [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]
        
        # CRITICAL: Never allow wildcard in any environment - security risk
        # Always require explicit origins, even in development
        if "*" in origins:
            if self.environment == "production":
                raise ValueError(
                    "CORS_ORIGINS contains '*' in production. This is a CRITICAL security risk! "
                    "You must specify explicit allowed origins in production. "
                    "Set CORS_ORIGINS to a comma-separated list of allowed domains."
                )
            else:
                # In development, replace wildcard with common localhost origins
                logger = logging.getLogger(__name__)
                logger.warning(
                    "CORS_ORIGINS contains '*'. Replacing with localhost origins for security. "
                    "Set explicit origins in CORS_ORIGINS environment variable."
                )
                origins = [
                    "http://localhost:3000",
                    "http://localhost:8000",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:8000"
                ]
        
        # Add localhost variants in debug mode
        if self.debug:
            debug_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]
            origins = list(set(origins + debug_origins))
        
        return origins
    
    @property
    def cors_allow_methods_list(self) -> List[str]:
        """Get CORS allow methods as list."""
        if not self.cors_allow_methods or not self.cors_allow_methods.strip():
            return ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        try:
            return json.loads(self.cors_allow_methods)
        except json.JSONDecodeError:
            return [method.strip() for method in self.cors_allow_methods.split(',') if method.strip()]
    
    @property
    def cors_allow_headers_list(self) -> List[str]:
        """Get CORS allow headers as list."""
        if not self.cors_allow_headers or not self.cors_allow_headers.strip():
            return [
                "Content-Type",
                "Authorization",
                "Accept",
                "X-Requested-With",
                "X-CSRF-Token",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
            ]
        try:
            return json.loads(self.cors_allow_headers)
        except json.JSONDecodeError:
            headers = [header.strip() for header in self.cors_allow_headers.split(',') if header.strip()]
            # Ensure common CORS headers are included
            required_headers = [
                "Content-Type",
                "Authorization",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
            ]
            for req_header in required_headers:
                if req_header not in headers:
                    headers.append(req_header)
            return headers
    
    @property
    def supported_languages_list(self) -> List[str]:
        if not self.supported_languages or not self.supported_languages.strip():
            return ["ar", "en", "fr", "es"]
        try:
            return json.loads(self.supported_languages)
        except json.JSONDecodeError:
            return [lang.strip() for lang in self.supported_languages.split(',') if lang.strip()]
    
    @property
    def supported_currencies_list(self) -> List[str]:
        if not self.supported_currencies or not self.supported_currencies.strip():
            return ["USD", "EUR", "GBP", "SAR", "AED", "EGP"]
        try:
            return json.loads(self.supported_currencies)
        except json.JSONDecodeError:
            return [curr.strip() for curr in self.supported_currencies.split(',') if curr.strip()]
    
    @field_validator('cors_allow_methods', mode='after')
    @classmethod
    def parse_cors_methods(cls, v: str) -> str:
        """Parse CORS allow methods from environment variable - keep as string for storage."""
        if v is None or v == '':
            return "GET,POST,PUT,DELETE,PATCH,OPTIONS"
        if isinstance(v, str):
            if not v.strip():
                return "GET,POST,PUT,DELETE,PATCH,OPTIONS"
            return v
        return str(v)
    
    @field_validator('cors_allow_headers', mode='after')
    @classmethod
    def parse_cors_headers(cls, v: str) -> str:
        """Parse CORS allow headers from environment variable - keep as string for storage."""
        if v is None or v == '':
            return "Content-Type,Authorization,Accept,X-Requested-With,X-CSRF-Token"
        if isinstance(v, str):
            if not v.strip():
                return "Content-Type,Authorization,Accept,X-Requested-With,X-CSRF-Token"
            return v
        return str(v)
    
    @field_validator('supported_languages', mode='after')
    @classmethod
    def parse_supported_languages(cls, v: str) -> str:
        """Parse supported languages from environment variable - keep as string for storage."""
        if v is None or v == '':
            return "ar,en,fr,es"
        if isinstance(v, str):
            if not v.strip():
                return "ar,en,fr,es"
            return v
        return str(v)
    
    @field_validator('supported_currencies', mode='after')
    @classmethod
    def parse_supported_currencies(cls, v: str) -> str:
        """Parse supported currencies from environment variable - keep as string for storage."""
        if v is None or v == '':
            return "USD,EUR,GBP,SAR,AED,EGP"
        if isinstance(v, str):
            if not v.strip():
                return "USD,EUR,GBP,SAR,AED,EGP"
            return v
        return str(v)
    


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
