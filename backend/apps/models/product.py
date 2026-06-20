from django.db.models import (
    BigAutoField,
    BooleanField,
    CharField,
    Model,
    TextChoices,
    ForeignKey,
    PROTECT,
    SET_NULL,
    DecimalField,
    ImageField,
    PositiveIntegerField,
    Q,
    DateTimeField,
)
from django.db.models.constraints import UniqueConstraint


class Category(Model):
    id = BigAutoField(primary_key=True)
    name = CharField(max_length=255, unique=True, verbose_name="Kategoriya nomi")

    def __str__(self):
        return self.name


class Product(Model):
    class Status(TextChoices):
        AVAILABLE = "available", "Mavjud"
        OUT_OF_STOCK = "out_of_stock", "Tugagan"
        DRAFT = "draft", "Qoralama"

    id = BigAutoField(primary_key=True)
    name = CharField(max_length=255)
    barcode = CharField(max_length=50, blank=True, default="", verbose_name="Shtrix-kod")
    category = ForeignKey("apps.Category", PROTECT, related_name="products")
    branch = ForeignKey("apps.Branch", SET_NULL, null=True, blank=True, related_name="products")

    selling_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Sotuv narxi")
    base_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Tannarx")
    emoji = CharField(max_length=16, blank=True, default="📦")
    image = ImageField(upload_to="products/", blank=True, null=True)
    stock = PositiveIntegerField(default=0, verbose_name="Qoldiq")
    is_draft = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            UniqueConstraint(
                fields=["barcode"],
                condition=Q(barcode__gt=""),
                name="unique_product_barcode_when_set",
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def profit(self):
        return self.selling_price - self.base_price
