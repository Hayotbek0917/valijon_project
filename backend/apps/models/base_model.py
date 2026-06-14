import uuid
from django.db.models import Model, UUIDField, DateTimeField

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