from django.db.models import CharField

from .base_models import CreatedMixin


class Agent(CreatedMixin):
    name = CharField(max_length=255, verbose_name="Agent ismi")
    company = CharField(max_length=255, verbose_name="Kompaniya / Agentlik")
    phone = CharField(max_length=20, verbose_name="Telefon raqami")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.company})"
