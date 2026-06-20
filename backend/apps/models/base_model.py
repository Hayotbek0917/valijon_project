import uuid
from django.core.validators import RegexValidator
from django.db.models import BigAutoField, Model, UUIDField, DateTimeField

uzbek_phone_validator = RegexValidator(
    regex=r"^\d{9}$",
    message="Telefon raqam 901234567 formatida bo'lishi kerak.",
)


class BaseModel(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class BigIntModel(Model):
    id = BigAutoField(primary_key=True)

    class Meta:
        abstract = True


class CreatedModel(BaseModel):
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class BigIntCreatedModel(BigIntModel):
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class TimeStampedModel(CreatedModel):
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BigIntTimestampedModel(BigIntModel):
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        abstract = True
