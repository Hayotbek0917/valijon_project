from decimal import Decimal

from django.db import transaction

from apps.models import Category, Product


def _resolve_barcode(catalog_item, barcode=None):
    supplier = catalog_item.supplier
    return (
        (barcode or '').strip()
        or (catalog_item.barcode or '').strip()
        or f'CAT-{supplier.id}-{catalog_item.id}'
    )


@transaction.atomic
def register_catalog_item_as_product(catalog_item, branch, selling_price=None, barcode=None):
    """Diler katalogidagi mahsulotni Product ro'yxatiga qo'shadi."""
    if catalog_item.product_id:
        product = catalog_item.product
        update_fields = []
        if barcode and product.barcode != barcode.strip():
            product.barcode = barcode.strip()
            update_fields.append('barcode')
        if selling_price is not None:
            product.selling_price = Decimal(str(selling_price))
            update_fields.append('selling_price')
        if update_fields:
            product.save(update_fields=update_fields)
        if barcode and catalog_item.barcode != barcode.strip():
            catalog_item.barcode = barcode.strip()
            catalog_item.save(update_fields=['barcode'])
        return product

    supplier = catalog_item.supplier
    category_name = (catalog_item.category or supplier.category or 'Boshqa').strip() or 'Boshqa'
    category, _ = Category.objects.get_or_create(name=category_name)

    cost = catalog_item.default_cost or Decimal('0')
    if selling_price is not None:
        selling = Decimal(str(selling_price))
    else:
        selling = cost

    product_barcode = _resolve_barcode(catalog_item, barcode)
    product = Product.objects.create(
        name=catalog_item.name,
        category=category,
        branch=branch,
        base_price=cost,
        selling_price=selling,
        barcode=product_barcode,
        stock=0,
        is_draft=False,
    )
    catalog_item.product = product
    if barcode:
        catalog_item.barcode = barcode.strip()
        catalog_item.save(update_fields=['product', 'barcode'])
    else:
        catalog_item.save(update_fields=['product'])
    return product
