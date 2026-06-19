import re

from django.core.exceptions import ValidationError

_UZ_PHONE_9_PATTERN = re.compile(r'^9\d{8}$')


def normalize_uz_phone(value: str) -> str:
    """
    Har qanday kiritilgan telefonni 9 xonali formatga keltiradi (998 prefiksiz).
    +998901234567, 998901234567, 901234567, 0901234567 — barchasi 901234567 bo'ladi.
    """
    raw = (value or '').strip()
    if not raw:
        return ''

    digits = re.sub(r'\D', '', raw)

    if digits.startswith('998') and len(digits) >= 12:
        local = digits[-9:]
    elif len(digits) == 9:
        local = digits
    elif len(digits) == 10 and digits.startswith('0'):
        local = digits[1:]
    elif len(digits) == 10 and digits.startswith('9'):
        local = digits
    else:
        raise ValidationError(
            "Telefon noto'g'ri. Namuna: 901234567 yoki +998901234567"
        )

    if not _UZ_PHONE_9_PATTERN.match(local):
        raise ValidationError(
            "Telefon noto'g'ri. O'zbekiston raqami: 9 ta raqam, 9 bilan boshlanadi"
        )
    return local


def format_uz_phone_display(value: str) -> str:
    """Ko'rinish uchun +998 prefiksi bilan qaytaradi."""
    if not (value or '').strip():
        return ''
    try:
        local = normalize_uz_phone(value)
    except ValidationError:
        return value or ''
    return f'+998{local}'


def validate_uz_phone(value: str, *, required: bool = False) -> str:
    """Serializer va model clean() uchun — bo'sh yoki normalizatsiya qilingan raqam qaytaradi."""
    if not (value or '').strip():
        if required:
            raise ValidationError('Telefon raqami kiritilishi shart')
        return ''
    return normalize_uz_phone(value)
