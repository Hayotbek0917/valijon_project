from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.models import (
    User,
    Branch,
    Market,
    Category,
    Product,
    Supplier,
    SupplierCatalogItem,
    Warehouse,
    InventoryItem,
    Sale,
    SaleLine,
    PosCartDraft,
    PurchaseOrder,
    PurchaseOrderLine,
    Customer,
    Agent,
    AgentOrder,
    DebtCustomers,
    CreditTransaction,
)


@admin.register(Market)
class MarketAdmin(admin.ModelAdmin):
    list_display = ("name", "owner_name", "phone", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "owner_name", "phone")
    ordering = ("name",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "market", "phone", "address", "created_at")
    list_filter = ("market",)
    search_fields = ("name", "phone")
    ordering = ("name",)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # 'full_name' o'rniga modelda bor 'first_name' va 'last_name' yoki 'username' ishlatiladi.
    # 'created_at' User modelimizda yo'q (chunki u AbstractUser va BaseModeldan meros olgan),
    # shuning uchun ro'yxatdan o'tgan vaqtni 'date_joined' orqali ko'ramiz va tartiblaymiz.
    list_display = ("username", "phone", "first_name", "last_name", "role", "market", "branch", "is_active")
    list_filter = ("role", "is_active", "branch")
    search_fields = ("username", "phone", "first_name", "last_name", "email")
    ordering = ("username",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Shaxsiy ma'lumotlar", {"fields": ("first_name", "last_name", "email", "phone")}),
        ("Rol va Joylashuv", {"fields": ("role", "market", "branch")}),
        (
            "Huquqlar",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "phone", "first_name", "last_name", "password", "role", "market", "branch"),
            },
        ),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "barcode", "category", "branch", "selling_price", "base_price", "stock", "status")
    list_filter = ("status", "category", "branch")
    search_fields = ("name", "barcode")
    ordering = ("-created_at",)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("external_id", "branch", "amount", "method", "cashier_name", "date", "time")
    list_filter = ("method", "branch", "date")
    search_fields = ("external_id", "cashier_name")


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("external_id", "branch", "supplier_name", "date", "total", "status")
    list_filter = ("status", "branch", "date")
    search_fields = ("external_id", "supplier_name")


@admin.register(DebtCustomers)
class DebtCustomersAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "phone", "branch", "balance")
    list_filter = ("branch",)
    search_fields = ("customer_name", "phone")


admin.site.register(Category)
admin.site.register(Supplier)
admin.site.register(SupplierCatalogItem)
admin.site.register(Warehouse)
admin.site.register(InventoryItem)
admin.site.register(SaleLine)
admin.site.register(PosCartDraft)
admin.site.register(PurchaseOrderLine)
admin.site.register(Customer)
admin.site.register(Agent)
admin.site.register(AgentOrder)
admin.site.register(CreditTransaction)