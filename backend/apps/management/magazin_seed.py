"""100 ta magazin uchun seed yordamchi funksiyalar."""

from __future__ import annotations

import random
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from apps.models import (
    Branch,
    Category,
    CreditTransaction,
    DebtCustomers,
    InventoryItem,
    Product,
    Sale,
    Supplier,
    SupplierCatalogItem,
    User,
    Warehouse,
)

PASSWORD = "123"
STORE_PREFIX = "Magazin "

CATEGORIES = [
    "Ichimliklar",
    "Non mahsulotlari",
    "Go'sht va parranda",
    "Sut mahsulotlari",
    "Meva-sabzavot",
    "Qandolat",
    "Maishiy kimyo",
    "Konserverlar",
    "Yog' va margarin",
    "Choy va qahva",
]

PRODUCT_PARTS = [
    "Cola", "Fanta", "Pepsi", "Sut", "Qatiq", "Non", "Lavash", "Go'sht",
    "Tovuq", "Baliq", "Olma", "Banan", "Kartoshka", "Piyoz", "Sabzi",
    "Guruch", "Makaron", "Un", "Yog'", "Tuxum", "Sariyog'", "Pishloq",
    "Shokolad", "Pechenye", "Choy", "Qahva", "Suv", "Energetik", "Sok",
    "Shampun", "Sabun", "Krem", "Pampers", "Choynak", "Tuz", "Ziravor",
]

SIZES = ["0.5L", "1L", "1.5L", "2L", "330ml", "500ml", "500g", "1kg", "250g", "200g", "100g"]
UNITS = ["dona", "kg", "litr", "paket", "quti"]

SUPPLIER_NAMES = [
    "Baraka Trade", "O'zbekiston Food", "Toshkent Supply", "Navoiy Optom",
    "Samarqand Distr", "Farg'ona Agro", "Andijon Market", "Buxoro Logist",
    "Qarshi Ta'minot", "Namangan Fresh", "Jizzax Food", "Surxondaryo Opt",
]

CUSTOMER_FIRST = [
    "Ali", "Vali", "Hasan", "Husan", "Dilshod", "Aziza", "Malika", "Gulnora",
    "Rustam", "Jamshid", "Sherzod", "Nodira", "Kamola", "Bekzod", "Sardor",
]

CUSTOMER_LAST = [
    "Karimov", "Toshmatov", "Rahimov", "Saidov", "Yusupov", "Mirzayev",
    "Nazarov", "Qodirov", "Ergashev", "Abdurahmonov", "Xolmatov", "Ismoilov",
]

PAY_METHODS = [
    Sale.PayMethod.CASH,
    Sale.PayMethod.CARD,
    Sale.PayMethod.TRANSFER,
    Sale.PayMethod.CREDIT,
    Sale.PayMethod.MIXED,
]

PAY_WEIGHTS = [35, 25, 15, 15, 10]

# Magazin iqtisodiy profili — real hayotda hammasi foydada emas
STORE_PROFILES = (
    ("foydali", 0.58, 14, 28, Decimal("1.00")),   # yaxshi ishlaydi
    ("past", 0.28, 4, 12, Decimal("1.05")),         # oz foyda / ba'zan nolga yaqin
    ("zarar", 0.14, -20, -2, Decimal("1.12")),      # zararda (narx/payhon, xarajat)
)


def pick_store_profile(store_n: int) -> tuple[str, int, int, Decimal]:
    """Har bir magazin uchun barqaror profil (qayta seedda ham bir xil)."""
    rng = random.Random(50_000 + store_n)
    roll = rng.random()
    cumulative = 0.0
    for name, weight, margin_min, margin_max, overhead in STORE_PROFILES:
        cumulative += weight
        if roll < cumulative:
            return name, margin_min, margin_max, overhead
    name, _, margin_min, margin_max, overhead = STORE_PROFILES[0]
    return name, margin_min, margin_max, overhead


def store_label(n: int) -> str:
    return f"{STORE_PREFIX}{n:03d}"


def store_phone_base(n: int) -> int:
    return 910_000_000 + n * 100


def ensure_categories() -> list[Category]:
    cats = list(Category.objects.all())
    if not cats:
        for name in CATEGORIES:
            Category.objects.get_or_create(name=name)
        cats = list(Category.objects.all())
    return cats


