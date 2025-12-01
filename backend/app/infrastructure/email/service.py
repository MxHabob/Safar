"""
Email service utilities for sending plain and templated messages.
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from jinja2 import Template

from app.core.config import get_settings

settings = get_settings()


class EmailService:
    """Service for sending transactional emails."""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Send an email message.

        This supports both plain-text and optional HTML bodies.
        Returns True on success, False otherwise.
        """
        if not settings.smtp_host:
            # If SMTP is not configured, log and return False
            print(f"⚠️ SMTP not configured. Email would be sent to {to_email}: {subject}")
            return False
        
        try:
            from_email = from_email or settings.smtp_from_email
            from_name = from_name or settings.smtp_from_name
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{from_name} <{from_email}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            text_part = MIMEText(body, "plain", "utf-8")
            message.attach(text_part)
            
            if html_body:
                html_part = MIMEText(html_body, "html", "utf-8")
                message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                use_tls=settings.smtp_port == 587,
            )
            
            return True
        except Exception as e:
            print(f"❌ Error sending email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_template_email(
        to_email: str,
        subject: str,
        template_name: str,
        template_data: dict,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Render and send an email based on a simple in-memory template."""
        # Simple template rendering (in production, use proper template loader)
        templates = {
            "welcome": {
                "html": """
                <html>
                <body>
                    <h1>Welcome to Safar!</h1>
                    <p>Hello {{ name }},</p>
                    <p>Thank you for joining Safar. We're excited to have you!</p>
                </body>
                </html>
                """,
                "text": "Welcome to Safar! Hello {{ name }}, Thank you for joining Safar."
            },
            "booking_confirmed": {
                "html": """
                <html>
                <body>
                    <h1>Booking Confirmed!</h1>
                    <p>Hello {{ guest_name }},</p>
                    <p>Your booking at {{ property_title }} has been confirmed.</p>
                    <p>Check-in: {{ check_in_date }}</p>
                    <p>Check-out: {{ check_out_date }}</p>
                </body>
                </html>
                """,
                "text": "Booking Confirmed! Your booking at {{ property_title }} has been confirmed."
            },
            "verification": {
                "html": """
                <html>
                <body>
                    <h1>Verify Your Email</h1>
                    <p>Hello {{ name }},</p>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="{{ verification_url }}">Verify Email</a>
                    <p>Or use this code: {{ code }}</p>
                </body>
                </html>
                """,
                "text": "Verify your email. Use this code: {{ code }}"
            }
        }
        
        if template_name not in templates:
            return False
        
        template = templates[template_name]
        
        # Render templates
        html_template = Template(template["html"])
        text_template = Template(template["text"])
        
        html_body = html_template.render(**template_data)
        text_body = text_template.render(**template_data)
        
        return await EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body=text_body,
            html_body=html_body,
            from_email=from_email,
            from_name=from_name
        )

