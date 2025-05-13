import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from apps.authentication.models import UserLoginLog

User = get_user_model()
logger = logging.getLogger(__name__)


def is_api_request(request):
    """
    Determine if the request is an API request based on path or headers.
    """
    return (
        request.path.startswith('/api/') or 
        request.path.startswith('/auth/') or
        'application/json' in request.META.get('HTTP_ACCEPT', '') or
        'Authorization' in request.headers
    )


def attach_user_from_token(request):
    """
    Attempt to authenticate user from JWT token for API requests.
    """
    try:
        from rest_framework.authentication import get_authorization_header
        from apps.authentication.authentication import CustomJWTAuthentication
        
        auth = get_authorization_header(request).split()
        if auth and len(auth) == 2:
            jwt_auth = CustomJWTAuthentication()
            user, _ = jwt_auth.authenticate(request)
            if user and user.is_authenticated:
                request.user = user
                return True
    except Exception as e:
        logger.debug(f"Token authentication failed: {str(e)}")
    return False


class UserActivityMiddleware(MiddlewareMixin):
    """
    Middleware to track user activity and detect suspicious logins.
    Works for both admin interface and API requests.
    """
    def process_request(self, request):
        # Check if this is an API request
        api_request = is_api_request(request)
        
        # For API requests, try to authenticate via token if not already authenticated
        if api_request and (not hasattr(request, 'user') or not request.user.is_authenticated):
            attach_user_from_token(request)
        
        # Only proceed if we have an authenticated user
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            
            # Get current request details
            current_ip = self._get_client_ip(request)
            current_device = request.META.get('HTTP_USER_AGENT', '')
            
            # Check for suspicious login if this is an API request
            if api_request:
                previous_ip = getattr(user, 'last_login_ip', None)
                previous_device = getattr(user, 'last_login_device', '')
                
                if (previous_ip and previous_device and 
                    previous_ip != current_ip and 
                    self._is_different_device(previous_device, current_device)):
                    
                    location = self._get_location_from_ip(current_ip)
                    
                    from apps.authentication.signals import send_security_notification
                    send_security_notification(
                        user_id=str(user.id),
                        event_type="login",
                        ip_address=current_ip,
                        device=self._get_device_name(current_device),
                        location=location
                    )
                    
                    logger.info(f"Detected suspicious login for user {user.email}")
            
            # Update user activity
            try:
                update_fields = []
                user.is_online = True
                update_fields.append('is_online')
                
                user.last_activity = timezone.now()
                update_fields.append('last_activity')
                
                # Only update IP and device for API requests
                if api_request:
                    user.last_login_ip = current_ip
                    update_fields.append('last_login_ip')
                    
                    user.last_login_device = current_device
                    update_fields.append('last_login_device')
                
                user.save(update_fields=update_fields)
            except Exception as e:
                logger.error(f"Failed to update user activity: {str(e)}", exc_info=True)

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
        if not device1 or not device2:
            return False
            
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
        try:
            # You might want to implement proper IP geolocation here
            return "Unknown Location"
        except Exception as e:
            logger.error(f"Failed to get location from IP: {str(e)}")
            return "Unknown Location"


class UserLoginTracker(MiddlewareMixin):
    """
    Middleware to track user logins for points and analytics.
    Works for both admin interface and API requests.
    """
    def process_request(self, request):
        # Check if this is an API request
        api_request = is_api_request(request)
        
        # For API requests, try to authenticate via token if not already authenticated
        if api_request and (not hasattr(request, 'user') or not request.user.is_authenticated):
            attach_user_from_token(request)
        
        # Only proceed if we have an authenticated user and login not already recorded
        if (hasattr(request, 'user') and request.user.is_authenticated and 
            not request.session.get('login_recorded')):
            
            try:
                ip_address = self._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                country, city = self._get_location_from_ip(ip_address)
                
                login_log = UserLoginLog.objects.create(
                    user=request.user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_id=request.session.session_key if hasattr(request, 'session') else None,
                    country=country,
                    city=city,
                    login_status="success"
                )

                # For API requests, we can't use session, so we set a short-lived cookie
                if api_request:
                    request.login_recorded = True
                else:
                    request.session['login_recorded'] = True
                    request.session['login_log_id'] = str(login_log.id)
                
                logger.info(f"Recorded login for user {request.user.email}")
                
            except Exception as e:
                logger.error(f"Failed to record user login: {str(e)}", exc_info=True)
    
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
        try:
            # Implement proper IP geolocation here if needed
            return "Unknown Country", "Unknown City"
        except Exception as e:
            logger.error(f"Failed to get location from IP: {str(e)}")
            return "Unknown Country", "Unknown City"