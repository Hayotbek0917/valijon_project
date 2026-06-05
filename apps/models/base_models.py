import uuid
from django.db import models
from django.db.models import Model
from django.db.models.fields import UUIDField, DateTimeField


class BaseModel(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class Meta:
        abstract = True

class CreatedMixin(BaseModel):
    created_at = DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True

class UpdatedMixin(BaseModel):
    updated_at = DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class TimeStampedModel(CreatedMixin, UpdatedMixin):
    class Meta:
        abstract = True