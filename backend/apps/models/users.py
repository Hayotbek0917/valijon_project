from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db.models import UUIDField, TextChoices, CharField, DateTimeField, ImageField, ForeignKey, SET_NULL, \
    BooleanField
import uuid

from apps.models import CreatedModel

uzbek_phone_validator = RegexValidator(
    regex=r'^\+998\d{9}$',
    message="Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak.",
)




class Branch(CreatedModel):
    name = CharField(max_length=255, verbose_name='Filial nomi')
    address = CharField(max_length=500, blank=True, default='', verbose_name='Manzil')
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])
    created_at = DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Filial'
        verbose_name_plural = 'Filiallar'
        ordering = ['name']

    def __str__(self):
        return self.name



class UserManager(BaseUserManager):
    def create_user(self, phone, first_name, last_name, password=None, **extra_fields):
        if not phone:
            raise ValueError("Telefon raqam majburiy.")
        user = self.model(phone=phone, first_name=first_name, last_name=last_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if not extra_fields.get('is_staff'):
            raise ValueError("Superuser is_staff=True bo'lishi shart.")
        if not extra_fields.get('is_superuser'):
            raise ValueError("Superuser is_superuser=True bo'lishi shart.")

        return self.create_user(phone, first_name, last_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(TextChoices):
        ADMIN = 'admin', 'Admin'
        BOSS = 'boss', 'Boss'
        OWNER = 'owner', 'Egasi'
        MANAGER = 'manager', 'Menejer'
        CASHIER = 'cashier', 'Kassir'

    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    phone = CharField(max_length=20, unique=True, validators=[uzbek_phone_validator])
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    role = CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)
    avatar = ImageField(upload_to='avatars/', blank=True, null=True)
    branch = ForeignKey('apps.Branch', on_delete=SET_NULL, null=True, blank=True,  related_name='employees')

    is_active = BooleanField(default=True, verbose_name='Faol')
    is_staff = BooleanField(default=False, verbose_name='Xodim')

    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name} ({self.get_role_display()})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def clean(self):
        super().clean()
        if self.role in [self.Role.ADMIN, self.Role.BOSS, self.Role.OWNER] and self.branch:
            raise ValidationError({'branch': 'Admin, Boss yoki Owner filialga biriktirilmaydi!'})

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)