def ensure_superadmin() -> User:
    user, created = User.objects.get_or_create(
        username="superadmin",
        defaults={
            "phone": "900000001",
            "first_name": "Platform",
            "last_name": "Egasi",
            "role": User.Role.ADMIN,
            "is_staff": True,
            "is_superuser": True,
            "branch": None,
        },
    )
    if created or not user.check_password(PASSWORD):
        user.set_password(PASSWORD)
        user.save(update_fields=["password"])
    return user


def clear_magazin_data(stdout=None) -> None:
    branch_ids = list(
        Branch.objects.filter(name__startswith=STORE_PREFIX).values_list("id", flat=True)
    )
    if not branch_ids:
        return

    Sale.objects.filter(branch_id__in=branch_ids).delete()
    DebtCustomers.objects.filter(branch_id__in=branch_ids).delete()
    Supplier.objects.filter(branch_id__in=branch_ids).delete()
    Product.objects.filter(branch_id__in=branch_ids).delete()
    Warehouse.objects.filter(branch_id__in=branch_ids).delete()
    User.objects.filter(branch_id__in=branch_ids).delete()
    Branch.objects.filter(id__in=branch_ids).delete()
    User.objects.filter(username__regex=r"^m\d{3}\.").delete()

    if stdout:
        stdout.write(f"O'chirildi: {len(branch_ids)} ta magazin va bog'liq ma'lumotlar")


def create_store_users(branch: Branch, n: int, rng: random.Random) -> dict[str, list[User]]:
    base = store_phone_base(n)
    cashier_count = rng.randint(2, 4)
    specs = [
        (f"m{n:03d}.admin", base + 1, "Admin", User.Role.ADMIN),
        (f"m{n:03d}.manager", base + 2, "Manager", User.Role.MANAGER),
    ]
    for i in range(1, cashier_count + 1):
        specs.append((f"m{n:03d}.kassir{i}", base + 2 + i, f"Kassir {i}", User.Role.CASHIER))
    users: dict[str, list[User]] = {"cashiers": [], "all": []}
    hashed = make_password(PASSWORD)
    for username, phone, first_name, role in specs:
        user = User(
            username=username,
            phone=str(phone),
            first_name=first_name,
            last_name=store_label(n),
            role=role,
            branch=branch,
            password=hashed,
        )
        user.save()
        users["all"].append(user)
        if role == User.Role.CASHIER:
            users["cashiers"].append(user)
    return users


def random_product_name(rng: random.Random) -> str:
    part = rng.choice(PRODUCT_PARTS)
    size = rng.choice(SIZES)
    return f"{part} {size}".strip()


def seed_branch_products(
    branch: Branch,
    warehouse: Warehouse,
    categories: list[Category],
    count: int,
    rng: random.Random,
    *,
    margin_min: int = 14,
    margin_max: int = 28,
) -> list[Product]:
    products: list[Product] = []
    for i in range(count):
        cat = rng.choice(categories)
        base = Decimal(rng.randint(3_000, 80_000))
        margin_pct = Decimal(rng.randint(margin_min, margin_max)) / Decimal(100)
        selling = (base * (Decimal("1") + margin_pct)).quantize(Decimal("1"))
        if selling < Decimal("1000"):
            selling = Decimal("1000")
        products.append(
            Product(
                name=random_product_name(rng),
                barcode=f"M{branch.name[-3:]}{i:06d}",
                category=cat,
                branch=branch,
                selling_price=selling,
                base_price=base,
                stock=rng.randint(10, 500),
                emoji=rng.choice(["📦", "🥤", "🍞", "🥩", "🧀", "🍎", "🧴"]),
            )
        )
    Product.objects.bulk_create(products, batch_size=500)
    created = list(Product.objects.filter(branch=branch).order_by("id"))
    inv = [
        InventoryItem(product=p, warehouse=warehouse, quantity=p.stock)
        for p in created
    ]
    InventoryItem.objects.bulk_create(inv, batch_size=500, ignore_conflicts=True)
    return created


def seed_branch_suppliers(
    branch: Branch,
    products: list[Product],
    count: int,
    rng: random.Random,
) -> list[Supplier]:
    suppliers: list[Supplier] = []
    for i in range(count):
        suppliers.append(
            Supplier(
                branch=branch,
                name=f"{rng.choice(SUPPLIER_NAMES)} #{i + 1}",
                phone=str(store_phone_base(int(branch.name[-3:])) + 50 + i)[-9:],
                agent_name=f"Agent {rng.choice(CUSTOMER_FIRST)}",
                status=Supplier.Status.ACTIVE,
                total_orders=rng.randint(0, 120),
            )
        )
    Supplier.objects.bulk_create(suppliers, batch_size=200)
    created = list(Supplier.objects.filter(branch=branch).order_by("id"))
    catalog: list[SupplierCatalogItem] = []
    sample_products = products[: min(len(products), 40)]
    for sup in created:
        for prod in rng.sample(sample_products, k=min(len(sample_products), rng.randint(5, 15))):
            catalog.append(
                SupplierCatalogItem(
                    supplier=sup,
                    name=prod.name,
                    category=prod.category.name,
                    default_cost=prod.base_price,
                    barcode=prod.barcode,
                    product=prod,
                )
            )
    SupplierCatalogItem.objects.bulk_create(catalog, batch_size=500)
    return created


