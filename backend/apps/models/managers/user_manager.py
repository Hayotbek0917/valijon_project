from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError

from apps.validators.phone import normalize_uz_phone


class UserManager(BaseUserManager):
    """User CRUD — telefon +998 formatda saqlanadi."""

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Login (username) kiritilishi shart')
        phone = extra_fields.get('phone')
        if not phone:
            raise ValueError('Telefon raqami kiritilishi shart')
        extra_fields['phone'] = normalize_uz_phone(phone)
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        if extra_fields.get('is_staff') is not True:
            raise ValidationError('Superuser uchun is_staff=True bo\'lishi kerak')
        if extra_fields.get('is_superuser') is not True:
            raise ValidationError('Superuser uchun is_superuser=True bo\'lishi kerak')
        return self.create_user(username, password, **extra_fields)
