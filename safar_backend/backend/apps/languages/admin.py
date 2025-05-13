from django.contrib import admin

from apps.languages.models import Language

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'icon')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')