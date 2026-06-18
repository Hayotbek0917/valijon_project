import re

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import authenticate
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer, Serializer

from apps.models import User
from apps.serializers.fields import UzPhoneField


class RegisterModelSerializer(ModelSerializer):
    """Ro'yxatdan o'tish — telefon +998 formatda saqlanadi."""


class RegisterModelSerializer(ModelSerializer):
    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)
    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)
    phone = UzPhoneField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'phone', 'first_name', 'last_name',
            'role', 'branch', 'password', 'confirm_password',
        )
        extra_kwargs = {
            'id': {'read_only': True},
            'password': {'write_only': True},
        }

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise ValidationError('Bu login band')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        if not value:
            return None
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        if password != confirm_password:
            raise ValidationError({'confirm_password': 'Parollar mos emas'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(Serializer):
    phone = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        raw_phone = attrs.get("phone", "")
        normalized = normalize_phone(raw_phone)
        print(f"DEBUG: Input: {raw_phone}, Normalized: {normalized}")

        password = attrs.get("password")

        user = authenticate(
            request=self.context.get('request'),
            username=login_id,
            password=password,
        )
        if not user and attrs.get('phone'):
            user = authenticate(
                request=self.context.get('request'),
                username=attrs['phone'],
                password=password,
            )

        if not user:
            raise ValidationError('Login yoki parol xato')

        if not user.is_active:
            raise ValidationError('Foydalanuvchi aktiv emas')
        attrs['user'] = user
        return attrs
