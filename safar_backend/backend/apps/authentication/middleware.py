import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.core.exceptions import MiddlewareNotUsed
from django.conf import settings
from geolite2 import geolite2

logger = logging.getLogger(__name__)
User = get_user_model()

class UserActivityMiddleware(MiddlewareMixin):
    """
    Tracks user activity and online status.
    Also detects suspicious logins from new devices/locations.
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        if not getattr(settings, 'TRACK_USER_ACTIVITY', True):
            raise MiddlewareNotUsed("User activity tracking is disabled")
        
        try:
            self.reader = geolite2.reader() if getattr(settings, 'ENABLE_IP_GEOLOCATION', True) else None
        except Exception as e:
            logger.warning(f"Failed to initialize GeoLite2 reader: {e}")
            self.reader = None

    def process_request(self, request):
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None

        user = request.user
        current_ip = self.get_client_ip(request)
        current_device = request.META.get('HTTP_USER_AGENT', 'Unknown')

        # Check for suspicious login
        if hasattr(user, 'last_login_ip') and hasattr(user, 'last_login_device'):
            self.check_suspicious_login(user, current_ip, current_device)

        # Update user activity
        try:
            update_fields = []
            
            if not user.is_online:
                user.is_online = True
                update_fields.append('is_online')
            
            user.last_activity = timezone.now()
            update_fields.append('last_activity')
            
            if current_ip and getattr(user, 'last_login_ip', None) != current_ip:
                user.last_login_ip = current_ip
                update_fields.append('last_login_ip')
            
            if current_device and getattr(user, 'last_login_device', None) != current_device:
                user.last_login_device = current_device
                update_fields.append('last_login_device')
            
            if update_fields:
                user.save(update_fields=update_fields)
                
        except Exception as e:
            logger.error(f"Failed to update user activity for {user.email}: {e}", 
                        exc_info=settings.DEBUG)

        return None

    def check_suspicious_login(self, user, current_ip, current_device):
        """Check for suspicious login activity and send notifications"""
        previous_ip = getattr(user, 'last_login_ip', None)
        previous_device = getattr(user, 'last_login_device', None)

        if not previous_ip or not previous_device:
            return

        if previous_ip != current_ip and self.is_different_device(previous_device, current_device):
            location = self.get_location_from_ip(current_ip)
            
            logger.warning(
                f"Suspicious login detected for user {user.email} from {current_ip} ({location})"
            )
            
            if getattr(settings, 'ENABLE_SECURITY_NOTIFICATIONS', True):
                self.send_security_notification(user, current_ip, current_device, location)

    def send_security_notification(self, user, ip, device, location):
        """Send security notification about suspicious login"""
        try:
            from apps.authentication.tasks import send_security_alert_email
            device_name = self.get_device_name(device)
            
            send_security_alert_email.delay(
                user_id=str(user.id),
                ip_address=ip,
                device=device_name,
                location=location,
                timestamp=timezone.now().isoformat()
            )
        except Exception as e:
            logger.error(f"Failed to send security notification: {e}", exc_info=settings.DEBUG)

    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get_location_from_ip(self, ip):
        """Get approximate location from IP address"""
        if not self.reader or not ip or ip.startswith(('127.', '10.', '192.168.')):
            return "Local Network"
        
        try:
            match = self.reader.get(ip)
            if match:
                country = match.get('country', {}).get('names', {}).get('en', 'Unknown Country')
                city = match.get('city', {}).get('names', {}).get('en', 'Unknown City')
                return f"{city}, {country}" if city != "Unknown City" else country
        except Exception as e:
            logger.warning(f"Geolocation failed for IP {ip}: {e}")
        return "Unknown Location"

    @staticmethod
    def is_different_device(device1, device2):
        """Check if two user agents represent different devices"""
        if not device1 or not device2:
            return False
            
        # Compare browser families
        browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'MSIE', 'Opera']
        device1_browser = next((b for b in browsers if b in device1), 'Unknown')
        device2_browser = next((b for b in browsers if b in device2), 'Unknown')
        
        # Compare OS families
        os_types = ['Windows', 'Mac', 'iPhone', 'iPad', 'Android', 'Linux']
        device1_os = next((o for o in os_types if o in device1), 'Unknown')
        device2_os = next((o for o in os_types if o in device2), 'Unknown')
        
        return device1_browser != device2_browser or device1_os != device2_os

    @staticmethod
    def get_device_name(user_agent):
        """Extract readable device name from user agent"""
        user_agent = user_agent.lower()
        
        if 'iphone' in user_agent:
            return 'iPhone'
        elif 'ipad' in user_agent:
            return 'iPad'
        elif 'android' in user_agent and 'mobile' in user_agent:
            return 'Android Phone'
        elif 'android' in user_agent:
            return 'Android Tablet'
        elif 'windows' in user_agent:
            return 'Windows PC'
        elif 'macintosh' in user_agent:
            return 'Mac'
        elif 'linux' in user_agent:
            return 'Linux PC'
        else:
            return 'Unknown Device'


class UserLoginTracker(MiddlewareMixin):
    """
    Tracks user logins for security and analytics purposes.
    Records each login with device and location information.
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        if not getattr(settings, 'TRACK_USER_LOGINS', True):
            raise MiddlewareNotUsed("User login tracking is disabled")
        
        try:
            from apps.authentication.models import UserLoginLog
            self.UserLoginLog = UserLoginLog
        except ImportError as e:
            logger.error(f"Failed to import UserLoginLog model: {e}")
            raise MiddlewareNotUsed("User login tracking dependencies not available")

    def process_request(self, request):
        if (not hasattr(request, 'user') or 
            not request.user.is_authenticated or 
            request.session.get('login_recorded')):
            return None

        try:
            ip_address = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
            country, city = self.get_location_from_ip(ip_address)

            login_log = self.UserLoginLog.objects.create(
                user=request.user,
                ip_address=ip_address,
                user_agent=user_agent,
                session_id=request.session.session_key,
                country=country,
                city=city
            )

            request.session['login_recorded'] = True
            request.session['login_log_id'] = str(login_log.id)
            
            logger.info(f"Recorded login for user {request.user.email} from {ip_address}")

        except Exception as e:
            logger.error(f"Failed to record user login: {e}", exc_info=settings.DEBUG)

        return None

    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get_location_from_ip(self, ip):
        """Get country and city from IP address"""
        if not ip or ip.startswith(('127.', '10.', '192.168.')):
            return "Local Network", "Local Network"
        
        try:
            import geoip2.database
            with geoip2.database.Reader(settings.GEOIP_PATH) as reader:
                response = reader.city(ip)
                return response.country.name, response.city.name
        except Exception as e:
            logger.warning(f"Geolocation failed for IP {ip}: {e}")
            return "Unknown Country", "Unknown City"