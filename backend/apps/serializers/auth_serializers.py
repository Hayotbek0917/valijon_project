from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer, Serializer

from apps.models import User
from apps.serializers.fields import UzPhoneField
from apps.validators.phone import normalize_uz_phone


class RegisterModelSerializer(ModelSerializer):
    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)
    phone = UzPhoneField()

    class Meta:
        model = User
        fields = (
            "id",
            "phone",
            "first_name",
            "last_name",
            "role",
            "branch",
            "password",
            "confirm_password",
        )
        extra_kwargs = {
            "id": {"read_only": True},
        }

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise ValidationError("Bu telefon raqami allaqachon ro'yxatdan o'tgan.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")
        if password != confirm_password:
            raise ValidationError({"confirm_password": "Parollar mos emas"})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(Serializer):
    phone = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        raw_phone = attrs.get("phone", "")
        try:
            normalized = normalize_uz_phone(raw_phone)
        except Exception:
            normalized = raw_phone

        password = attrs.get("password")

        # Telefon raqami (username o'rnida) orqali tekshiramiz
        user = authenticate(
            request=self.context.get("request"),
            username=normalized,
            password=password,
        )

        if not user and raw_phone:
            user = authenticate(
                request=self.context.get("request"),
                username=raw_phone,
                password=password,
            )

        if not user:
            raise ValidationError("Login yoki parol xato")

        if not user.is_active:
            raise ValidationError("Foydalanuvchi aktiv emas")

        attrs["user"] = user
        return attrs
