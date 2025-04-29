from django.contrib import admin

from .models import Language

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'icon_preview')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')

    def icon_preview(self, obj):
        if obj.icon:
            return f'<img src="{obj.icon.url}" width="30" height="20" />'
        return "-"
    icon_preview.allow_tags = True
    icon_preview.short_description = 'Icon'