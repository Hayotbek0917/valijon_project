from django.db.models import TextChoices, ForeignKey, CASCADE, CharField, DateField, DecimalField, SET_NULL, JSONField, \
    PositiveIntegerField, BooleanField
from django.utils.timezone import localdate

from apps.models.base_model import BigIntTimestampedModel, BigIntModel


class Sale(BigIntModel):
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
    date = DateField(default=localdate, verbose_name="Sana")
    time = CharField(max_length=10, blank=True, default="", verbose_name="Vaqt")
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa")
    method = CharField(
        max_length=20,
        choices=PayMethod.choices,
        default=PayMethod.CASH,
        verbose_name="To'lov turi"
    )
    cashier = ForeignKey("apps.User", SET_NULL, null=True, blank=True, related_name="sales")
    cashier_name = CharField(max_length=255, blank=True, default="")
    items = JSONField(default=list, verbose_name="Mahsulotlar")
    payment_breakdown = JSONField(default=dict, blank=True, verbose_name="Aralash to'lov")

    class Meta:
        verbose_name = "Sotuv"
        verbose_name_plural = "Sotuvlar"
        ordering = ["-date", "-external_id"]

    def __str__(self):
        return self.external_id if self.external_id else str(self.id)


class SaleLine(BigIntModel):
    """Sotuv Satri"""

    sale = ForeignKey("apps.Sale", CASCADE, related_name="lines", verbose_name="Sotuv")
    product_name = CharField(max_length=255)
    quantity = PositiveIntegerField(verbose_name="Miqdor")
    unit_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Narx")

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class PosCartDraft(BigIntTimestampedModel):
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
    is_draft = BooleanField(default=True, verbose_name="Qoralama")

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.label} ({self.branch_id})"
