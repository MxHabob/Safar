import uuid
from django.db import models
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework import viewsets

class GENPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class BaseModelManager(models.Manager):
    def active(self):
        return self.filter(is_deleted=False)
    
    def deleted(self):
        return self.filter(is_deleted=True)



class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = BaseModelManager()

    class Meta:
        abstract = True

class BaseViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter] 
    permission_classes = [IsAuthenticatedOrReadOnly and HasAPIKey]
    pagination_class = GENPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.queryset.model, 'is_deleted'):
            queryset = queryset.filter(is_deleted=False)
        return queryset