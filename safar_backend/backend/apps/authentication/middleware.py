import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from apps.authentication.models import UserLoginLog

User = get_user_model()
logger = logging.getLogger(__name__)

class UserActivityMiddleware(MiddlewareMixin):
    """
    Middleware to track user activity and detect suspicious logins.
    """
    
    def process_request(self, request):
        if request.user.is_authenticated:
            # Update last activity timestamp
            user = request.user
            
            # Store previous login info if available
            previous_ip = getattr(user, 'last_login_ip', None)
            previous_device = getattr(user, 'last_login_device', None)
            
            # Get current request info
            current_ip = self._get_client_ip(request)
            current_device = request.META.get('HTTP_USER_AGENT', '')
            
            # Check for suspicious login (different IP and device)
            if (previous_ip and previous_device and 
                previous_ip != current_ip and 
                self._is_different_device(previous_device, current_device)):
                
                # Get approximate location from IP
                location = self._get_location_from_ip(current_ip)
                
                # Send security notification
                from apps.authentication.signals import send_security_notification
                send_security_notification(
                    user_id=str(user.id),
                    event_type="login",
                    ip_address=current_ip,
                    device=self._get_device_name(current_device),
                    location=location
                )
                
                logger.info(f"Detected suspicious login for user {user.email}")
            
            # Update user's last activity
            try:
                user.is_online = True
                user.last_activity = timezone.now()
                user.last_login_ip = current_ip
                user.last_login_device = current_device
                user.save(update_fields=['is_online', 'last_activity', 'last_login_ip', 'last_login_device'])
            except Exception as e:
                logger.error(f"Failed to update user activity: {str(e)}")
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _is_different_device(self, device1, device2):
        """Check if two user agent strings likely represent different devices"""
        # Simple check - can be improved with more sophisticated user agent parsing
        if not device1 or not device2:
            return False
            
        # Check major browser/OS differences
        browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'MSIE', 'Opera']
        os_types = ['Windows', 'Mac', 'iPhone', 'iPad', 'Android', 'Linux']
        
        device1_browser = next((b for b in browsers if b in device1), 'Unknown')
        device2_browser = next((b for b in browsers if b in device2), 'Unknown')
        
        device1_os = next((o for o in os_types if o in device1), 'Unknown')
        device2_os = next((o for o in os_types if o in device2), 'Unknown')
        
        return device1_browser != device2_browser or device1_os != device2_os
    
    def _get_device_name(self, user_agent):
        """Extract readable device name from user agent"""
        if 'iPhone' in user_agent:
            return 'iPhone'
        elif 'iPad' in user_agent:
            return 'iPad'
        elif 'Android' in user_agent and 'Mobile' in user_agent:
            return 'Android Phone'
        elif 'Android' in user_agent:
            return 'Android Tablet'
        elif 'Windows' in user_agent:
            return 'Windows PC'
        elif 'Macintosh' in user_agent:
            return 'Mac'
        else:
            return 'Unknown Device'
    
    def _get_location_from_ip(self, ip):
        """Get approximate location from IP address"""
        # This is a placeholder - you would implement with a geolocation service
        # like MaxMind GeoIP, ipstack, or similar
        try:
            # Placeholder for actual implementation
            return "Unknown Location"
        except Exception as e:
            logger.error(f"Failed to get location from IP: {str(e)}")
            return "Unknown Location"

class UserLoginTracker(MiddlewareMixin):
    """
    Middleware to track user logins for points and analytics.
    """
    
    def process_request(self, request):
        if request.user.is_authenticated:
            # Check if this is a new login session
            if not request.session.get('login_recorded'):
                try:
                    # Get location data
                    ip_address = self._get_client_ip(request)
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    # Get approximate location from IP
                    country, city = self._get_location_from_ip(ip_address)
                    
                    # Record the login
                    login_log = UserLoginLog.objects.create(
                        user=request.user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        session_id=request.session.session_key,
                        country=country,
                        city=city
                    )
                    
                    # Mark session as recorded
                    request.session['login_recorded'] = True
                    request.session['login_log_id'] = str(login_log.id)
                    
                    logger.info(f"Recorded login for user {request.user.email}")
                    
                except Exception as e:
                    logger.error(f"Failed to record user login: {str(e)}")
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_location_from_ip(self, ip):
        """Get country and city from IP address"""
        # This is a placeholder - you would implement with a geolocation service
        try:
            # Placeholder for actual implementation
            return "Unknown Country", "Unknown City"
        except Exception as e:
            logger.error(f"Failed to get location from IP: {str(e)}")
            return "Unknown Country", "Unknown City"
