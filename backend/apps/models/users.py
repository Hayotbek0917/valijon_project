from django.contrib.auth.models import AbstractUser
from django.db.models import ForeignKey, CASCADE, CharField, TextChoices
from apps.models.base_model import BaseModel, TimeStampedModel, uzbek_phone_validator


class Branch(TimeStampedModel):
    market = ForeignKey("apps.Market", CASCADE, related_name="branches", verbose_name="Market")
    name = CharField(max_length=255, verbose_name="Filial nomi")
    address = CharField(max_length=500, blank=True, default="", verbose_name="Manzil")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator], verbose_name="Telefon")

    class Meta:
        ordering = ["name"]
        verbose_name = "Filial"
        verbose_name_plural = "Filiallar"

    def __str__(self):
        return f"{self.market.name} - {self.name}"


class User(AbstractUser, BaseModel):
    class Role(TextChoices):
        OWNER = "owner", "Manger/Ega"
        MANAGER = "manager", "Menejer"
        CASHIER = "cashier", "Kassir"

    branch = ForeignKey(
        Branch,
        CASCADE,
        related_name="users",
        null=True,
        blank=True,
        verbose_name="Filial"
    )
    role = CharField(max_length=20, choices=Role.choices, default=Role.CASHIER, verbose_name="Rol")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator], verbose_name="Telefon")

    class Meta:
        ordering = ["username"]
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"