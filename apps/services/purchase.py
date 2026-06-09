from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.models import Product, Category, InventoryItem, PurchaseOrder


@transaction.atomic
def receive_purchase_order(order, warehouse, receipt_date, line_receipts):
    receipt_map = {item['line_id']: item for item in line_receipts}
    branch = order.branch

    for line in order.lines.select_related('product', 'catalog_item').all():
        data = receipt_map.get(line.id)
        if not data:
            continue

        received_qty = int(data.get('received_qty') or 0)
        if received_qty <= 0:
            continue

        product = line.product
        catalog_item = line.catalog_item

        if not product and catalog_item:
            product = catalog_item.product

        if not product:
            category_name = (catalog_item.category if catalog_item else '') or (order.supplier.category if order.supplier else '') or 'Boshqa'
            category, _ = Category.objects.get_or_create(name=category_name)
            cost = line.cost_price or (catalog_item.default_cost if catalog_item else Decimal('0'))
            selling = (cost * Decimal('1.3')).quantize(Decimal('1')) if cost else Decimal('0')
            product = Product.objects.create(
                name=line.name,
                category=category,
                branch=branch,
                base_price=cost,
                selling_price=selling,
                stock=0,
            )
            line.product = product
            line.save(update_fields=['product'])
            if catalog_item:
                catalog_item.product = product
                catalog_item.save(update_fields=['product'])

        inv, _ = InventoryItem.objects.get_or_create(
            product=product, warehouse=warehouse,
            defaults={'quantity': 0},
        )
        inv.quantity += received_qty
        inv.save(update_fields=['quantity'])

        product.stock = (product.stock or 0) + received_qty
        product.save(update_fields=['stock'])

    order.status = 'Yetkazilgan'
    order.receipt_date = receipt_date or timezone.localdate()
    order.save(update_fields=['status', 'receipt_date'])

    if order.supplier_id:
        order.supplier.total_orders = (order.supplier.total_orders or 0) + 1
        order.supplier.save(update_fields=['total_orders'])

    return order
