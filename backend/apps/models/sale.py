from django.db.models import (
    TextChoices,
    ForeignKey,
    CASCADE,
    CharField,
    DateField,
    DecimalField,
    SET_NULL,
    JSONField,
    PositiveIntegerField,
    Q,
)
from django.db.models.constraints import UniqueConstraint
from django.db.models.fields import TimeField

from apps.models import CreatedModel, TimeStampedModel


class Sale(CreatedModel):
    """Sotuv"""

    class PayMethod(TextChoices):
        CASH = "cash", "Naqd"
        CARD = "card", "Karta"
        TRANSFER = "transfer", "O'tkazma"
        CREDIT = "credit", "Nasiya"
        MIXED = "mixed", "Aralash"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="sales")
    external_id = CharField(
        max_length=50, null=True, blank=True, verbose_name="Tashqi ID"
    )
    date = DateField(auto_now_add=True, verbose_name="Sana")
    time = TimeField(auto_now_add=True)
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa")
    method = CharField(
        max_length=20,
        choices=PayMethod.choices,
        default=PayMethod.CASH,
        verbose_name="To'lov turi",
    )
    cashier = ForeignKey(
        "apps.User", SET_NULL, null=True, blank=True, related_name="sales"
    )
    cashier_name = CharField(max_length=255, blank=True, default="")
    items = JSONField(default=list, verbose_name="Mahsulotlar")

    class Meta:
        ordering = ["-date", "-created_at"]
        constraints = [
            UniqueConstraint(
                fields=["external_id"],
                condition=Q(external_id__gt=""),
                name="unique_sale_external_id_when_set",
            ),
        ]

    def __str__(self):
        return self.external_id if self.external_id else str(self.id)


class SaleLine(TimeStampedModel):
    """Sotuv Satri"""

    sale = ForeignKey("apps.Sale", CASCADE, related_name="lines", verbose_name="Sotuv")
    product_name = CharField(max_length=255)
    quantity = PositiveIntegerField(verbose_name="Miqdor")
    unit_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Narx")

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class PosCartDraft(TimeStampedModel):
    """Savat Qoralamasi"""
    branch = ForeignKey("apps.Branch", CASCADE, related_name="pos_cart_drafts")
    cashier = ForeignKey("apps.User", CASCADE, related_name="pos_cart_drafts")
    label = CharField(max_length=120, verbose_name="Nom")
    pay_method = CharField(
        max_length=20,
        choices=Sale.PayMethod.choices,
        default=Sale.PayMethod.CASH,
        verbose_name="To'lov turi",
    )
    items = JSONField(default=list, verbose_name="Mahsulotlar")
    total = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Jami")

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.label} ({self.branch_id})"
