from django.db.models import (
    Model, CharField, ForeignKey, DecimalField, DateTimeField, CASCADE, SET_NULL, Q, UniqueConstraint,
)

from apps.models.users import Branch
from apps.models.sale import Sale


class CreditAccount(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='credit_accounts')
    customer_name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True)
    balance = DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ['customer_name']
        constraints = [
            UniqueConstraint(
                fields=['branch', 'phone'],
                condition=Q(phone__gt=''),
                name='unique_branch_phone_when_set',
            ),
        ]

    def __str__(self):
        return f'{self.customer_name} ({self.balance})'


class CreditTransaction(Model):
    KIND_CHARGE = 'charge'
    KIND_PAYMENT = 'payment'
    KIND_CHOICES = [
        (KIND_CHARGE, 'Qarz'),
        (KIND_PAYMENT, "To'lov"),
    ]

    account = ForeignKey(CreditAccount, on_delete=CASCADE, related_name='transactions')
    kind = CharField(max_length=20, choices=KIND_CHOICES)
    amount = DecimalField(max_digits=14, decimal_places=2)
    note = CharField(max_length=500, blank=True)
    sale = ForeignKey(Sale, on_delete=SET_NULL, null=True, blank=True, related_name='credit_transactions')
    cashier_name = CharField(max_length=255, blank=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.account.customer_name} {self.kind} {self.amount}'
