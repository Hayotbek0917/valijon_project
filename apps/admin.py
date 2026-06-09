from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.models import (
    User, Branch, Category, Product, Supplier, Warehouse, InventoryItem,
    Sale, SaleLine, PurchaseOrder, PurchaseOrderLine, Customer, Agent, AgentOrder,
)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'created_at')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'phone', 'full_name', 'role', 'branch', 'is_active')
    list_filter = ('role', 'is_active', 'branch')
    search_fields = ('username', 'phone', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Shaxsiy', {'fields': ('first_name', 'last_name', 'phone', 'email', 'avatar')}),
        ('Rol', {'fields': ('role', 'branch')}),
        ('Huquq', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'phone', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )


admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Supplier)
admin.site.register(Warehouse)
admin.site.register(InventoryItem)
admin.site.register(Sale)
admin.site.register(SaleLine)
admin.site.register(PurchaseOrder)
admin.site.register(PurchaseOrderLine)
admin.site.register(Customer)
admin.site.register(Agent)
admin.site.register(AgentOrder)
