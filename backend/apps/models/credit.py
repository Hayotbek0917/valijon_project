from django.db.models import (
    ForeignKey, CASCADE, CharField, DecimalField, TextChoices, SET_NULL, Q
)
from django.db.models.constraints import UniqueConstraint
from apps.models.base_model import BaseModel, CreatedModel, uzbek_phone_validator


class DebtCustomers(BaseModel):
    branch = ForeignKey("apps.Branch", CASCADE, related_name="credit_accounts")
    customer_name = CharField(max_length=255, verbose_name="Mijoz ismi")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])
    balance = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Balans")

    class Meta:
        ordering = ["customer_name"]
        verbose_name = "Nasiya Mijoz"
        verbose_name_plural = "Nasiya Mijozlar"
        constraints = [
            UniqueConstraint(
                fields=["branch", "phone"],
                condition=Q(phone__gt=""),
                name="unique_credit_branch_phone_when_set",
            ),
        ]

    def __str__(self):
        return f"{self.customer_name} ({self.balance:,} so'm)"

    @property
    def is_in_debt(self):
        return self.balance > 0


class CreditTransaction(CreatedModel):
    class Kind(TextChoices):
        CHARGE = "charge", "Qarz"
        PAYMENT = "payment", "To'lov"

    account = ForeignKey(
        "apps.DebtCustomers", CASCADE, related_name="transactions", verbose_name="Hisob"
    )
    kind = CharField(max_length=20, choices=Kind.choices, verbose_name="Turi")
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa")
    note = CharField(max_length=500, blank=True, default="", verbose_name="Izoh")
    sale = ForeignKey(
        "apps.Sale",
        SET_NULL,
        null=True,
        blank=True,
        related_name="credit_transactions",
        verbose_name="Sotuv",
    )
    cashier_name = CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Qarz Amaliyoti"
        verbose_name_plural = "Qarz Amaliyotlari"

    def __str__(self):
        return f"{self.account.customer_name} | {self.get_kind_display()} | {self.amount:,}"