def seed_branch_debtors(
    branch: Branch,
    count: int,
    rng: random.Random,
) -> list[DebtCustomers]:
    debtors: list[DebtCustomers] = []
    n = int(branch.name[-3:])
    for i in range(count):
        debtors.append(
            DebtCustomers(
                branch=branch,
                customer_name=f"{rng.choice(CUSTOMER_FIRST)} {rng.choice(CUSTOMER_LAST)}",
                phone=str(store_phone_base(n) + 60 + i)[-9:],
                balance=Decimal(rng.randint(0, 500_000)),
            )
        )
    DebtCustomers.objects.bulk_create(debtors, batch_size=200)
    return list(DebtCustomers.objects.filter(branch=branch).order_by("id"))



def _payment(method: str, total: Decimal, rng: random.Random) -> tuple[str, dict]:
    if method != Sale.PayMethod.MIXED:
        return method, {}
    cash = (total * Decimal(rng.randint(30, 70)) / Decimal(100)).quantize(Decimal("1"))
    card = total - cash
    return method, {"Naqd": float(cash), "Karta": float(card)}


def _scaled_amounts(count: int, total: Decimal, rng: random.Random) -> list[Decimal]:
    if count <= 0 or total <= 0:
        return []
    raw = [Decimal(rng.randint(3_000, 120_000)) for _ in range(count)]
    subtotal = sum(raw) or Decimal("1")
    return [(total * (x / subtotal)).quantize(Decimal("1")) for x in raw]


