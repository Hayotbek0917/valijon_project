from django.db.models import (
    Model, CharField, ForeignKey, DecimalField, PositiveIntegerField,
    DateField, CASCADE, SET_NULL,
)

from apps.models.product import Product
from apps.models.supplier import Supplier
from apps.models.users import Branch


class PurchaseOrder(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='purchase_orders')
    external_id = CharField(max_length=50, unique=True)
    supplier = ForeignKey(Supplier, on_delete=SET_NULL, null=True, related_name='orders')
    supplier_name = CharField(max_length=255, blank=True)
    date = DateField()
    receipt_date = DateField(null=True, blank=True)
    total = DecimalField(max_digits=14, decimal_places=2, default=0)
    status = CharField(max_length=50, default='Kutilmoqda')

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.external_id


class PurchaseOrderLine(Model):
    order = ForeignKey(PurchaseOrder, on_delete=CASCADE, related_name='lines')
    product = ForeignKey(Product, on_delete=SET_NULL, null=True, blank=True)
    name = CharField(max_length=255)
    quantity = PositiveIntegerField()
    item_type = CharField(max_length=50, blank=True)
    size = CharField(max_length=50, blank=True)
    unit = CharField(max_length=20, blank=True)
    cost_price = DecimalField(max_digits=12, decimal_places=2)
    catalog_item = ForeignKey(
        'apps.SupplierCatalogItem', on_delete=SET_NULL, null=True, blank=True, related_name='order_lines',
    )
