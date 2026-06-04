from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db.models import SET_NULL, ForeignKey, CharField, EmailField, ImageField, BooleanField, \
    DateTimeField
from django.db.models.enums import TextChoices

from apps.models import BaseModel
from apps.models import TimeStampedModel


class Branch(BaseModel):
    name = CharField(max_length=255)
    address = CharField(max_length=500, blank=True, null=True)
    phone = CharField(max_length=20, blank=True, null=True)
    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone: raise ValueError("Phone number is required")
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        if extra_fields.get("is_staff") is not True: raise ValidationError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True: raise ValidationError("Superuser must have is_superuser=True.")
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    class Role(TextChoices):
        ADMIN = "admin", "Admin"
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        CASHIER = "cashier", "Cashier"

    phone = CharField(max_length=20, unique=True)
    email = EmailField(blank=True, null=True)
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    role = CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)
    avatar = ImageField(upload_to="avatars/", blank=True, null=True)
    branch = ForeignKey(Branch, on_delete=SET_NULL, null=True, blank=True, related_name='employees')
    is_active = BooleanField(default=True)
    is_staff = BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def clean(self):
        super().clean()
        if Branch.objects.exists():
            if self.role in [self.Role.CASHIER, self.Role.MANAGER] and not self.branch:
                raise ValidationError(
                    {"branch": f"{self.get_role_display()} roli uchun filial (branch) tanlanishi shart!"})
            if self.role == self.Role.ADMIN and self.branch:
                raise ValidationError({"branch": "Admin biron bir filialga biriktirilishi mumkin emas!"})

    def save(self, *args, **kwargs):
        if self.is_superuser: self.role = self.Role.ADMIN
        self.full_clean()
        super().save(*args, **kwargs)
