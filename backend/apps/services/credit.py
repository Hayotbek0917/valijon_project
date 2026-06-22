from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from apps.models import DebtCustomers, CreditTransaction
from apps.validators.phone import normalize_uz_phone


def _normalize_phone(phone):
    try:
        return normalize_uz_phone(phone)
    except Exception:
        return ''


def _find_by_phone(branch, phone):
    norm = _normalize_phone(phone)
    if not norm:
        return None
    for account in DebtCustomers.objects.filter(branch=branch):
        if _normalize_phone(account.phone) == norm:
            return account
    return None


def resolve_credit_account(branch, *, account_id=None, customer_name='', phone='', force_new=False):
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
    if phone_text:
        try:
            phone_text = normalize_uz_phone(phone_text)
            account = DebtCustomers.objects.filter(branch=branch, phone=phone_text).first()
            if account:
                return account
        except Exception:
            pass

    return DebtCustomers.objects.create(
        branch=branch,
        customer_name=name,
        phone=phone_text,
        balance=Decimal('0'),
    )


@transaction.atomic
def record_credit_charge(branch, amount, sale=None, cashier_name='', note='', *, account_id=None, customer_name='',
                         phone='', force_new=False):
    amt = Decimal(str(amount))
    if amt <= 0:
        raise ValidationError({'amount': "Summa 0 dan katta bo'lishi kerak"})

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
        raise ValidationError({'amount': "To'lov summasi 0 dan katta bo'lishi kerak"})
    if amt > account.balance:
        raise ValidationError({'amount': f"Qarz {account.balance} — undan ko'p to'lab bo'lmaydi"})

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