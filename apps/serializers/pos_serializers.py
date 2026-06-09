from rest_framework import serializers

from apps.models import (
    Supplier, SupplierCatalogItem, Warehouse, InventoryItem, Sale, SaleLine,
    PosCartDraft, PurchaseOrder, PurchaseOrderLine, Customer, Agent, AgentOrder, User,
)


class SupplierCatalogItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(read_only=True, allow_null=True)
    default_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = SupplierCatalogItem
        fields = [
            'id', 'name', 'category', 'default_cost', 'item_type', 'size', 'unit', 'product', 'product_id',
        ]
        read_only_fields = ['product', 'product_id']


class SupplierSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    catalog = SupplierCatalogItemSerializer(many=True, required=False)

    class Meta:
        model = Supplier
        fields = [
            'id', 'branch', 'business_id', 'name', 'contact', 'phone', 'email',
            'address', 'category', 'total_orders', 'status', 'catalog',
        ]

    def create(self, validated_data):
        catalog_data = validated_data.pop('catalog', [])
        supplier = Supplier.objects.create(**validated_data)
        for item in catalog_data:
            SupplierCatalogItem.objects.create(supplier=supplier, **item)
        return supplier


class WarehouseSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)

    class Meta:
        model = Warehouse
        fields = ['id', 'branch', 'business_id', 'name']


class InventoryItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(read_only=True)
    warehouse_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'product', 'product_id', 'warehouse', 'warehouse_id', 'quantity']


class SaleLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ['id', 'product_name', 'quantity', 'unit_price']


from apps.services.sale import create_sale_with_stock


class PosCartDraftSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    cashier_id = serializers.IntegerField(read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = PosCartDraft
        fields = [
            'id', 'branch', 'business_id', 'cashier', 'cashier_id', 'label',
            'pay_method', 'items', 'total', 'item_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['cashier', 'cashier_id', 'created_at', 'updated_at']

    def get_item_count(self, obj):
        return sum(int(i.get('qty', 0)) for i in (obj.items or []))

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Savat bo\'sh bo\'lishi mumkin emas')
        return value

    def validate(self, attrs):
        from apps.services.stock import get_available_qty

        branch = attrs.get('branch')
        if not branch:
            return attrs
        for item in attrs.get('items') or []:
            pid = item.get('id')
            if pid is None:
                continue
            qty = int(item.get('qty') or 0)
            available = get_available_qty(branch.id, int(pid))
            if qty > available:
                name = item.get('name') or f'#{pid}'
                raise serializers.ValidationError({
                    'items': (
                        f'"{name}" uchun skladda faqat {available} ta mavjud '
                        f'({qty} ta saqlab bo\'lmaydi — boshqa navbatda band).'
                    ),
                })
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        branch = validated_data['branch']
        if not validated_data.get('label'):
            n = PosCartDraft.objects.filter(branch=branch, cashier=user).count() + 1
            validated_data['label'] = f'Navbat #{n}'
        validated_data['cashier'] = user
        return super().create(validated_data)


class SaleSerializer(serializers.ModelSerializer):
    lines = SaleLineSerializer(many=True, required=False)
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    pos_draft_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'branch', 'business_id', 'external_id', 'date', 'time',
            'amount', 'method', 'cashier', 'cashier_name', 'items', 'lines',
            'pos_draft_id',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        pos_draft_id = validated_data.pop('pos_draft_id', None)
        return create_sale_with_stock(validated_data, lines_data, exclude_draft_id=pos_draft_id)


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(allow_null=True, required=False)
    catalog_item_id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id', 'product', 'product_id', 'catalog_item', 'catalog_item_id',
            'name', 'quantity', 'item_type', 'size', 'unit', 'cost_price',
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, required=False)
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    supplier_id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'branch', 'business_id', 'external_id', 'supplier', 'supplier_id',
            'supplier_name', 'date', 'receipt_date', 'total', 'status', 'lines',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        order = PurchaseOrder.objects.create(**validated_data)
        for line in lines_data:
            PurchaseOrderLine.objects.create(order=order, **line)
        return order


class PurchaseReceiveLineSerializer(serializers.Serializer):
    line_id = serializers.IntegerField()
    received_qty = serializers.IntegerField(min_value=0)
    damaged_qty = serializers.IntegerField(min_value=0, required=False, default=0)


class PurchaseReceiveSerializer(serializers.Serializer):
    warehouse = serializers.IntegerField()
    receipt_date = serializers.DateField(required=False)
    lines = PurchaseReceiveLineSerializer(many=True)


class CustomerSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'branch', 'business_id', 'name', 'phone', 'email']


class AgentSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    supplier_id = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Agent
        fields = [
            'id', 'branch', 'business_id', 'name', 'phone',
            'supplier', 'supplier_id', 'supplier_name',
        ]

    def create(self, validated_data):
        supplier = validated_data.get('supplier')
        if supplier and not validated_data.get('supplier_name'):
            validated_data['supplier_name'] = supplier.name
        return super().create(validated_data)


class AgentOrderSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(source='branch_id', read_only=True)
    agent_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = AgentOrder
        fields = [
            'id', 'branch', 'business_id', 'agent', 'agent_id', 'agent_name',
            'customer_name', 'items', 'total', 'date',
        ]

    def create(self, validated_data):
        agent = validated_data.get('agent')
        if agent and not validated_data.get('agent_name'):
            validated_data['agent_name'] = agent.name
        return super().create(validated_data)


class UserStaffSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'first_name', 'last_name',
            'phone', 'email', 'role', 'is_active', 'branch',
        ]
        read_only_fields = fields


class StaffCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()
    role = serializers.ChoiceField(choices=['boss', 'manager', 'cashier'])
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Bu login band')
        return value

    def create(self, validated_data):
        from apps.models import Branch
        import random

        name = validated_data.pop('name').strip()
        parts = name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else '—'
        phone = validated_data.pop('phone', '').strip()
        if not phone:
            phone = f'+99890{random.randint(1000000, 9999999)}'
            while User.objects.filter(phone=phone).exists():
                phone = f'+99890{random.randint(1000000, 9999999)}'

        branch = None
        if validated_data['role'] in ('manager', 'cashier'):
            branch = Branch.objects.first()

        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=validated_data['role'],
            branch=branch,
        )
