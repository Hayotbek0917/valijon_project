from rest_framework import serializers

from apps.validators.phone import normalize_uz_phone, validate_uz_phone


class UzPhoneField(serializers.CharField):
    """O'zbekiston telefoni — DB da 9 raqam, API javobida +998 prefiksi."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if not value:
            if self.required:
                raise serializers.ValidationError('Telefon raqami kiritilishi shart')
            return ''
        try:
            return normalize_uz_phone(value)
        except Exception as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def to_representation(self, value):
        if not value:
            return ''
        from apps.validators.phone import format_uz_phone_display
        return format_uz_phone_display(value)
