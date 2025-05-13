from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.authentication.serializers import UserInteractionSerializer,PointsTransactionSerializer
from apps.authentication.models import UserInteraction,PointsTransaction
from django.contrib.contenttypes.models import ContentType
from apps.core_apps.general import BaseViewSet,GENPagination
from django.shortcuts import get_object_or_404
from djoser.views import UserViewSet as DjoserUserViewSet

class UserViewSet(DjoserUserViewSet):
    pagination_class = GENPagination
    lookup_field = 'id'
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, id=None):
        user_to_follow = get_object_or_404(self.get_queryset(), pk=id)
        if request.user.follow(user_to_follow):
            return Response({'status': 'following'}, status=status.HTTP_200_OK)
        return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, id=None):
        user_to_unfollow = get_object_or_404(self.get_queryset(), pk=id)
        request.user.unfollow(user_to_unfollow)
        return Response({'status': 'unfollowed'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def followers(self, request):
        followers = request.user.followers.all()
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def following(self, request):
        following = request.user.following.all()
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def user_followers(self, request, id=None):
        user = self.get_object()
        followers = user.followers.all()
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def user_following(self, request, id=None):
        user = self.get_object()
        following = user.following.all()
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)


class UserInteractionListView(BaseViewSet):
    serializer_class = UserInteractionSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserInteractionViewSet(BaseViewSet):
    queryset = UserInteraction.objects.all()
    serializer_class = UserInteractionSerializer

    def get_queryset(self):
            return UserInteraction.objects.filter(user=self.request.user).select_related(
                'content_type'
            ).order_by('-created_at')
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        try:
            app_label, model = data['content_type'].split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            
            interaction = UserInteraction.objects.create(
                user=request.user,
                content_type=content_type,
                object_id=data['object_id'],
                interaction_type=data['interaction_type'],
                metadata=data.get('metadata', {}),
                device_type=data.get('device_type', 'desktop')
            )
            
            serializer = self.get_serializer(interaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class PointsTransactionViewSet(BaseViewSet):
    """
    ViewSet for PointsTransaction model.
    """
    queryset = PointsTransaction.objects.all()
    serializer_class = PointsTransactionSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of the user's points.
        """
        from apps.authentication.points import PointsManager
        
        points_manager = PointsManager(request.user)
        summary = points_manager.get_summary()
        
        return Response(summary)

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """
        Get the points leaderboard.
        """
        from apps.authentication.points import PointsManager
        
        leaderboard = PointsManager.get_leaderboard()
        return Response(leaderboard)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Get the user's points history with pagination.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)