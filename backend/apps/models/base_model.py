import uuid
from django.core.validators import RegexValidator
from django.db import Model, UUIDField, DateTimeField
from django.db.models import TextChoices

uzbek_phone_validator = RegexValidator(
    regex=r"^\d{9}$",
    message="Telefon raqam 901234567 formatida bo'lishi kerak.",
)

class PurchaseOrderStatus(TextChoices):
    DRAFT = "draft", "Qoralama"
    PENDING = "pending", "Kutilmoqda"
    IN_DELIVERY = "in_delivery", "Yetkazilmoqda"
    DELIVERED = "delivered", "Yetkazildi"
    CANCELLED = "cancelled", "Bekor qilindi"

class BaseModel(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class CreatedModel(BaseModel):
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

class TimeStampedModel(CreatedModel):
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        abstract = True