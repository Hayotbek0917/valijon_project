from django.db.models import ForeignKey, CASCADE, CharField

from apps.models import BaseModel, uzbek_phone_validator


class Customer(BaseModel):
    branch = ForeignKey('apps.Branch', CASCADE, related_name='customers')
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])

    def __str__(self):
        return self.name