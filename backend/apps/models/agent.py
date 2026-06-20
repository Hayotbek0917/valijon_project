from django.db.models import CASCADE, SET_NULL, CharField, ForeignKey

from apps.models.base_model import BaseModel, uzbek_phone_validator


class Agent(BaseModel):
    """Diler agenti — filialga bog'langan."""

    branch = ForeignKey("apps.Branch", CASCADE, related_name="agents")
    supplier = ForeignKey(
        "apps.Supplier",
        SET_NULL,
        null=True,
        blank=True,
        related_name="agents",
    )
    name = CharField(max_length=255, verbose_name="Agent ismi")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
