from collections import defaultdict

from apps.models import PosCartDraft, Product


def draft_reserved_by_product(branch_id, exclude_draft_id=None):
    """Boshqa chernoviklarda band qilingan miqdorlar (product_id -> qty)."""
    qs = PosCartDraft.objects.filter(branch_id=branch_id)
    if exclude_draft_id:
        qs = qs.exclude(pk=exclude_draft_id)
    reserved = defaultdict(int)
    for draft in qs.only('items'):
        for item in draft.items or []:
            pid = item.get('id')
            if pid is not None:
                reserved[int(pid)] += int(item.get('qty') or 0)
    return reserved


def get_available_qty(branch_id, product_id, exclude_draft_id=None):
    product = Product.objects.filter(pk=product_id, branch_id=branch_id).first()
    if not product:
        return 0
    reserved = draft_reserved_by_product(branch_id, exclude_draft_id)
    stock = product.stock or 0
    return max(0, stock - reserved.get(int(product_id), 0))
