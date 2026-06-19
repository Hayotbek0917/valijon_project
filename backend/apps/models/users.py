import uuid

from django.contrib.auth.base_user import BaseUserManager, AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin, User
from django.db.models import ForeignKey, CharField, TextChoices, SET_NULL
from django.db.models.fields import UUIDField, BooleanField, DateTimeField, EmailField

from apps.models import uzbek_phone_validator


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Telefon raqami kiritilishi shart")
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.OWNER)
        return self.create_user(phone, password, **extra_fields)

    class Role(TextChoices):
        OWNER = "owner", "Boss"
        MANAGER = "manager", "Manager"
        CASHIER = "cashier", "Cashier"
        ADMIN = "admin", "Admin"

    id = UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = EmailField(max_length=255, blank=True, null=True, unique=True)
    phone = CharField(max_length=20, unique=True, validators=[uzbek_phone_validator])
    first_name = CharField(max_length=50)
    last_name = CharField(max_length=50, blank=True, null=True)

    branch = ForeignKey(
        "apps.Branch",
        SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    role = CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)

    is_active = BooleanField(default=True)
    is_staff = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    objects = BaseUserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.full_name} ({self.get_role_display()})"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name or ''}".strip()

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    @property
    def is_cashier(self):
        return self.role == self.Role.CASHIER
