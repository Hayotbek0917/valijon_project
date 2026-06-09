from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.models import (
    User, Branch, Category, Product, Supplier, SupplierCatalogItem,
    Warehouse, InventoryItem, Sale, PurchaseOrder, PurchaseOrderLine,
    Customer, Agent, AgentOrder,
)


DEMO_USERS = [
    dict(username='admin', password='123', first_name='Adminstrator', last_name='—', role='admin',
         phone='+998901234567', email='admin@market.uz'),
    dict(username='boss', password='123', first_name='Rustam', last_name='Boss', role='boss',
         phone='+998901111111', email='boss@market.uz'),
    dict(username='manager', password='123', first_name='Dilshod', last_name='Manager', role='manager',
         phone='+998902222222', email='manager@market.uz'),
    dict(username='kassir', password='123', first_name='Akmaljon', last_name='Kassir', role='cashier',
         phone='+998907654321', email='akmaljon@market.uz'),
]

PRODUCTS = [
    ('Cola 1L', 'Ichimliklar', 10000, 7000, '🥤', '8901234567890', 150, False),
    ('Pepsi 1L', 'Ichimliklar', 9500, 6500, '🥤', '8901234567891', 80, False),
    ('Non (Tandir)', 'Oziq-ovqat', 8000, 4000, '🫓', '8901234567892', 20, False),
    ("Lay's Chips", 'Shirinliklar', 12000, 8000, '🍟', '8901234567893', 100, False),
    ('Snickers 50g', 'Shirinliklar', 9000, 6000, '🍫', '8901234567894', 15, True),
    ('Smetana 20%', 'Sut mahsulotlari', 15000, 10000, '🥛', '8901234567895', 0, False),
    ('Qatiq', 'Sut mahsulotlari', 11000, 7500, '🥛', '8901234567896', 0, False),
]

SUPPLIERS = [
    dict(name='Coca-Cola Uzbekistan', contact='', phone='+998901112233',
         email='', address='', category='Ichimliklar',
         total_orders=45, catalog=[dict(name='Cola 1L', unit='litr')]),
    dict(name='PepsiCo UZ', contact='', phone='+998912223344',
         email='', address='', category='Ichimliklar',
         total_orders=32, catalog=[dict(name='Pepsi 1L', unit='litr')]),
    dict(name='Novda Non', contact='', phone='+998923334455',
         email='', address='', category='Non mahsulotlari',
         total_orders=78, catalog=[dict(name='Non (Tandir)', unit='dona')]),
]


