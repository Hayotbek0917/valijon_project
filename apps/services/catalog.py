from decimal import Decimal

from django.db import transaction

from apps.models import Category, Product


@transaction.atomic
def register_catalog_item_as_product(catalog_item, branch, selling_price=None):
    """Diler katalogidagi mahsulotni Product ro'yxatiga qo'shadi (qoldiq 0, prixoddan keyin to'ldiriladi)."""
    if catalog_item.product_id:
        return catalog_item.product

    supplier = catalog_item.supplier
    category_name = catalog_item.category or supplier.category or 'Boshqa'
    category, _ = Category.objects.get_or_create(name=category_name)

    cost = catalog_item.default_cost or Decimal('0')
    if selling_price is not None:
        selling = Decimal(str(selling_price))
    elif cost:
        selling = (cost * Decimal('1.3')).quantize(Decimal('1'))
    else:
        selling = Decimal('0')

    product = Product.objects.create(
        name=catalog_item.name,
        category=category,
        branch=branch,
        base_price=cost,
        selling_price=selling,
        stock=0,
        is_draft=False,
    )
    catalog_item.product = product
    catalog_item.save(update_fields=['product'])
    return product
