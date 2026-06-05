from django.db.models import ForeignKey, DecimalField, PositiveIntegerField, PROTECT, CASCADE

from apps.models.base_models import BaseModel
from .base_models import CreatedMixin


class Supply(CreatedMixin):
    agent = ForeignKey('apps.Agent', PROTECT, related_name='supplies', verbose_name="Ta'minotchi Agent")
    branch = ForeignKey('apps.Branch', CASCADE, related_name='supplies', verbose_name="Qaysi omborga keldi")
    total_amount = DecimalField(max_digits=15, decimal_places=2, default=0.00, verbose_name="Umumiy summa")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ta'minot #{str(self.id)[:8]} - {self.agent.name}"


class SupplyItem(BaseModel):
    supply = ForeignKey('apps.Supply', CASCADE, related_name='items')
    product = ForeignKey('apps.Product', PROTECT, related_name='supply_items')
    quantity = PositiveIntegerField(verbose_name="Kelgan miqdori")
    buying_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Sotib olish narxi (Tannarxi)")

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
