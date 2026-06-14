
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.models import InventoryItem, Product, Sale, SaleLine
from apps.services.stock import draft_reserved_by_product


@transaction.atomic
def create_sale_with_stock(sale_data, lines_data, exclude_draft_id=None):
    branch = sale_data['branch']
    reserved = draft_reserved_by_product(branch.id, exclude_draft_id)

    for line in lines_data:
        product = Product.objects.filter(
            name=line['product_name'], branch=branch,
        ).first()
        if not product:
            continue
        needed = int(line['quantity'])
        available = max(0, (product.stock or 0) - reserved.get(product.id, 0))
        if needed > available:
            raise ValidationError({
                'detail': (
                    f'"{line["product_name"]}" uchun yetarli qoldiq yo\'q '
                    f'(mavjud: {available}, so\'ralgan: {needed}). '
                    f'Boshqa navbat/chernovikda band qilingan bo\'lishi mumkin.'
                ),
            })

    sale = Sale.objects.create(**sale_data)
    items_json = []

    for line in lines_data:
        SaleLine.objects.create(sale=sale, **line)
        items_json.append({
            'name': line['product_name'],
            'qty': line['quantity'],
            'price': float(line['unit_price']),
        })

        product = Product.objects.filter(
            name=line['product_name'], branch=sale.branch,
        ).first()
        if product:
            qty = line['quantity']
            product.stock = max(0, (product.stock or 0) - qty)
            product.save(update_fields=['stock'])
            for inv in InventoryItem.objects.filter(product=product):
                inv.quantity = max(0, inv.quantity - qty)
                inv.save(update_fields=['quantity'])

    sale.items = items_json
    sale.save(update_fields=['items'])
    return sale
