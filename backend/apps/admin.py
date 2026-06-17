from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserModelView(UserAdmin):
    list_display = (
        "phone",
        "first_name",
        "last_name",
        "role",
        "branch",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "is_staff", "is_active", "is_superuser", "branch")
    search_fields = ("phone", "first_name", "last_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        (
            _("Shaxsiy Ma'lumotlar"),
            {"fields": ("first_name", "last_name", "role", "branch")},
        ),
        (
            _("Huquqlar & Rollar"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Muhim sanalar"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone",
                    "password",
                    "first_name",
                    "last_name",
                    "role",
                    "branch",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "last_login")
