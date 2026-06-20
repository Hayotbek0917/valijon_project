from django.db.models import (
    TextChoices, ForeignKey, CASCADE, CharField, PositiveIntegerField,
    DecimalField, SET_NULL, DateField, BigAutoField, DateTimeField, Model,
)
from apps.models.base_model import BigIntModel, uzbek_phone_validator


class Supplier(CreatedModel):
    """Ta'minotchi"""

    class Status(TextChoices):
        ACTIVE = "active", "Faol"
        INACTIVE = "inactive", "Nofaol"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="suppliers")
    name = CharField(max_length=255)
    contact = CharField(max_length=255, blank=True, default="")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])
    email = CharField(max_length=254, blank=True, default="")
    address = CharField(max_length=500, blank=True)
    category = CharField(max_length=100, blank=True, default="")
    agent_name = CharField(max_length=255, blank=True, default="", verbose_name="Agent ismi")
    agent_phone = CharField(max_length=20, blank=True, default="", validators=[uzbek_phone_validator], verbose_name="Agent telefoni")
    status = CharField(max_length=50, choices=Status.choices, default=Status.ACTIVE, verbose_name="Holat")
    total_orders = PositiveIntegerField(default=0, verbose_name="Jami buyurtmalar")

    def __str__(self):
        return self.name


class SupplierCatalogItem(BigIntModel):
    """Katalog Elementi"""

    supplier = ForeignKey("apps.Supplier", CASCADE, related_name="catalog", verbose_name="Ta'minotchi")
    name = CharField(max_length=255)
    category = CharField(max_length=100, blank=True, default="")
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


class AgentOrder(BigIntModel):
    """Agent Buyurtmasi"""
    branch = ForeignKey("apps.Branch", CASCADE, related_name="agent_orders")
    agent = ForeignKey(
        "apps.Agent",
        CASCADE,
        null=True,
        blank=True,
        related_name="orders",
    )
    agent_name = CharField(max_length=255, blank=True, default="", verbose_name="Agent ismi")
    customer_name = CharField(max_length=255, verbose_name="Mijoz ismi")
    items = CharField(max_length=500, verbose_name="Mahsulotlar")
    total = DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami")
    date = DateField(verbose_name="Sana")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.agent_name} - {self.customer_name}"