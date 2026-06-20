from django.db.models import ForeignKey, CASCADE, CharField, PositiveIntegerField
from django.db.models.constraints import UniqueConstraint

from apps.models.base_model import BigIntTimestampedModel, BigIntModel


class Warehouse(BigIntModel):
    """Ombor / sklad — filial ichidagi saqlash joyi."""

    branch = ForeignKey("apps.Branch", CASCADE, related_name="warehouses")
    name = CharField(max_length=255, verbose_name="Ombor nomi")

    def __str__(self):
        return self.name


class InventoryItem(BigIntModel):
    product = ForeignKey("apps.Product", CASCADE, related_name="inventory_items")
    warehouse = ForeignKey("apps.Warehouse", CASCADE, related_name="items", verbose_name="Ombor")
    quantity = PositiveIntegerField(default=0, verbose_name="Miqdor")

    class Meta:
        verbose_name = "Ombor Maxsuloti"
        verbose_name_plural = "Ombor Maxsulotlari"
        constraints = [
            UniqueConstraint(
                fields=["product", "warehouse"],
                name="unique_product_per_warehouse",
            ),
        ]

    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name}: {self.quantity}"
