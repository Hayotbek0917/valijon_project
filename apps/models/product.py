from django.db.models import (
    Model, CharField, ForeignKey, DecimalField, PositiveIntegerField,
    DateTimeField, PROTECT, BooleanField, SET_NULL,
)

from apps.models.users import Branch


class Category(Model):
    name = CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Product(Model):
    name = CharField(max_length=255)
    barcode = CharField(max_length=50, unique=True, blank=True)
    category = ForeignKey(Category, on_delete=PROTECT, related_name='products')
    branch = ForeignKey(
        Branch, on_delete=SET_NULL, null=True, blank=True, related_name='products',
    )

    selling_price = DecimalField(max_digits=12, decimal_places=2)
    base_price = DecimalField(max_digits=12, decimal_places=2)
    emoji = CharField(max_length=16, blank=True, default='📦')
    is_draft = BooleanField(default=False)

    stock = PositiveIntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    @property
    def profit(self):
        return self.selling_price - self.base_price


    @property
    def status(self):
        if self.stock > 0:
            return "Yetarli"
        return "Tugagan"