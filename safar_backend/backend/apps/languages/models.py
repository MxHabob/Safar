from django.db import models

from apps.core_apps.general import BaseModel

class Language(BaseModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)  # EN, AR, etc.
    is_active = models.BooleanField(default=True)
    icon = models.ImageField(upload_to='language_icons/', blank=True, null=True)

    class Meta:
        verbose_name = "Language"
        verbose_name_plural = "Languages"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        # Ensure the code is always saved in uppercase
        if self.code:
            self.code = self.code.upper()
        super().save(*args, **kwargs)
