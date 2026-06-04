from django.db.models import CharField, DateTimeField

from apps.models import BaseModel


class Agent(BaseModel):
    name = CharField(max_length=255, verbose_name="Agent ismi")
    company = CharField(max_length=255, verbose_name="Kompaniya / Agentlik")
    phone = CharField(max_length=20, verbose_name="Telefon raqami")
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.company})"
