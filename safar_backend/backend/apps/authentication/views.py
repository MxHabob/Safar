from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.authentication.serializers import UserInteractionSerializer
from apps.authentication.models import UserInteraction
from django.contrib.contenttypes.models import ContentType
from apps.core_apps.general import BaseViewSet
from django.shortcuts import get_object_or_404
from djoser.views import UserViewSet as DjoserUserViewSet

class UserViewSet(DjoserUserViewSet):
    """Extends Djoser's UserViewSet with custom functionality"""
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
        