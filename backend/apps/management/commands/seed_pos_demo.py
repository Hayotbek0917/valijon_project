from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.models import (
    User,
    Branch,
    Category,
    Product,
    Supplier,
    SupplierCatalogItem,
    Warehouse,
    InventoryItem,
    Sale,
    PurchaseOrder,
    PurchaseOrderLine,
    Customer,
    Agent,
    AgentOrder,
)

DEMO_USERS = [
    dict(
        username="admin",
        password="123",
        first_name="Adminstrator",
        last_name="?",
        role="admin",
        phone="901234567",
        email="admin@market.uz",
    ),
    dict(
        username="boss",
        password="123",
        first_name="Rustam",
        last_name="Boss",
        role="boss",
        phone="901111111",
        email="boss@market.uz",
    ),
    dict(
        username="manager",
        password="123",
        first_name="Dilshod",
        last_name="Manager",
        role="manager",
        phone="902222222",
        email="manager@market.uz",
    ),
    dict(
        username="kassir",
        password="123",
        first_name="Akmaljon",
        last_name="Kassir",
        role="cashier",
        phone="907654321",
        email="akmaljon@market.uz",
    ),
]

PRODUCTS = [
    ("Cola 1L", "Ichimliklar", 10000, 7000, "?", "8901234567890", 150),
    ("Pepsi 1L", "Ichimliklar", 9500, 6500, "?", "8901234567891", 80),
    ("Non (Tandir)", "Oziq-ovqat", 8000, 4000, "?", "8901234567892", 20),
    ("Lay's Chips", "Shirinliklar", 12000, 8000, "?", "8901234567893", 100),
    ("Snickers 50g", "Shirinliklar", 9000, 6000, "?", "8901234567894", 15),
    ("Smetana 20%", "Sut mahsulotlari", 15000, 10000, "?", "8901234567895", 0),
    ("Qatiq", "Sut mahsulotlari", 11000, 7500, "?", "8901234567896", 0),
]

SUPPLIERS = [
    dict(
        name="Coca-Cola Uzbekistan",
        phone="901112233",
        address="Toshkent",
        catalog=[dict(name="Cola 1L", unit="litr")],
    ),
    dict(
        name="PepsiCo UZ",
        phone="912223344",
        address="Toshkent",
        catalog=[dict(name="Pepsi 1L", unit="litr")],
    ),
    dict(
        name="Novda Non",
        phone="923334455",
        address="Toshkent",
        catalog=[dict(name="Non (Tandir)", unit="dona")],
    ),
]


class Command(BaseCommand):
    help = "POS demo ma'lumotlarini yuklash"

    @transaction.atomic
    def handle(self, *args, **options):
        branch, _ = Branch.objects.get_or_create(
            name="Market (Oziq-ovqat)",
            defaults={"address": "Toshkent", "phone": "901234567"},
        )

        for data in DEMO_USERS:
            if not User.objects.filter(username=data["username"]).exists():
                User.objects.create_user(
                    username=data["username"],
                    password=data["password"],
                    phone=data["phone"],
                    email=data["email"],
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    role=data["role"],
                    branch=branch if data["role"] in ("manager", "cashier") else None,
                )
                self.stdout.write(f"  + user {data['username']}")

        categories = {}
        for name in [
            "Ichimliklar",
            "Oziq-ovqat",
            "Sut mahsulotlari",
            "Shirinliklar",
            "Kraxmal",
        ]:
            categories[name], _ = Category.objects.get_or_create(name=name)

        warehouse, _ = Warehouse.objects.get_or_create(
            branch=branch, name="Asosiy Oziq-ovqat Ombori"
        )

        products_by_name = {}
        for name, cat, price, cost, emoji, barcode, stock in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                barcode=barcode,
                defaults={
                    "name": name,
                    "category": categories[cat],
                    "branch": branch,
                    "selling_price": Decimal(price),
                    "base_price": Decimal(cost),
                    "emoji": emoji,
                    "stock": stock,
                },
            )
            products_by_name[name] = product
            if stock > 0:
                InventoryItem.objects.update_or_create(
                    product=product, warehouse=warehouse, defaults={"quantity": stock}
                )

        for sdata in SUPPLIERS:
            catalog_items = sdata.pop("catalog")
            supplier, _ = Supplier.objects.get_or_create(
                branch=branch, name=sdata["name"], defaults={**sdata, "status": "Faol"}
            )
            for entry in catalog_items:
                cname, unit = entry["name"], entry.get("unit", "dona")
                product = products_by_name.get(cname)
                SupplierCatalogItem.objects.update_or_create(
                    supplier=supplier,
                    name=cname,
                    defaults={
                        "category": product.category.name if product else "Boshqa",
                        "default_cost": product.base_price if product else Decimal("0"),
                        "product": product,
                        "unit": unit,
                    },
                )

        self.stdout.write(
            self.style.SUCCESS("Demo ma'lumotlar muvaffaqiyatli yuklandi!")
        )
