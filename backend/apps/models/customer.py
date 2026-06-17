from django.db.models import ForeignKey, CASCADE, CharField
from apps.models.base_model import BaseModel, uzbek_phone_validator


class Customer(BaseModel):
    branch = ForeignKey("apps.Branch", CASCADE, related_name="customers")
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])

    class Meta:
        verbose_name = "Mijoz"
        verbose_name_plural = "Mijozlar"

    def __str__(self):
        return self.name