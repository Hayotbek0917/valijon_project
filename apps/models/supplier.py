from django.db.models import (
    Model, CharField, ForeignKey, PositiveIntegerField, DecimalField, CASCADE, SET_NULL,
)

from apps.models.users import Branch


class Supplier(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='suppliers')
    name = CharField(max_length=255)
    contact = CharField(max_length=255, blank=True)
    phone = CharField(max_length=20, blank=True)
    email = CharField(max_length=254, blank=True)
    address = CharField(max_length=500, blank=True)
    category = CharField(max_length=100, blank=True)
    total_orders = PositiveIntegerField(default=0)
    status = CharField(max_length=50, default='Faol')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SupplierCatalogItem(Model):
    """Diler qo'shganda kiritiladigan mahsulotlar ro'yxati (prixoddan keyin Product ga ulanadi)."""
    supplier = ForeignKey(Supplier, on_delete=CASCADE, related_name='catalog')
    name = CharField(max_length=255)
    category = CharField(max_length=100, blank=True)
    default_cost = DecimalField(max_digits=12, decimal_places=2, default=0)
    item_type = CharField(max_length=50, blank=True)
    size = CharField(max_length=50, blank=True)
    unit = CharField(max_length=20, blank=True, default='ta')
    product = ForeignKey(
        'apps.Product', on_delete=SET_NULL, null=True, blank=True, related_name='supplier_catalog_items',
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.supplier.name}: {self.name}'
