import re

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import authenticate
from apps.models import User
from apps.utils import normalize_phone


class RegisterModelSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "phone",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "email",
        )

    def validate_phone(self, value):
        normalized = normalize_phone(value)
        if not re.match(r"^998\d{9}$", normalized):
            raise ValidationError(
                "Telefon raqam 998XXXXXXXXX formatida bo'lishi kerak."
            )
        if User.objects.filter(phone=normalized).exists():
            raise ValidationError("Bu raqam allaqachon ro'yxatdan o'tgan.")
        return normalized

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise ValidationError({"confirm_password": "Parollar mos emas."})

        try:
            validate_password(attrs["password"])
        except DjangoValidationError as e:
            raise ValidationError({"password": list(e.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        normalized = normalize_phone(attrs.get("phone", ""))
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"), username=normalized, password=password
        )

        if not user:
            raise ValidationError("Telefon raqam yoki parol xato.")
        if not user.is_active:
            raise ValidationError("Foydalanuvchi faol emas.")

        attrs["user"] = user
        return attrs
