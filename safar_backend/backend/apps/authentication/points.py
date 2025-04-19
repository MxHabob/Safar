import logging
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.db.models import Sum
from apps.authentication.models import User, PointsTransaction, UserInteraction, InteractionType

logger = logging.getLogger(__name__)

class PointsManager:
    """
    Enhanced points manager that handles user points and membership levels.
    Awards points for various user actions and handles membership upgrades.
    """
    
    POINTS_CONFIG_CACHE_KEY = 'points_config'
    DAILY_POINTS_PREFIX = 'daily_points:'
    
    CACHE_DURATION = 60 * 60 * 24
    
    @classmethod
    def get_points_config(cls, refresh=False):
        """
        Get points configuration from InteractionType model with caching.
        
        Args:
            refresh: Force refresh the cache
            
        Returns:
            dict: Points configuration
        """
        if not refresh:
            config = cache.get(cls.POINTS_CONFIG_CACHE_KEY)
            if config:
                return config
        
        config = {}
        try:
            interaction_types = InteractionType.objects.filter(is_active=True)
            
            for interaction_type in interaction_types:
                config[interaction_type.code] = {
                    'points': interaction_type.points_value,
                    'daily_limit': interaction_type.daily_limit,
                    'name': interaction_type.name,
                    'category': interaction_type.category
                }
            
            default_values = {
                'booking_complete': {'points': 100, 'daily_limit': 0},
                'booking_value': {'points': 0.01, 'daily_limit': 0},
                'review_add': {'points': 25, 'daily_limit': 5},
                'review_with_photo': {'points': 10, 'daily_limit': 5},
                'review_helpful': {'points': 5, 'daily_limit': 10},
                'daily_login': {'points': 5, 'daily_limit': 1},
                'profile_complete': {'points': 50, 'daily_limit': 1},
                'add_wishlist': {'points': 2, 'daily_limit': 10},
                'share_item': {'points': 10, 'daily_limit': 5},
                'view_place': {'points': 1, 'daily_limit': 10},
                'view_experience': {'points': 1, 'daily_limit': 10},
                'search_perform': {'points': 1, 'daily_limit': 5},
            }
            
            for action, values in default_values.items():
                if action not in config:
                    config[action] = {
                        'points': values['points'],
                        'daily_limit': values['daily_limit'],
                        'name': action.replace('_', ' ').title(),
                        'category': 'general'
                    }
            
            cache.set(cls.POINTS_CONFIG_CACHE_KEY, config, cls.CACHE_DURATION)
            
            return config
            
        except Exception as e:
            logger.error(f"Error loading points configuration: {str(e)}", exc_info=True)
            return default_values
    
    @classmethod
    def get_membership_thresholds(cls):
        """
        Get membership level thresholds.
        
        Returns:
            dict: Membership thresholds
        """
        return {
            User.MembershipLevel.BRONZE: 0,
            User.MembershipLevel.SILVER: 1000,
            User.MembershipLevel.GOLD: 5000,
            User.MembershipLevel.PLATINUM: 10000
        }
    
    @classmethod
    def award_points_for_interaction(cls, interaction, notify=True):
        """
        Award points based on a UserInteraction record.
        
        Args:
            interaction: UserInteraction object
            notify: Whether to send a notification
            
        Returns:
            tuple: (points_awarded, new_total_points)
        """
        if not isinstance(interaction, UserInteraction):
            logger.error(f"Invalid interaction object provided: {interaction}")
            return 0, 0
        
        interaction_to_action = {
            'view_place': 'view_place',
            'view_experience': 'view_experience',
            'share': 'share_item',
            'search': 'search_perform',
            'add_wishlist': 'add_wishlist',
            'review_add': 'review_add',
            'review_with_photo': 'review_with_photo',
            'review_helpful': 'review_helpful',
            'login': 'daily_login',
            'profile_update': 'profile_complete',
            'booking_complete': 'booking_complete',
            'booking_value': 'booking_value',
        }
        
        action = interaction_to_action.get(interaction.interaction_type, interaction.interaction_type)
        
        config = cls.get_points_config()
        if action not in config:
            logger.debug(f"No points configuration for action '{action}'")
            return 0, 0
        
        daily_limit = config[action]['daily_limit']
        if daily_limit > 0:
            today = timezone.now().date().isoformat()
            cache_key = f"{cls.DAILY_POINTS_PREFIX}{interaction.user.id}:{action}:{today}"
            
            count = cache.get(cache_key)
            if count is None:
                count = PointsTransaction.objects.filter(
                    user=interaction.user,
                    action=action,
                    created_at__date=timezone.now().date()
                ).count()
                
                cache.set(cache_key, count, cls.CACHE_DURATION)
            
            if count >= daily_limit:
                logger.debug(f"Daily limit reached for user {interaction.user.id} and action {action}")
                return 0, interaction.user.points

        points_to_award = config[action]['points']
   
        if action == 'booking_value' and interaction.metadata and 'amount' in interaction.metadata:
            try:
                amount = Decimal(interaction.metadata['amount'])
                currency = interaction.metadata.get('currency', 'USD')
                
                if currency != settings.DEFAULT_CURRENCY:
                    amount = amount
                    
                points_to_award = int(amount * Decimal(points_to_award))
            except (ValueError, TypeError) as e:
                logger.error(f"Error calculating booking value points: {str(e)}")
                points_to_award = 0
        
        # Award the points
        return cls.award_points(
            user=interaction.user,
            action=action,
            points=points_to_award,
            metadata=interaction.metadata,
            interaction=interaction,
            notify=notify
        )
    
    @classmethod
    def award_points(cls, user, action, points=None, quantity=1, metadata=None, interaction=None, notify=True):
        """
        Award points to a user for a specific action.
        
        Args:
            user: User object
            action: String key from points configuration
            points: Override points value (if None, use config)
            quantity: Number of times to award the action (default: 1)
            metadata: Additional context about the action
            interaction: Related UserInteraction object
            notify: Whether to send a notification
            
        Returns:
            tuple: (points_awarded, new_total_points)
        """
        if not isinstance(user, User):
            logger.error(f"Invalid user object provided to award_points: {user}")
            return 0, 0

        config = cls.get_points_config()
        
        if action not in config and points is None:
            logger.warning(f"Unknown action '{action}' in award_points and no points override provided")
            return 0, 0
        
        try:
            if points is None:
                points_to_award = config[action]['points'] * quantity
            else:
                points_to_award = points * quantity
            
            if points_to_award <= 0:
                return 0, user.points
            
            with transaction.atomic():
                user = User.objects.select_for_update().get(id=user.id)
                
                old_membership = user.membership_level
                old_points = user.points
                
                user.points += points_to_award
                
                new_membership = cls._check_membership_upgrade(user.points)
                if new_membership != old_membership:
                    user.membership_level = new_membership
                    membership_upgraded = True
                else:
                    membership_upgraded = False
            
                user.save(update_fields=['points', 'membership_level'])

                transaction = PointsTransaction.objects.create(
                    user=user,
                    action=action,
                    points=points_to_award,
                    metadata=metadata or {},
                    interaction=interaction,
                    balance_after=user.points
                )
                
                if action in config and config[action]['daily_limit'] > 0:
                    today = timezone.now().date().isoformat()
                    cache_key = f"{cls.DAILY_POINTS_PREFIX}{user.id}:{action}:{today}"
                    count = cache.get(cache_key, 0)
                    cache.set(cache_key, count + 1, cls.CACHE_DURATION)
    
                if notify:
                    cls._send_points_notification(
                        user=user,
                        action=action,
                        points_awarded=points_to_award,
                        metadata=metadata,
                        transaction=transaction
                    )
                    
                    if membership_upgraded:
                        from apps.authentication.signals import notify_membership_change
                        notify_membership_change(user, old_membership, new_membership)
                
                logger.info(
                    f"Awarded {points_to_award} points to user {user.id} for {action}. "
                    f"New total: {user.points}. Membership: {user.membership_level}"
                )
                
                return points_to_award, user.points
                
        except Exception as e:
            logger.error(f"Error awarding points to user {user.id}: {str(e)}", exc_info=True)
            return 0, user.points if hasattr(user, 'points') else 0
    
    @classmethod
    def deduct_points(cls, user, points, reason, metadata=None, notify=True):
        """
        Deduct points from a user.
        
        Args:
            user: User object
            points: Number of points to deduct
            reason: Reason for deduction
            metadata: Additional context
            notify: Whether to send a notification
            
        Returns:
            tuple: (points_deducted, new_total_points)
        """
        if not isinstance(user, User):
            logger.error(f"Invalid user object provided to deduct_points: {user}")
            return 0, 0
        
        if points <= 0:
            logger.warning(f"Attempted to deduct non-positive points: {points}")
            return 0, user.points
        
        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(id=user.id)
                
                old_membership = user.membership_level
                
                points_to_deduct = min(points, user.points)
                user.points -= points_to_deduct
                
                new_membership = cls._check_membership_upgrade(user.points)
                if new_membership != old_membership:
                    user.membership_level = new_membership
                    membership_changed = True
                else:
                    membership_changed = False
                
                user.save(update_fields=['points', 'membership_level'])
                
                transaction = PointsTransaction.objects.create(
                    user=user,
                    action=f"deduct:{reason}",
                    points=-points_to_deduct,
                    metadata=metadata or {},
                    balance_after=user.points
                )
                
                if notify and points_to_deduct > 0:
                    cls._send_points_deduction_notification(
                        user=user,
                        reason=reason,
                        points_deducted=points_to_deduct,
                        metadata=metadata,
                        transaction=transaction
                    )

                    if membership_changed:
                        from apps.authentication.signals import notify_membership_change
                        notify_membership_change(user, old_membership, new_membership)
                
                logger.info(
                    f"Deducted {points_to_deduct} points from user {user.id} for {reason}. "
                    f"New total: {user.points}. Membership: {user.membership_level}"
                )
                
                return points_to_deduct, user.points
                
        except Exception as e:
            logger.error(f"Error deducting points from user {user.id}: {str(e)}", exc_info=True)
            return 0, user.points if hasattr(user, 'points') else 0
    
    @classmethod
    def get_points_history(cls, user, limit=20, offset=0, action_filter=None, date_from=None, date_to=None):
        """
        Get user's points transaction history with filtering options.
        
        Args:
            user: User object
            limit: Maximum number of transactions to return
            offset: Offset for pagination
            action_filter: Filter by action type
            date_from: Filter by start date
            date_to: Filter by end date
            
        Returns:
            QuerySet of PointsTransaction objects
        """
        query = PointsTransaction.objects.filter(user=user)
        
        if action_filter:
            query = query.filter(action=action_filter)
        
        if date_from:
            query = query.filter(created_at__gte=date_from)
        
        if date_to:
            query = query.filter(created_at__lte=date_to)
        
        return query.order_by('-created_at')[offset:offset+limit]
    
    @classmethod
    def get_points_summary(cls, user):
        """
        Get summary of user's points by category.
        
        Args:
            user: User object
            
        Returns:
            dict: Summary of points by category
        """
        earned_points = PointsTransaction.objects.filter(
            user=user,
            points__gt=0
        ).values('action').annotate(
            total=Sum('points')
        ).order_by('-total')
        
        spent_points = PointsTransaction.objects.filter(
            user=user,
            points__lt=0
        ).values('action').annotate(
            total=Sum('points')
        ).order_by('total') 
        
        config = cls.get_points_config()
        points_by_category = {}
        
        for item in earned_points:
            action = item['action']
            if action in config:
                category = config[action]['category']
                if category not in points_by_category:
                    points_by_category[category] = 0
                points_by_category[category] += item['total']
        
        next_level = cls._get_next_membership_level(user.points)
        points_to_next_level = cls._get_points_to_next_level(user.points)
        
        if next_level:
            thresholds = cls.get_membership_thresholds()
            current_level = cls._check_membership_upgrade(user.points)
            current_threshold = thresholds[current_level]
            next_threshold = thresholds[next_level]
            
            total_needed = next_threshold - current_threshold
            current_progress = user.points - current_threshold
            progress_percentage = min(100, int((current_progress / total_needed) * 100))
        else:
            progress_percentage = 100
        
        return {
            'total_points': user.points,
            'earned_points': {item['action']: item['total'] for item in earned_points},
            'spent_points': {item['action']: abs(item['total']) for item in spent_points},
            'points_by_category': points_by_category,
            'membership_level': user.membership_level,
            'next_level': next_level,
            'points_to_next_level': points_to_next_level,
            'progress_percentage': progress_percentage,
            'recent_transactions': list(PointsTransaction.objects.filter(user=user).order_by('-created_at')[:5].values('action', 'points', 'created_at'))
        }
    
    @classmethod
    def _check_membership_upgrade(cls, points):
        """
        Check if the user should be upgraded to a higher membership level.
        
        Args:
            points: User's current points
            
        Returns:
            str: Appropriate membership level
        """
        thresholds = cls.get_membership_thresholds()
        current_level = User.MembershipLevel.BRONZE
        
        for level, threshold in sorted(thresholds.items(), key=lambda x: x[1]):
            if points >= threshold:
                current_level = level
            else:
                break
                
        return current_level
    
    @classmethod
    def _get_next_membership_level(cls, points):
        """
        Get the next membership level the user can achieve.
        
        Args:
            points: User's current points
            
        Returns:
            str or None: Next membership level or None if at max level
        """
        current_level = cls._check_membership_upgrade(points)
        thresholds = cls.get_membership_thresholds()

        sorted_levels = sorted(thresholds.items(), key=lambda x: x[1])
  
        for i, (level, threshold) in enumerate(sorted_levels):
            if level == current_level:
                if i < len(sorted_levels) - 1:
                    return sorted_levels[i + 1][0]
                else:
                    return None
        
        return None
    
    @classmethod
    def _get_points_to_next_level(cls, points):
        """
        Get points needed to reach the next membership level.
        
        Args:
            points: User's current points
            
        Returns:
            int: Points needed or 0 if at max level
        """
        next_level = cls._get_next_membership_level(points)
        thresholds = cls.get_membership_thresholds()
        
        if next_level:
            return thresholds[next_level] - points
        else:
            return 0 
    
    @classmethod
    def _send_points_notification(cls, user, action, points_awarded, metadata=None, transaction=None):
        """
        Send notification about points earned.
        
        Args:
            user: User object
            action: Action that earned points
            points_awarded: Number of points awarded
            metadata: Additional context
            transaction: PointsTransaction object
        """
        try:
    
            config = cls.get_points_config()
            if action in config:
                action_desc = config[action]['name']
            else:

                action_descriptions = {
                    'booking_complete': 'completing a booking',
                    'booking_value': 'your booking value',
                    'review_add': 'writing a review',
                    'review_with_photo': 'adding photos to your review',
                    'review_helpful': 'your helpful review',
                    'daily_login': 'logging in today',
                    'profile_complete': 'completing your profile',
                    'add_wishlist': 'adding to your wishlist',
                    'share_item': 'sharing with friends',
                    'view_place': 'exploring places',
                    'view_experience': 'exploring experiences',
                    'search_perform': 'searching for destinations'
                }
                action_desc = action_descriptions.get(action, action.replace('_', ' '))
            
            message = f"You earned {points_awarded} points for {action_desc}!"
            
            points_to_next = cls._get_points_to_next_level(user.points)
            next_level = cls._get_next_membership_level(user.points)
            
            if next_level and points_to_next <= 500:
                message += f" You're only {points_to_next} points away from {next_level} membership!"
            
            data = {
                "deep_link": "/account/points",
                "points_awarded": points_awarded,
                "action": action,
                "current_points": user.points,
                "next_level": next_level,
                "points_to_next_level": points_to_next,
                "transaction_id": str(transaction.id) if transaction else None
            }
            
            if metadata:
                data.update({"context": metadata})
            
            from apps.core_apps.services import NotificationService
            NotificationService.send_notification(
                user=user,
                notification_type="Points Earned",
                message=message,
                data=data,
                immediate=False
            )
            
        except Exception as e:
            logger.error(f"Error sending points notification to user {user.id}: {str(e)}")
    
    @classmethod
    def _send_points_deduction_notification(cls, user, reason, points_deducted, metadata=None, transaction=None):
        """
        Send notification about points deducted.
        
        Args:
            user: User object
            reason: Reason for deduction
            points_deducted: Number of points deducted
            metadata: Additional context
            transaction: PointsTransaction object
        """
        try:
            message = f"{points_deducted} points have been deducted from your account for {reason}."

            data = {
                "deep_link": "/account/points",
                "points_deducted": points_deducted,
                "reason": reason,
                "current_points": user.points,
                "transaction_id": str(transaction.id) if transaction else None
            }
            
            if metadata:
                data.update({"context": metadata})
            
            from apps.core_apps.services import NotificationService
            NotificationService.send_notification(
                user=user,
                notification_type="Points Deducted",
                message=message,
                data=data,
                immediate=False
            )
            
        except Exception as e:
            logger.error(f"Error sending points deduction notification to user {user.id}: {str(e)}")
