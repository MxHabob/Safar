"""
خدمة البريد الإلكتروني - Email Service
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from jinja2 import Template

from app.core.config import get_settings

settings = get_settings()


class EmailService:
    """خدمة إرسال البريد الإلكتروني - Email service"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """
        إرسال بريد إلكتروني - Send email
        """
        if not settings.SMTP_HOST:
            # If SMTP is not configured, log and return False
            print(f"⚠️ SMTP not configured. Email would be sent to {to_email}: {subject}")
            return False
        
        try:
            from_email = from_email or settings.SMTP_FROM_EMAIL
            from_name = from_name or settings.SMTP_FROM_NAME
            
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
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_PORT == 587,
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
        """
        إرسال بريد إلكتروني من template - Send email from template
        """
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

