from django.db.models import Model, CharField, ForeignKey, PositiveIntegerField, CASCADE, UniqueConstraint

from apps.models.product import Product
from apps.models.users import Branch


class Warehouse(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='warehouses')
    name = CharField(max_length=255)

    def __str__(self):
        return self.name


class InventoryItem(Model):
    product = ForeignKey(Product, on_delete=CASCADE, related_name='inventory_items')
    warehouse = ForeignKey(Warehouse, on_delete=CASCADE, related_name='items')
    quantity = PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=['product', 'warehouse'],
                name='unique_product_per_warehouse',
            ),
        ]

    def __str__(self):
        return f'{self.product.name} @ {self.warehouse.name}: {self.quantity}'
