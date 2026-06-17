from django.db import models
from django.db.models import (
    TextChoices, ForeignKey, CASCADE, CharField, DateField,
    DecimalField, SET_NULL, JSONField, PositiveIntegerField
)
from apps.models.base_model import CreatedModel, TimeStampedModel, BaseModel


class Sale(CreatedModel):
    class PayMethod(TextChoices):
        CASH = "cash", "Naqd"
        CARD = "card", "Karta"
        TRANSFER = "transfer", "O'tkazma"
        MIXED = "mixed", "Aralash"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="sales", verbose_name="Filial")
    external_id = CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="Tashqi ID")
    date = DateField(auto_now_add=True, verbose_name="Sana")
    time = models.TimeField(auto_now_add=True)
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa")
    method = CharField(max_length=20, choices=PayMethod.choices, default=PayMethod.CASH, verbose_name="To'lov turi")
    cashier = ForeignKey("apps.User", SET_NULL, null=True, blank=True, related_name="sales")
    cashier_name = CharField(max_length=255, blank=True, default="", verbose_name="Kassir ismi")
    items = JSONField(default=list, verbose_name="Mahsulotlar")

    class Meta:
        ordering = ["-date", "-external_id"]
        verbose_name = "Sotuv"
        verbose_name_plural = "Sotuvlar"

    def __str__(self):
        return self.external_id if self.external_id else str(self.id)


class SaleLine(TimeStampedModel):
    sale = ForeignKey("apps.Sale", CASCADE, related_name="lines", verbose_name="Sotuv")
    product_name = CharField(max_length=255)
    quantity = PositiveIntegerField(verbose_name="Miqdor")
    unit_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Narx")

    class Meta:
        verbose_name = "Sotuv Satri"
        verbose_name_plural = "Sotuv Satrlari"

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class PosCartDraft(TimeStampedModel):
    branch = ForeignKey("apps.Branch", CASCADE, related_name="pos_cart_drafts", verbose_name="Filial")
    cashier = ForeignKey("apps.User", CASCADE, related_name="pos_cart_drafts", verbose_name="Kassir")
    label = CharField(max_length=120, verbose_name="Nom")
    pay_method = CharField(max_length=20, choices=Sale.PayMethod.choices, default=Sale.PayMethod.CASH, verbose_name="To'lov turi")
    items = JSONField(default=list, verbose_name="Mahsulotlar")
    total = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Jami")

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Savat Qoralamasi"
        verbose_name_plural = "Savat Qoralamalari"

    def __str__(self):
        return f"{self.label} ({self.branch_id})"