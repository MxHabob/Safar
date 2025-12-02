"""
OpenTelemetry distributed tracing configuration.

Integrates with Jaeger/Tempo and Sentry for comprehensive observability.
"""
import logging
from typing import Optional
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Global tracer
tracer: Optional[trace.Tracer] = None


def setup_tracing() -> None:
    """
    Initialize OpenTelemetry distributed tracing.
    
    Supports multiple exporters:
    - OTLP (for Tempo, Grafana Cloud, etc.)
    - Jaeger (legacy support)
    
    Integrates with Sentry for error correlation.
    """
    global tracer
    
    # Check if tracing is enabled
    if not getattr(settings, 'otel_enabled', False):
        logger.info("OpenTelemetry tracing is disabled")
        return
    
    try:
        # Create resource with service information
        resource = Resource.create({
            "service.name": settings.app_name.lower().replace(" ", "-"),
            "service.version": settings.app_version,
            "deployment.environment": settings.environment,
        })
        
        # Create tracer provider
        tracer_provider = TracerProvider(resource=resource)
        
        # Configure sampling
        # In production, sample 10% of traces; in development, sample 100%
        sample_rate = 0.1 if settings.environment == "production" else 1.0
        
        # Add OTLP exporter (for Tempo, Grafana Cloud, etc.)
        otlp_endpoint = getattr(settings, 'otel_exporter_otlp_endpoint', None)
        if otlp_endpoint:
            # Parse headers string into dictionary
            headers_str = getattr(settings, 'otel_exporter_otlp_headers', None)
            headers_dict = {}
            if headers_str:
                # Parse format: "key1=value1,key2=value2" or "key=value"
                # Handle both comma-separated and single header formats
                header_pairs = headers_str.split(',') if ',' in headers_str else [headers_str]
                for header_pair in header_pairs:
                    header_pair = header_pair.strip()
                    if not header_pair:
                        continue
                    if '=' in header_pair:
                        parts = header_pair.split('=', 1)  # Split on first '=' only
                        if len(parts) == 2:
                            key, value = parts
                            key = key.strip()
                            value = value.strip()
                            if key and value:  # Only add non-empty keys and values
                                headers_dict[key] = value
                    else:
                        # If no '=' found, log warning but don't fail
                        logger.warning(f"Invalid header format (missing '='): {header_pair}")
            
            # Create exporter with headers only if we have valid headers
            # OTLP exporter expects headers as a dict or None/omitted
            exporter_kwargs = {"endpoint": otlp_endpoint}
            if headers_dict:
                exporter_kwargs["headers"] = headers_dict
                logger.debug(f"OTLP headers parsed: {list(headers_dict.keys())}")
            
            otlp_exporter = OTLPSpanExporter(**exporter_kwargs)
            tracer_provider.add_span_processor(
                BatchSpanProcessor(otlp_exporter)
            )
            logger.info(f"OpenTelemetry OTLP exporter configured: {otlp_endpoint}")
        
        # Add Jaeger exporter (legacy support)
        jaeger_endpoint = getattr(settings, 'otel_exporter_jaeger_endpoint', None)
        if jaeger_endpoint:
            jaeger_exporter = JaegerExporter(
                agent_host_name=jaeger_endpoint.split(":")[0] if ":" in jaeger_endpoint else jaeger_endpoint,
                agent_port=int(jaeger_endpoint.split(":")[1]) if ":" in jaeger_endpoint else 6831,
            )
            tracer_provider.add_span_processor(
                BatchSpanProcessor(jaeger_exporter)
            )
            logger.info(f"OpenTelemetry Jaeger exporter configured: {jaeger_endpoint}")
        
        # Set global tracer provider
        trace.set_tracer_provider(tracer_provider)
        tracer = trace.get_tracer(__name__)
        
        logger.info("OpenTelemetry tracing initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize OpenTelemetry tracing: {e}", exc_info=True)
        # Don't fail startup if tracing fails
        tracer = None


def instrument_app(app):
    """
    Instrument FastAPI application with OpenTelemetry.
    
    Args:
        app: FastAPI application instance
    """
    if not tracer:
        return
    
    try:
        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)
        
        # Instrument SQLAlchemy (database queries)
        SQLAlchemyInstrumentor().instrument(
            enable_commenter=True,
            commenter_options={"include_docs": True}
        )
        
        # Instrument Redis
        RedisInstrumentor().instrument()
        
        # Instrument HTTPX (HTTP client)
        HTTPXClientInstrumentor().instrument()
        
        logger.info("OpenTelemetry instrumentation applied to application")
        
    except Exception as e:
        logger.error(f"Failed to instrument application with OpenTelemetry: {e}", exc_info=True)


def get_tracer() -> Optional[trace.Tracer]:
    """Get the global tracer instance."""
    return tracer


def create_span(name: str, **kwargs):
    """
    Create a new span for tracing.
    
    Args:
        name: Span name
        **kwargs: Additional span attributes
    
    Returns:
        Span context manager
    """
    if not tracer:
        # Return a no-op context manager if tracing is disabled
        from contextlib import nullcontext
        return nullcontext()
    
    return tracer.start_as_current_span(name, **kwargs)

