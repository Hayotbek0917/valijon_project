from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer, Serializer

from apps.models import User
from apps.serializers.fields import UzPhoneField
from apps.validators.phone import normalize_uz_phone, format_uz_phone_display


class RegisterModelSerializer(ModelSerializer):
    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)
    phone = UzPhoneField()

    class Meta:
        model = User
        fields = (
            'id', 'phone', 'first_name', 'last_name',
            'role', 'branch', 'password', 'confirm_password',
        )
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate_username(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise ValidationError('Bu login band')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        if password != confirm_password:
            raise ValidationError({'confirm_password': 'Parollar mos emas'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        phone = validated_data.get('phone')
        if phone and not validated_data.get('username'):
            validated_data['username'] = phone
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(Serializer):
    username = CharField(required=False, allow_blank=True)
    phone = CharField(required=False, allow_blank=True)
    password = CharField(write_only=True)

    def validate(self, attrs):
        raw_login = (attrs.get('username') or attrs.get('phone') or '').strip()
        password = attrs.get('password')

        if not raw_login:
            raise ValidationError('Login kiritilishi shart')

        login_key = raw_login.lower()
        if login_key == 'admin':
            login_key = 'superadmin'

        candidates = [raw_login, raw_login.lower(), login_key]
        try:
            local = normalize_uz_phone(raw_login)
            candidates.extend([local, f'+998{local}', format_uz_phone_display(local)])
        except DjangoValidationError:
            pass

        user = None
        for login_id in dict.fromkeys(c for c in candidates if c):
            user = authenticate(
                request=self.context.get('request'),
                username=login_id,
                password=password,
            )
            if user:
                break

        if not user:
            lookup = User.objects.filter(username__iexact=login_key).first()
            if lookup and lookup.check_password(password):
                user = lookup

        if not user:
            raise ValidationError('Login yoki parol xato')

        if not user.is_active:
            raise ValidationError('Foydalanuvchi aktiv emas')

        attrs['user'] = user
        return attrs