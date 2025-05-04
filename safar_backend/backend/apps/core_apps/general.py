from rest_framework import viewsets
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_api_key.permissions import HasAPIKey
from apps.videos.models import MediaFile
from apps.videos.serializers import MediaFileSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import AnonymousUser

class VideoViewSet(viewsets.ModelViewSet):
    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated | HasAPIKey]

    def get_queryset(self):
        if not isinstance(self.request.user, AnonymousUser):
            return MediaFile.objects.filter(user=self.request.user)
        return MediaFile.objects.none()

    def get_permissions(self):
        if self.action == 'public_videos':
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Only authenticated users can create videos
        if isinstance(self.request.user, AnonymousUser):
            raise PermissionDenied("Authentication required to create videos")
            
        video = serializer.save(user=self.request.user)
        if video.media_url:
            video.analysis_status = 'processing'
            # process_media_url.delay(str(video.id))
        elif video.file:
            pass
            
        video.save()

    def update(self, request, *args, **kwargs):
        video = self.get_object()
        if 'analysis_result' in request.data:
            video.analysis_result = request.data['analysis_result']
            video.analysis_date = timezone.now()
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='public')
    def public_videos(self, request):
        public_videos = MediaFile.objects.filter(is_public=True)
        serializer = self.get_serializer(public_videos, many=True)
        return Response(serializer.data)