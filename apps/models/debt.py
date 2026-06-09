from django.db.models import CASCADE, ForeignKey
from django.db.models.fields import CharField, DecimalField
from apps.models.base_models import TimeStampedModel


class Debt(TimeStampedModel):
    branch = ForeignKey('apps.Branch', CASCADE, related_name='debts')
    first_name = CharField(max_length=255)
    last_name = CharField(max_length=255, blank=True, null=True)
    phone = CharField(max_length=20, blank=True, null=True)
    address = CharField(max_length=500, blank=True, null=True)
    total_debt = DecimalField(max_digits=15, decimal_places=2, default=0.00)

    class Meta:
        ordering = ["-created_at"]
