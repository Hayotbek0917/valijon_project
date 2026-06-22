from django.db.models import (
    TextChoices,
    ForeignKey,
    CASCADE,
    CharField,
    PositiveIntegerField,
    DecimalField,
    SET_NULL,
    DateField,
    JSONField,
)
from django.utils import timezone

from apps.models import TimeStampedModel
from apps.models.base_model import CreatedModel, BaseModel, uzbek_phone_validator
from apps.validators import normalize_uz_phone


class Supplier(CreatedModel):
    """Ta'minotchi"""

    class Status(TextChoices):
        ACTIVE = "active", "Faol"
        INACTIVE = "inactive", "Nofaol"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="suppliers")
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])
    address = CharField(max_length=500, blank=True)
    status = CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, verbose_name="Holat")
    total_orders = PositiveIntegerField(default=0, verbose_name="Jami buyurtmalar")

    def __str__(self):
        return self.name


class SupplierCatalogItem(BaseModel):
    """Katalog Elementi"""

    supplier = ForeignKey("apps.Supplier", CASCADE, related_name="catalog", verbose_name="Ta'minotchi")
    name = CharField(max_length=255)
    default_cost = DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Standart narx")
    item_type = CharField(max_length=50, blank=True, default="", verbose_name="Turi")
    size = CharField(max_length=50, blank=True, default="", verbose_name="O'lchami")
    unit = CharField(max_length=20, blank=True, default="ta", verbose_name="O'lchov birligi")
    barcode = CharField(max_length=50, blank=True, default="", verbose_name="Shtrix-kod")
    product = ForeignKey(
        "apps.Product", SET_NULL, null=True, blank=True, related_name="supplier_catalog_items", verbose_name="Mahsulot"
    )

    def __str__(self):
        return f"{self.supplier.name}: {self.name}"


class Agent(BaseModel):
    branch = ForeignKey("apps.Branch", CASCADE, related_name="agents", verbose_name="Filial")
    name = CharField(max_length=255, verbose_name="Ism")
    phone = CharField(max_length=20, blank=True, default="", validators=[uzbek_phone_validator], verbose_name="Telefon")
    supplier = ForeignKey(
        "apps.Supplier", SET_NULL, null=True, blank=True, related_name="agents", verbose_name="Ta'minotchi"
    )

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)
        if hasattr(self, "agent_phone") and self.agent_phone:
            self.agent_phone = normalize_uz_phone(self.agent_phone)
        super().save(*args, **kwargs)


class AgentOrder(BaseModel):
    """Agent orqali kelgan buyurtma - dilerga bog'langan."""

    branch = ForeignKey("apps.Branch", on_delete=CASCADE, related_name="agent_orders", verbose_name="Filial")
    supplier = ForeignKey("apps.Supplier", on_delete=CASCADE, null=True,  blank=True, related_name="agent_orders", verbose_name="Diler")
    agent_name = CharField(max_length=50, blank=True, verbose_name="Agent ismi")
    customer_name = CharField(max_length=50, verbose_name="Mijoz ismi")
    items = JSONField(verbose_name="Mahsulotlar", default=list)
    total = DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami summa")
    date = DateField(default=timezone.now, verbose_name="Sana")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.agent_name} - {self.customer_name}"
