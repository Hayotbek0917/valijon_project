from django.db.models import (
    Model, CharField, ForeignKey, DecimalField, PositiveIntegerField,
    DateField, DateTimeField, CASCADE, SET_NULL, JSONField,
)

from apps.models.users import Branch, User


class Sale(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='sales')
    external_id = CharField(max_length=50, unique=True)
    date = DateField()
    time = CharField(max_length=10, blank=True)
    amount = DecimalField(max_digits=14, decimal_places=2)
    method = CharField(max_length=50, default='Naqd')
    cashier = ForeignKey(User, on_delete=SET_NULL, null=True, blank=True, related_name='sales')
    cashier_name = CharField(max_length=255, blank=True)
    items = JSONField(default=list)

    class Meta:
        ordering = ['-date', '-external_id']

    def __str__(self):
        return self.external_id


class SaleLine(Model):
    sale = ForeignKey(Sale, on_delete=CASCADE, related_name='lines')
    product_name = CharField(max_length=255)
    quantity = PositiveIntegerField()
    unit_price = DecimalField(max_digits=12, decimal_places=2)


class PosCartDraft(Model):
    """Kassada navbat: mijoz ketganda savat chernovikda saqlanadi."""
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='pos_cart_drafts')
    cashier = ForeignKey(User, on_delete=CASCADE, related_name='pos_cart_drafts')
    label = CharField(max_length=120)
    pay_method = CharField(max_length=50, default='Naqd')
    items = JSONField(default=list)
    total = DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.label} ({self.branch_id})'
