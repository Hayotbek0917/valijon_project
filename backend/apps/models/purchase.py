from django.core.exceptions import ValidationError
from django.db.models import (
    TextChoices,
    ForeignKey,
    CASCADE,
    CharField,
    SET_NULL,
    DateField,
    DecimalField,
    PositiveIntegerField,
    Q,
)
from django.db.models.constraints import UniqueConstraint

from apps.models.base_model import BaseModel, CreatedModel


class PurchaseOrder(CreatedModel):
    """Xarid Buyurtmasi"""

    class Status(TextChoices):
        DRAFT = "draft", "Qoralama"
        PENDING = "pending", "Kutilmoqda"
        IN_DELIVERY = "in_delivery", "Yetkazilmoqda"
        DELIVERED = "delivered", "Yetkazildi"
        CANCELLED = "cancelled", "Bekor qilindi"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="purchase_orders")
    external_id = CharField(max_length=50, null=True, blank=True, verbose_name="Tashqi ID")
    supplier = ForeignKey(
        "apps.Supplier", SET_NULL, null=True, blank=True, related_name="orders", verbose_name="Ta'minotchi"
    )
    supplier_name = CharField(max_length=255, blank=True, default="", verbose_name="Ta'minotchi nomi")
    date = DateField(verbose_name="Sana")
    receipt_date = DateField(null=True, blank=True, verbose_name="Qabul sanasi")
    total = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Jami summa")
    status = CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Holat")

    class Meta:
        ordering = ["-date"]
        constraints = [
            UniqueConstraint(
                fields=["external_id"],
                condition=Q(external_id__gt=""),
                name="unique_purchase_order_external_id_when_set",
            ),
        ]

    def __str__(self):
        return f"{self.external_id} - {self.supplier_name}"

    def clean(self):
        if self.status == self.Status.DELIVERED and not self.receipt_date:
            raise ValidationError({"receipt_date": "Mahsulot qabul qilinganda qabul sanasi kiritilishi shart!"})

    def save(self, *args, **kwargs):
        if self.supplier:
            self.supplier_name = self.supplier.name
        super().save(*args, **kwargs)


class PurchaseOrderLine(BaseModel):
    """Xarid Satri"""

    order = ForeignKey("apps.PurchaseOrder", CASCADE, related_name="lines", verbose_name="Buyurtma")
    product = ForeignKey(
        "apps.Product", SET_NULL, null=True, blank=True, related_name="purchase_lines", verbose_name="Mahsulot"
    )
    catalog_item = ForeignKey(
        "apps.SupplierCatalogItem",
        SET_NULL,
        null=True,
        blank=True,
        related_name="order_lines",
        verbose_name="Katalog elementi",
    )

    name = CharField(max_length=255, verbose_name="Nomi")
    quantity = PositiveIntegerField(verbose_name="Miqdor")
    item_type = CharField(max_length=50, blank=True, default="", verbose_name="Turi")
    size = CharField(max_length=50, blank=True, default="", verbose_name="O'lchami")
    unit = CharField(max_length=20, blank=True, default="ta", verbose_name="O'lchov birligi")
    cost_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Narx")

    def __str__(self):
        return f"{self.name} x{self.quantity}"
