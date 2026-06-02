import uuid
from django.db import models
from django.db.models import Model, UUIDField, CharField, DateTimeField


class Agent(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = CharField(max_length=255, verbose_name="Agent ismi")
    company = CharField(max_length=255, verbose_name="Kompaniya / Agentlik")
    phone = CharField(max_length=20, verbose_name="Telefon raqami")
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Agent"
        verbose_name_plural = "Agentlar"

    def __str__(self):
        return f"{self.name} ({self.company})"