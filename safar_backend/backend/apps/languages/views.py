from django.views.generic import ListView, DetailView
from .models import Language

class LanguageListView(ListView):
    model = Language
    template_name = 'languages/language_list.html'
    context_object_name = 'languages'
    queryset = Language.objects.filter(is_active=True)

class LanguageDetailView(DetailView):
    model = Language
    template_name = 'languages/language_detail.html'
    context_object_name = 'language'
    slug_field = 'code'
    slug_url_kwarg = 'code'
