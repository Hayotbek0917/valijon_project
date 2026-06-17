from django.db.models import (
    TextChoices, ForeignKey, CASCADE, CharField, PositiveIntegerField,
    DecimalField, SET_NULL, DateField
)
from apps.models.base_model import CreatedModel, BaseModel


class Supplier(CreatedModel):
    class Status(TextChoices):
        ACTIVE = "active", "Faol"
        INACTIVE = "inactive", "Nofaol"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="suppliers")
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True)
    address = CharField(max_length=500, blank=True)
    status = CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, verbose_name="Holat")
    total_orders = PositiveIntegerField(default=0, verbose_name="Jami buyurtmalar")

    class Meta:
        verbose_name = "Ta'minotchi"
        verbose_name_plural = "Ta'minotchilar"

    def __str__(self):
        return self.name


class SupplierCatalogItem(BaseModel):
    supplier = ForeignKey("apps.Supplier", CASCADE, related_name="catalog", verbose_name="Ta'minotchi")
    name = CharField(max_length=255)
    default_cost = DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Standart narx")
    item_type = CharField(max_length=50, blank=True, default="", verbose_name="Turi")
    size = CharField(max_length=50, blank=True, default="", verbose_name="O'lchami")
    unit = CharField(max_length=20, blank=True, default="ta", verbose_name="O'lchov birligi")
    barcode = CharField(max_length=50, blank=True, default="", verbose_name="Shtrix-kod")
    product = ForeignKey("apps.Product", SET_NULL, null=True, blank=True, related_name="supplier_catalog_items", verbose_name="Mahsulot")

    class Meta:
        verbose_name = "Katalog Elementi"
        verbose_name_plural = "Katalog Elementlari"

    def __str__(self):
        return f"{self.supplier.name}: {self.name}"


class Agent(BaseModel):
    branch = ForeignKey("apps.Branch", CASCADE, related_name="agents", verbose_name="Filial")
    name = CharField(max_length=255, verbose_name="Ism")
    phone = CharField(max_length=20, blank=True, default="", verbose_name="Telefon")
    supplier = ForeignKey("apps.Supplier", SET_NULL, null=True, blank=True, related_name="agents", verbose_name="Ta'minotchi")

    class Meta:
        verbose_name = "Agent"
        verbose_name_plural = "Agentlar"

    def __str__(self):
        return self.name


class AgentOrder(BaseModel):
    class Status(TextChoices):
        PENDING = "pending", "Kutilmoqda"
        IN_DELIVERY = "in_delivery", "Yetkazilmoqda"
        DELIVERED = "delivered", "Yetkazildi"
        CANCELLED = "cancelled", "Bekor qilindi"

    branch = ForeignKey("apps.Branch", CASCADE, related_name="agent_orders")
    agent = ForeignKey("apps.Agent", CASCADE, related_name="orders")
    agent_name = CharField(max_length=255, blank=True, default="", verbose_name="Agent ismi")
    customer_name = CharField(max_length=255, verbose_name="Mijoz ismi")
    items = CharField(max_length=500, verbose_name="Mahsulotlar")
    total = DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami")
    date = DateField(verbose_name="Sana")
    status = CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Holat")

    class Meta:
        ordering = ["-date"]
        verbose_name = "Agent Buyurtmasi"
        verbose_name_plural = "Agent Buyurtmalari"

    def __str__(self):
        return f"{self.agent_name} → {self.customer_name}"