def _sale_items_for_amount(
    products: list[Product], amount: Decimal, rng: random.Random,
    *, cost_overhead: Decimal = Decimal("1"),
) -> tuple[list[dict], Decimal]:
    if not products or amount <= 0:
        return [], Decimal("0")

    # Narx bo'yicha mos mahsulotlar — arzon chekka qimmat, qimmat chekka arzon
    sorted_by_price = sorted(
        [p for p in products if p.selling_price and p.selling_price > 0],
        key=lambda p: p.selling_price,
    )
    if not sorted_by_price:
        return [], Decimal("0")

    if amount <= Decimal("15000"):
        pool = sorted_by_price[: max(1, len(sorted_by_price) // 3)]
    elif amount >= Decimal("80000"):
        pool = sorted_by_price[-max(1, len(sorted_by_price) // 3):]
    else:
        mid = len(sorted_by_price) // 2
        pool = sorted_by_price[max(0, mid - 50): mid + 50] or sorted_by_price

    item_count = rng.randint(1, min(3, len(pool)))
    picked = rng.sample(pool, k=item_count)
    items: list[dict] = []
    remaining = amount

    for i, p in enumerate(picked):
        unit_cost = (p.base_price * cost_overhead).quantize(Decimal("1"))
        if i == len(picked) - 1:
            qty = max(1, int(remaining / p.selling_price))
        else:
            max_qty = max(1, int(remaining / p.selling_price / 2))
            qty = rng.randint(1, min(3, max_qty))
        line = (p.selling_price * qty).quantize(Decimal("1"))
        remaining = max(Decimal("0"), remaining - line)
        items.append(
            {
                "id": p.id,
                "name": p.name,
                "qty": qty,
                "price": float(p.selling_price),
                "cost": float(unit_cost),
                "total": float(line),
            }
        )

    actual = sum(Decimal(str(it["total"])) for it in items)
    return items, actual if actual > 0 else amount


def seed_branch_sales(
    branch: Branch,
    products: list[Product],
    cashiers: list[User],
    debtors: list[DebtCustomers],
    rng: random.Random,
    *,
    daily_sales_min: int,
    daily_sales_max: int,
    revenue_min: int,
    revenue_max: int,
    history_days: int = 30,
    cost_overhead: Decimal = Decimal("1"),
) -> tuple[int, Decimal]:
    if not products or not cashiers:
        return 0, Decimal("0")

    today = timezone.localdate()
    num_days = history_days + 1
    target_revenue = Decimal(rng.randint(revenue_min, revenue_max))
    day_weights = [Decimal(str(rng.uniform(0.85, 1.15))) for _ in range(num_days)]
    weight_sum = sum(day_weights) or Decimal("1")

    sales_batch: list[Sale] = []
    credit_links: list[tuple[int, DebtCustomers, Decimal]] = []
    total_amount = Decimal("0")
    sale_idx = 0

    def append_sale(sale_date: date, amount: Decimal) -> None:
        nonlocal sale_idx, total_amount
        items, actual = _sale_items_for_amount(
            products, amount, rng, cost_overhead=cost_overhead,
        )
        final_amount = actual if actual > 0 else amount
        method = rng.choices(PAY_METHODS, weights=PAY_WEIGHTS, k=1)[0]
        method, breakdown = _payment(method, final_amount, rng)
        cashier = rng.choice(cashiers)
        hour = rng.randint(8, 21)
        minute = rng.randint(0, 59)
        sales_batch.append(
            Sale(
                branch=branch,
                external_id=f"{branch.name[-3:]}-{sale_date.strftime('%y%m%d')}-{sale_idx + 1:05d}",
                date=sale_date,
                time=f"{hour:02d}:{minute:02d}",
                amount=final_amount,
                method=method,
                cashier=cashier,
                cashier_name=cashier.full_name,
                items=items,
                payment_breakdown=breakdown,
            )
        )
        total_amount += final_amount
        if method == Sale.PayMethod.CREDIT and debtors:
            credit_links.append((len(sales_batch) - 1, rng.choice(debtors), final_amount))
        sale_idx += 1

    for day_offset in range(num_days):
        sale_date = today - timedelta(days=day_offset)
        daily_count = rng.randint(daily_sales_min, daily_sales_max)
        day_revenue = (target_revenue * day_weights[day_offset] / weight_sum).quantize(Decimal("1"))
        for amount in _scaled_amounts(daily_count, day_revenue, rng):
            append_sale(sale_date, amount)

    Sale.objects.bulk_create(sales_batch, batch_size=2000)
    created_sales = list(
        Sale.objects.filter(branch=branch).order_by("-id")[: len(sales_batch)]
    )
    created_sales.reverse()

    txns: list[CreditTransaction] = []
    touched_debtors: set[DebtCustomers] = set()
    for idx, debtor, amount in credit_links:
        if idx < len(created_sales):
            sale = created_sales[idx]
            txns.append(
                CreditTransaction(
                    account=debtor,
                    kind=CreditTransaction.Kind.CHARGE,
                    amount=amount,
                    note=f"Sotuv #{sale.external_id}",
                    sale=sale,
                    cashier_name=sale.cashier_name,
                )
            )
            debtor.balance += amount
            touched_debtors.add(debtor)

    for debtor in touched_debtors:
        debtor.save(update_fields=["balance"])

    CreditTransaction.objects.bulk_create(txns, batch_size=1000)

    payers = rng.sample(debtors, k=min(len(debtors), max(1, len(debtors) // 8)))
    payments: list[CreditTransaction] = []
    for debtor in payers:
        if debtor.balance <= 0:
            continue
        pay = (debtor.balance * Decimal(rng.randint(20, 80)) / Decimal(100)).quantize(Decimal("1"))
        payments.append(
            CreditTransaction(
                account=debtor,
                kind=CreditTransaction.Kind.PAYMENT,
                amount=pay,
                note="Online to'lov",
                cashier_name="Online",
            )
        )
        debtor.balance -= pay
        debtor.save(update_fields=["balance"])
    CreditTransaction.objects.bulk_create(payments, batch_size=500)

    return len(created_sales), total_amount


def seed_single_store(
    n: int,
    categories: list[Category],
    *,
    products_min: int,
    products_max: int,
    suppliers_min: int,
    suppliers_max: int,
    debtors_min: int,
    debtors_max: int,
    daily_sales_min: int,
    daily_sales_max: int,
    revenue_min: int,
    revenue_max: int,
    sub_branches_min: int,
    sub_branches_max: int,
    history_days: int,
    rng: random.Random,
) -> dict:
    label = store_label(n)
    profile_name, margin_min, margin_max, cost_overhead = pick_store_profile(n)
    store_rng = random.Random(42 + n * 9973)
    branch = Branch.objects.create(
        name=label,
        address=f"{label}, Toshkent tumani, {n}-uy",
        phone=str(store_phone_base(n) + 9)[-9:],
    )
    wh_count = rng.randint(sub_branches_min, sub_branches_max)
    warehouses: list[Warehouse] = []
    for i in range(wh_count):
        suffix = f" Filial {i + 1}" if wh_count > 1 else " ombori"
        warehouses.append(
            Warehouse.objects.create(branch=branch, name=f"{label}{suffix}")
        )
    users = create_store_users(branch, n, rng)
    product_count = rng.randint(products_min, products_max)
    products = seed_branch_products(
        branch, warehouses[0], categories, product_count, store_rng,
        margin_min=margin_min, margin_max=margin_max,
    )
    supplier_count = rng.randint(suppliers_min, suppliers_max)
    seed_branch_suppliers(branch, products, supplier_count, store_rng)
    debtor_count = rng.randint(debtors_min, debtors_max)
    debtors = seed_branch_debtors(branch, debtor_count, store_rng)
    sales_n, revenue = seed_branch_sales(
        branch,
        products,
        users["cashiers"],
        debtors,
        store_rng,
        daily_sales_min=daily_sales_min,
        daily_sales_max=daily_sales_max,
        revenue_min=revenue_min,
        revenue_max=revenue_max,
        history_days=history_days,
        cost_overhead=cost_overhead,
    )
    return {
        "branch": label,
        "profile": profile_name,
        "products": len(products),
        "suppliers": supplier_count,
        "debtors": debtor_count,
        "sales": sales_n,
        "revenue": revenue,
        "warehouses": wh_count,
        "cashiers": len(users["cashiers"]),
    }


def write_store_logins(path: Path, count: int, rng_seed: int = 42) -> None:
    rng = random.Random(rng_seed)
    lines = [
        "# Magazin loginlar (parol: 123)",
        "superadmin — platform egasi (barcha magazinlar)",
        "",
    ]
    for n in range(1, count + 1):
        cashier_count = rng.randint(2, 4)
        lines.append(f"## {store_label(n)}")
        lines.append(f"m{n:03d}.admin — admin")
        lines.append(f"m{n:03d}.manager — menejer")
        for i in range(1, cashier_count + 1):
            lines.append(f"m{n:03d}.kassir{i} — kassir")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def run_ecosystem_seed(
    *,
    count: int = 100,
    clear: bool = False,
    products_min: int = 500,
    products_max: int = 1000,
    suppliers_min: int = 30,
    suppliers_max: int = 50,
    debtors_min: int = 200,
    debtors_max: int = 300,
    daily_sales_min: int = 800,
    daily_sales_max: int = 1000,
    revenue_min: int = 5_000_000,
    revenue_max: int = 10_000_000,
    sub_branches_min: int = 1,
    sub_branches_max: int = 3,
    history_days: int = 30,
    stdout=None,
    style=None,
) -> dict:
    if clear:
        clear_magazin_data(stdout)

    ensure_superadmin()
    categories = ensure_categories()
    rng = random.Random(42)

    totals = {
        "branches": 0,
        "products": 0,
        "sales": 0,
        "revenue": Decimal("0"),
        "suppliers": 0,
        "debtors": 0,
        "profiles": {"foydali": 0, "past": 0, "zarar": 0},
    }

    for n in range(1, count + 1):
        with transaction.atomic():
            stats = seed_single_store(
                n,
                categories,
                products_min=products_min,
                products_max=products_max,
                suppliers_min=suppliers_min,
                suppliers_max=suppliers_max,
                debtors_min=debtors_min,
                debtors_max=debtors_max,
                daily_sales_min=daily_sales_min,
                daily_sales_max=daily_sales_max,
                revenue_min=revenue_min,
                revenue_max=revenue_max,
                sub_branches_min=sub_branches_min,
                sub_branches_max=sub_branches_max,
                history_days=history_days,
                rng=rng,
            )
        totals["branches"] += 1
        totals["products"] += stats["products"]
        totals["sales"] += stats["sales"]
        totals["revenue"] += stats["revenue"]
        totals["suppliers"] += stats["suppliers"]
        totals["debtors"] += stats["debtors"]
        totals["profiles"][stats["profile"]] = totals["profiles"].get(stats["profile"], 0) + 1
        if stdout and n % 5 == 0:
            stdout.write(f"  {n}/{count} magazin tayyor...")

    project_root = Path(__file__).resolve().parents[3]
    write_store_logins(project_root / "store_logins.txt", count)

    return totals
