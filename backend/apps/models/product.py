from django.db.models import (
    CharField,
    TextChoices,
    ForeignKey,
    PROTECT,
    SET_NULL,
    DecimalField,
    ImageField,
    PositiveIntegerField,
    Q,
)
from django.db.models.constraints import UniqueConstraint

from apps.models.base_model import BaseModel, TimeStampedModel


class Category(BaseModel):
    name = CharField(max_length=255, unique=True, verbose_name="Kategoriya nomi")

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    class Status(TextChoices):
        AVAILABLE = "available", "Mavjud"
        OUT_OF_STOCK = "out_of_stock", "Tugagan"
        DRAFT = "draft", "Qoralama"

    name = CharField(max_length=255)
    barcode = CharField(max_length=50, blank=True, default="", verbose_name="Shtrix-kod")
    category = ForeignKey("apps.Category", PROTECT, related_name="products")
    branch = ForeignKey("apps.Branch", SET_NULL, null=True, blank=True, related_name="products")

    selling_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Sotuv narxi")
    base_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Tannarx")
    emoji = CharField(max_length=16, blank=True, default="📦")
    image = ImageField(upload_to="products/", blank=True, null=True)
    status = CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        verbose_name="Holat",
    )
    stock = PositiveIntegerField(default=0, verbose_name="Qoldiq")
    size = CharField(max_length=50, blank=True, default="", verbose_name="O'lchami")
    unit = CharField(max_length=20, blank=True, default="dona", verbose_name="O'lchov birligi")

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
        if self.selling_price and self.base_price:
            return self.selling_price - self.base_price
        return 0
