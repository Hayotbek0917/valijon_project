from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from apps.models import (
    User,
    Market,
    Branch,
    Category,
    Product,
    Warehouse,
    InventoryItem,
    Supplier,
    SupplierCatalogItem,
)


class Command(BaseCommand):
    help = "Demo ma'lumotlarni bazaga yuklash"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write("Ma'lumotlar yuklanmoqda...")

        # 1. Market yaratish
        market, _ = Market.objects.get_or_create(
            name="Asosiy Market",
            defaults={"phone": "990001234", "address": "Toshkent shahar"},
        )

        # 2. Filial yaratish
        branch, _ = Branch.objects.get_or_create(
            name="Markaziy Filial",
            market=market,
            defaults={"address": "Chilonzor ko'chasi", "phone": "990001234"},
        )

        users_data = [
            ("901234567", "123", "Admin", "Admin", User.Role.ADMIN),
            ("901111111", "123", "Rustam", "Boss", User.Role.OWNER),
            ("902222222", "123", "Dilshod", "Manager", User.Role.MANAGER),
            ("907654321", "123", "Akmal", "Kassir", User.Role.CASHIER),
        ]

        for phone, password, first, last, role in users_data:
            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    "password": password,
                    "first_name": first,
                    "last_name": last,
                    "role": role,
                    "branch": branch if role != User.Role.OWNER else None,
                },
            )
            if created:
                user.set_password(password)
                user.save()

        self.stdout.write(self.style.SUCCESS("Foydalanuvchilar yaratildi."))

        cat, _ = Category.objects.get_or_create(name="Ichimliklar")
        warehouse, _ = Warehouse.objects.get_or_create(
            name="Asosiy Ombor", branch=branch
        )

        product, _ = Product.objects.update_or_create(
            barcode="8901234567890",
            defaults={
                "name": "Cola 1L",
                "category": cat,
                "branch": branch,
                "selling_price": Decimal("10000.00"),
                "base_price": Decimal("7000.00"),
                "stock": 100,
            },
        )

        # 5. Inventory (Ombor)
        InventoryItem.objects.update_or_create(
            product=product, warehouse=warehouse, defaults={"quantity": 100}
        )

        self.stdout.write(
            self.style.SUCCESS("Demo ma'lumotlar muvaffaqiyatli yuklandi!")
        )