class Command(BaseCommand):
    help = 'POS demo maʼlumotlarini yuklash (frontend initialData bilan mos)'

    @transaction.atomic
    def handle(self, *args, **options):
        branch, _ = Branch.objects.get_or_create(
            name='Market (Oziq-ovqat)',
            defaults={'address': 'Toshkent', 'phone': '+998901234567'},
        )

        for data in DEMO_USERS:
            if User.objects.filter(username=data['username']).exists():
                self.stdout.write(f'  = user {data["username"]} (mavjud)')
                continue
            User.objects.create_user(
                username=data['username'],
                password=data['password'],
                phone=data['phone'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role=data['role'],
                branch=branch if data['role'] in ('manager', 'cashier') else None,
            )
            self.stdout.write(f'  + user {data["username"]}')

        categories = {}
        for name in ['Ichimliklar', 'Oziq-ovqat', 'Sut mahsulotlari', 'Shirinliklar', 'Kraxmal']:
            categories[name], _ = Category.objects.get_or_create(name=name)

        warehouse, _ = Warehouse.objects.get_or_create(
            branch=branch, name='Asosiy Oziq-ovqat Ombori',
        )

        products_by_name = {}
        for name, cat, price, cost, emoji, barcode, stock, is_draft in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                barcode=barcode,
                defaults={
                    'name': name,
                    'category': categories[cat],
                    'branch': branch,
                    'selling_price': Decimal(price),
                    'base_price': Decimal(cost),
                    'emoji': emoji,
                    'stock': stock,
                    'is_draft': is_draft,
                },
            )
            products_by_name[name] = product
            if stock > 0:
                InventoryItem.objects.update_or_create(
                    product=product, warehouse=warehouse,
                    defaults={'quantity': stock},
                )

        suppliers_by_name = {}
        for sdata in SUPPLIERS:
            catalog_names = sdata.pop('catalog')
            supplier, _ = Supplier.objects.get_or_create(
                branch=branch, name=sdata['name'],
                defaults={**sdata, 'status': 'Faol'},
            )
            suppliers_by_name[sdata['name']] = supplier
            for entry in catalog_names:
                if isinstance(entry, str):
                    cname, unit = entry, 'dona'
                else:
                    cname, unit = entry['name'], entry.get('unit', 'dona')
                product = products_by_name.get(cname)
                cat = product.category.name if product else sdata['category']
                cost = product.base_price if product else Decimal('0')
                SupplierCatalogItem.objects.update_or_create(
                    supplier=supplier, name=cname,
                    defaults={
                        'category': cat,
                        'default_cost': cost,
                        'product': product,
                        'unit': unit,
                    },
                )

        cola_supplier = suppliers_by_name['Coca-Cola Uzbekistan']
        PurchaseOrder.objects.get_or_create(
            external_id='PO-001',
            defaults={
                'branch': branch,
                'supplier': cola_supplier,
                'supplier_name': cola_supplier.name,
                'date': '2026-05-18',
                'total': Decimal('1050000'),
                'status': 'Yetkazilgan',
                'receipt_date': '2026-05-18',
            },
        )
        po1 = PurchaseOrder.objects.get(external_id='PO-001')
        if not po1.lines.exists():
            cola = products_by_name['Cola 1L']
            cat_item = SupplierCatalogItem.objects.filter(supplier=cola_supplier, name='Cola 1L').first()
            PurchaseOrderLine.objects.create(
                order=po1, product=cola, catalog_item=cat_item,
                name='Cola 1L', quantity=150, item_type='tuzsiz', size='1L', unit='litr',
                cost_price=Decimal('7000'),
            )

        non_supplier = suppliers_by_name['Novda Non']
        PurchaseOrder.objects.get_or_create(
            external_id='PO-002',
            defaults={
                'branch': branch,
                'supplier': non_supplier,
                'supplier_name': non_supplier.name,
                'date': '2026-05-20',
                'total': Decimal('800000'),
                'status': 'Kutilmoqda',
            },
        )
        po2 = PurchaseOrder.objects.get(external_id='PO-002')
        if not po2.lines.exists():
            non = products_by_name['Non (Tandir)']
            cat_item = SupplierCatalogItem.objects.filter(supplier=non_supplier, name='Non (Tandir)').first()
            PurchaseOrderLine.objects.create(
                order=po2, product=non, catalog_item=cat_item,
                name='Non (Tandir)', quantity=200, item_type='tuzli', size='300g', unit='gr',
                cost_price=Decimal('4000'),
            )

        Customer.objects.get_or_create(
            branch=branch, phone='+998901234567',
            defaults={'name': 'Bobur Mirzo', 'email': 'bobur@gmail.com'},
        )
        Customer.objects.get_or_create(
            branch=branch, phone='+998934567890',
            defaults={'name': 'Zilola Ahmedova', 'email': 'zilola@gmail.com'},
        )

        agent, _ = Agent.objects.get_or_create(
            branch=branch, name='Agent Davron',
            defaults={
                'phone': '+998909998877',
                'supplier': cola_supplier,
                'supplier_name': cola_supplier.name,
            },
        )

        AgentOrder.objects.get_or_create(
            branch=branch, agent=agent, date='2026-05-20',
            defaults={
                'agent_name': agent.name,
                'customer_name': 'Bobur Mirzo',
                'items': 'Cola 1L x50',
                'total': Decimal('500000'),
            },
        )

        Sale.objects.get_or_create(
            external_id='TXN-001',
            defaults={
                'branch': branch,
                'date': '2026-05-21',
                'time': '12:30',
                'amount': Decimal('28000'),
                'method': 'Naqd',
                'cashier_name': 'Akmaljon',
                'items': [
                    {'name': 'Cola 1L', 'qty': 2, 'price': 10000},
                    {'name': 'Non (Tandir)', 'qty': 1, 'price': 8000},
                ],
            },
        )

        self.stdout.write(self.style.SUCCESS('Demo maʼlumotlar tayyor.'))
