import logging
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.db.models import Sum
from apps.authentication.models import User, PointsTransaction, UserInteraction, InteractionType
from django.db import transaction

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
    def get_summary(cls, user):
        """
        Get a comprehensive summary of the user's points status.
        
        Args:
            user: User object
            
        Returns:
            dict: Points summary including:
                - total_points: Current points balance
                - membership_level: Current membership level
                - next_level: Next membership level (or None if max)
                - points_to_next_level: Points needed for next level
                - progress_percentage: Progress to next level (0-100)
                - recent_transactions: Last 5 transactions
                - points_by_category: Points earned by category
                - daily_limits: Current daily limits status
        """
        if not isinstance(user, User):
            logger.error(f"Invalid user object provided to get_summary: {user}")
            return {}
        
        try:
            thresholds = cls.get_membership_thresholds()
            current_level = user.membership_level
            next_level = cls._get_next_membership_level(user.points)

            if next_level:
                current_threshold = thresholds[current_level]
                next_threshold = thresholds[next_level]
                points_needed = next_threshold - current_threshold
                points_earned = user.points - current_threshold
                progress_percentage = min(100, int((points_earned / points_needed) * 100))
                points_to_next = next_threshold - user.points
            else:
                progress_percentage = 100
                points_to_next = 0
            
            recent_transactions = PointsTransaction.objects.filter(
                user=user
            ).order_by('-created_at')[:5].values(
                'id', 'action', 'points', 'created_at'
            )
            
            config = cls.get_points_config()
            points_by_category = PointsTransaction.objects.filter(
                user=user,
                points__gt=0
            ).values('action').annotate(
                total=Sum('points')
            ).order_by('-total')
            
            categorized_points = {}
            for item in points_by_category:
                action = item['action']
                if action in config:
                    category = config[action]['category']
                    if category not in categorized_points:
                        categorized_points[category] = 0
                    categorized_points[category] += item['total']
            
            daily_limits = {}
            today = timezone.now().date().isoformat()
            
            for action, values in config.items():
                if values['daily_limit'] > 0:
                    cache_key = f"{cls.DAILY_POINTS_PREFIX}{user.id}:{action}:{today}"
                    count = cache.get(cache_key)
                    if count is None:
                        count = PointsTransaction.objects.filter(
                            user=user,
                            action=action,
                            created_at__date=timezone.now().date()
                        ).count()
                        cache.set(cache_key, count, cls.CACHE_DURATION)
                    
                    daily_limits[action] = {
                        'used': count,
                        'remaining': max(0, values['daily_limit'] - count),
                        'limit': values['daily_limit'],
                        'name': values['name']
                    }
            
            return {
                'total_points': user.points,
                'membership_level': current_level,
                'next_level': next_level,
                'points_to_next_level': points_to_next,
                'progress_percentage': progress_percentage,
                'recent_transactions': list(recent_transactions),
                'points_by_category': categorized_points,
                'daily_limits': daily_limits,
                'membership_thresholds': thresholds
            }
            
        except Exception as e:
            logger.error(f"Error generating points summary for user {user.id}: {str(e)}")
            return {
                'total_points': user.points,
                'membership_level': user.membership_level,
                'next_level': None,
                'points_to_next_level': 0,
                'progress_percentage': 100,
                'recent_transactions': [],
                'points_by_category': {},
                'daily_limits': {},
                'membership_thresholds': cls.get_membership_thresholds()
            }

    @classmethod
    def get_leaderboard(cls, limit=20, period='all_time'):
        """
        Get points leaderboard for top users.
        
        Args:
            limit: Number of users to return
            period: Time period ('all_time', 'monthly', 'weekly')
            
        Returns:
            list: Leaderboard entries with user info and points
        """
        from django.db.models import Sum, F
        from django.utils import timezone
        from datetime import timedelta
        
        base_query = User.objects.filter(is_active=True).annotate(
            total_points=F('points')
        ).order_by('-total_points', 'date_joined')
        
        if period == 'monthly':
            start_date = timezone.now() - timedelta(days=30)
            base_query = base_query.annotate(
                total_points=Sum('pointstransaction__points', 
                               filter=models.Q(pointstransaction__created_at__gte=start_date))
            ).filter(total_points__gt=0)
        elif period == 'weekly':
            start_date = timezone.now() - timedelta(days=7)
            base_query = base_query.annotate(
                total_points=Sum('pointstransaction__points',
                               filter=models.Q(pointstransaction__created_at__gte=start_date))
            ).filter(total_points__gt=0)
        
        leaderboard = []
        for rank, user in enumerate(base_query[:limit], 1):
            leaderboard.append({
                'rank': rank,
                'user_id': user.id,
                'name': user.get_full_name(),
                'avatar': user.profile.avatar.url if hasattr(user, 'profile') and user.profile.avatar else None,
                'points': user.total_points,
                'membership_level': user.membership_level
            })
            
        return leaderboard

    @classmethod
    def reset_daily_points_counts(cls):
        """
        Reset all daily points counts (to be run by a scheduled task).
        """
        from django.core.cache import cache
        from django.db.models import Q
        
        # Clear all daily points cache keys
        keys = cache.keys(f"{cls.DAILY_POINTS_PREFIX}*")
        for key in keys:
            cache.delete(key)
            
        logger.info(f"Reset {len(keys)} daily points counters")

    @classmethod
    def bulk_award_points(cls, users, action, points=None, metadata=None):
        """
        Award points to multiple users at once (more efficient than individual calls).
        
        Args:
            users: QuerySet or list of User objects
            action: Action key
            points: Points to award (if None, use config)
            metadata: Additional context
            
        Returns:
            int: Number of users who received points
        """
        if not users:
            return 0
            
        config = cls.get_points_config()
        
        if points is None:
            if action not in config:
                logger.warning(f"Unknown action '{action}' in bulk_award_points")
                return 0
            points_to_award = config[action]['points']
        else:
            points_to_award = points
            
        if points_to_award <= 0:
            return 0
            
        updated_count = 0
        
        try:
            with transaction.atomic():
                # Update users in bulk
                user_ids = [user.id for user in users]
                
                updated_count = User.objects.filter(
                    id__in=user_ids
                ).update(
                    points=models.F('points') + points_to_award
                )
                
                # Create transactions
                transactions = []
                now = timezone.now()
                
                for user in users:
                    transactions.append(PointsTransaction(
                        user=user,
                        action=action,
                        points=points_to_award,
                        metadata=metadata or {},
                        created_at=now,
                        updated_at=now,
                        balance_after=user.points + points_to_award
                    ))
                
                PointsTransaction.objects.bulk_create(transactions)
                
                logger.info(
                    f"Bulk awarded {points_to_award} points to {updated_count} users "
                    f"for action {action}"
                )
                
                return updated_count
                
        except Exception as e:
            logger.error(f"Error in bulk_award_points: {str(e)}", exc_info=True)
            return 0

    @classmethod
    def get_daily_points_remaining(cls, user, action):
        """
        Get remaining daily points available for a specific action.
        
        Args:
            user: User object
            action: Action key
            
        Returns:
            int: Points remaining before hitting daily limit (or None if no limit)
        """
        config = cls.get_points_config()
        
        if action not in config:
            return None
            
        daily_limit = config[action]['daily_limit']
        if daily_limit <= 0:
            return None
            
        today = timezone.now().date().isoformat()
        cache_key = f"{cls.DAILY_POINTS_PREFIX}{user.id}:{action}:{today}"
        
        count = cache.get(cache_key)
        if count is None:
            count = PointsTransaction.objects.filter(
                user=user,
                action=action,
                created_at__date=timezone.now().date()
            ).count()
            cache.set(cache_key, count, cls.CACHE_DURATION)
            
        remaining = max(0, daily_limit - count)
        return remaining

    @classmethod
    def recalculate_user_points(cls, user):
        """
        Recalculate a user's total points from all transactions.
        
        Args:
            user: User object
            
        Returns:
            int: New calculated points total
        """
        try:
            with transaction.atomic():
                total = PointsTransaction.objects.filter(
                    user=user
                ).aggregate(
                    total=Sum('points')
                )['total'] or 0
                
                user.points = total
                user.membership_level = cls._check_membership_upgrade(total)
                user.save(update_fields=['points', 'membership_level'])
                
                logger.info(
                    f"Recalculated points for user {user.id}. "
                    f"New total: {total}. Membership: {user.membership_level}"
                )
                
                return total
                
        except Exception as e:
            logger.error(f"Error recalculating points for user {user.id}: {str(e)}")
            return user.points
            
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
