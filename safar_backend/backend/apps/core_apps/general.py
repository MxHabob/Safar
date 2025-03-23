import uuid
from django.db import models
from rest_framework.pagination import PageNumberPagination

class GlPagination(PageNumberPagination):
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

    objects = BaseModelManager()  # Use the new manager

    class Meta:
        abstract = True

def generate_unique_code():
    while True:
        code = uuid.uuid4().hex[:8].upper()
        if not Discount.objects.filter(code=code).exists():
            return code