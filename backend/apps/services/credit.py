from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.models import DebtCustomers, CreditTransaction


def _normalize_phone(phone):
    import re
    return re.sub(r'\D', '', phone or '')


def _find_by_phone(branch, phone):
    norm = _normalize_phone(phone)
    if not norm:
        return None
    for account in DebtCustomers.objects.filter(branch=branch):
        if _normalize_phone(account.phone) == norm:
            return account
    return None


def resolve_credit_account(
    branch,
    *,
    account_id=None,
    customer_name='',
    phone='',
    force_new=False,
):
    if account_id:
        try:
            return DebtCustomers.objects.get(pk=account_id, branch=branch)
        except DebtCustomers.DoesNotExist as exc:
            raise ValidationError({'credit_account_id': 'Qarz hisobi topilmadi'}) from exc

    name = (customer_name or '').strip()
    if not name:
        raise ValidationError({'customer_name': 'Mijoz ismi kerak'})

    if force_new:
        return DebtCustomers.objects.create(
            branch=branch,
            customer_name=name,
            phone=(phone or '').strip(),
            balance=Decimal('0'),
        )

    phone_text = (phone or '').strip()
    matches_by_name = DebtCustomers.objects.filter(branch=branch, customer_name__iexact=name)

    if phone_text:
        existing = _find_by_phone(branch, phone_text)
        if existing:
            return existing
        return DebtCustomers.objects.create(
            branch=branch,
            customer_name=name,
            phone=phone_text,
            balance=Decimal('0'),
        )

    count = matches_by_name.count()
    if count == 0:
        return DebtCustomers.objects.create(
            branch=branch,
            customer_name=name,
            phone='',
            balance=Decimal('0'),
        )
    if count == 1:
        return matches_by_name.first()

    raise ValidationError({
        'customer_name': (
            f'"{name}" ismli {count} ta mijoz bor — ro\'yxatdan tanlang yoki "Yangi mijoz" bosing'
        ),
    })


@transaction.atomic
def record_credit_charge(
    branch,
    amount,
    sale=None,
    cashier_name='',
    note='',
    *,
    account_id=None,
    customer_name='',
    phone='',
    force_new=False,
):
    amt = Decimal(str(amount))
    if amt <= 0:
        raise ValidationError({'amount': 'Summa 0 dan katta bo\'lishi kerak'})

    account = resolve_credit_account(
        branch,
        account_id=account_id,
        customer_name=customer_name,
        phone=phone,
        force_new=force_new,
    )
    account.balance += amt
    account.save(update_fields=['balance'])
    CreditTransaction.objects.create(
        account=account,
        kind=CreditTransaction.Kind.CHARGE,
        amount=amt,
        sale=sale,
        cashier_name=cashier_name or '',
        note=note or '',
    )
    return account


@transaction.atomic
def record_credit_payment(account, amount, cashier_name='', note=''):
    amt = Decimal(str(amount))
    if amt <= 0:
        raise ValidationError({'amount': 'To\'lov summasi 0 dan katta bo\'lishi kerak'})
    if amt > account.balance:
        raise ValidationError({'amount': f'Qarz {account.balance} — undan ko\'p to\'lab bo\'lmaydi'})
    account.balance -= amt
    account.save(update_fields=['balance'])
    CreditTransaction.objects.create(
        account=account,
        kind=CreditTransaction.Kind.PAYMENT,
        amount=amt,
        cashier_name=cashier_name or '',
        note=note or '',
    )
    return account
