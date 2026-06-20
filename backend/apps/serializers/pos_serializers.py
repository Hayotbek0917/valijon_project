import random
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.fields import UUIDField, DecimalField, SerializerMethodField, CharField, IntegerField, DateField, JSONField
from rest_framework.serializers import ModelSerializer, Serializer

from django.db import transaction
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, Serializer, ValidationError
from rest_framework.fields import (
    UUIDField,
    DecimalField,
    SerializerMethodField,
    CharField,
    BooleanField,
    IntegerField,
    DateField,
)

from apps.models import (
    Supplier,
    SupplierCatalogItem,
    Warehouse,
    InventoryItem,
    Sale,
    SaleLine,
    PosCartDraft,
    PurchaseOrder,
    PurchaseOrderLine,
    AgentOrder,
    DebtCustomers,
)
from apps.serializers.choice_utils import normalize_choice_label
from apps.serializers.fields import UzPhoneField
from apps.services import create_sale_with_stock, record_credit_charge


class SupplierCatalogItemSerializer(ModelSerializer):
    product_id = IntegerField(read_only=True, allow_null=True)
    default_cost = DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = SupplierCatalogItem
        fields = [
            'id', 'name', 'category', 'default_cost', 'item_type', 'size', 'unit',
            'barcode', 'product', 'product_id',
        ]
        read_only_fields = ['product', 'product_id']


class SupplierSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True, allow_null=True)

    class Meta:
        model = Supplier
        fields = [
            'id', 'branch', 'business_id', 'name', 'phone', 'address',
            'agent_name', 'agent_phone', 'total_orders', 'status', 'catalog',
        ]
        read_only_fields = ['total_orders']

    def validate_status(self, value):
        return normalize_choice_label(
            value, Supplier.Status.choices, "Holat noto'g'ri"
        )


class WarehouseSerializer(ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'branch', 'business_id', 'name']


class InventoryItemSerializer(ModelSerializer):
    product_name = CharField(source="product.name", read_only=True)
    warehouse_name = CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'product', 'product_id', 'warehouse', 'warehouse_id', 'quantity']


class SaleLineSerializer(ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ["id", "product_name", "quantity", "unit_price"]


class SaleSerializer(ModelSerializer):
    lines = SaleLineSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'branch', 'business_id', 'external_id', 'date', 'time',
            'amount', 'method', 'cashier', 'cashier_name', 'items', 'lines',
            'pos_draft_id', 'customer_name', 'customer_phone', 'credit_account_id',
            'create_new_credit_account', 'payment_breakdown',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        pos_draft_id = validated_data.pop('pos_draft_id', None)
        customer_name = (validated_data.pop('customer_name', '') or '').strip()
        customer_phone = validated_data.pop('customer_phone', '') or ''
        credit_account_id = validated_data.pop('credit_account_id', None)
        create_new_credit_account = validated_data.pop('create_new_credit_account', False)
        method = validated_data.get('method', 'Naqd')

        if method == 'Nasiya' and not credit_account_id and not customer_name:
            raise serializers.ValidationError({'customer_name': 'Nasiya uchun mijozni tanlang yoki ismini kiriting'})

        with transaction.atomic():
            sale = create_sale_with_stock(
                validated_data, lines_data, exclude_draft_id=pos_draft_id
            )


class PosCartDraftSerializer(ModelSerializer):
    class Meta:
        model = PosCartDraft
        fields = [
            'id', 'branch', 'business_id', 'customer_name', 'phone', 'balance',
            'transactions',
        ]
        read_only_fields = ['balance']



class PurchaseOrderLineSerializer(ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = ["id", "product", "catalog_item", "name", "quantity", "item_type", "size", "unit", "cost_price"]


class PurchaseOrderSerializer(ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)

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

    def validate_status(self, value):
        return normalize_choice_label(
            value, PurchaseOrder.Status.choices, "Holat noto'g'ri"
        )


class PurchaseReceiveLineSerializer(serializers.Serializer):
    line_id = serializers.IntegerField()
    received_qty = serializers.IntegerField(min_value=0)
    damaged_qty = serializers.IntegerField(min_value=0, required=False, default=0)


class PurchaseReceiveSerializer(serializers.Serializer):
    warehouse = serializers.IntegerField()
    receipt_date = serializers.DateField(required=False)
    lines = PurchaseReceiveLineSerializer(many=True)


class AgentOrderSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)

    class Meta:
        model = AgentOrder
        fields = [
            'id', 'branch', 'business_id', 'agent', 'agent_name',
            'customer_name', 'items', 'total', 'date',
        ]

    def create(self, validated_data):
        agent = validated_data.get('agent')
        if agent and not validated_data.get('agent_name'):
            validated_data['agent_name'] = agent.name
        return super().create(validated_data)


class UserStaffSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    phone = UzPhoneField(read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'first_name', 'last_name',
            'phone', 'role', 'is_active', 'branch', 'branch_name', 'created_at',
        ]
        read_only_fields = fields


class StaffCreateSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)
    name = CharField()
    phone = CharField(required=False, allow_blank=True)
    role = CharField()

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username__iexact=value).exists():
            raise ValidationError('Bu login band')
        return value

    def validate_role(self, value):
        labels = {
            "boss": User.Role.OWNER,
            "owner": User.Role.OWNER,
            "manager": User.Role.MANAGER,
            "cashier": User.Role.CASHIER,
            "kassir": User.Role.CASHIER,
            "admin": User.Role.ADMIN,
        }
        role = labels.get((value or "").strip().casefold())
        if role:
            return role
        allowed_roles = [
            (User.Role.OWNER, "Boss"),
            (User.Role.MANAGER, "Manager"),
            (User.Role.CASHIER, "Cashier"),
        ]
        return normalize_choice_label(value, allowed_roles, "Xodim roli noto'g'ri")

    def validate_phone(self, value):
        from apps.validators.phone import normalize_uz_phone
        try:
            normalized = normalize_uz_phone(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))

        if User.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError("Bu telefon raqamli xodim allaqachon mavjud.")
        return normalized

    def create(self, validated_data):
        import random

        from apps.permission import user_has_global_branch_access

        request = self.context.get('request')
        actor = request.user if request else None
        name = validated_data['name'].strip()
        parts = name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

        branch = actor.branch if actor else None
        if actor and user_has_global_branch_access(actor):
            branch = None

        phone = (validated_data.get('phone') or '').strip()
        if not phone:
            for _ in range(200):
                candidate = str(random.randint(910000000, 919999999))
                if not User.objects.filter(phone=candidate).exists():
                    phone = candidate
                    break
            if not phone:
                raise ValidationError({'phone': 'Telefon raqam yaratib bo\'lmadi'})

        return User.objects.create_user(
            phone=validated_data["phone"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data.get("last_name", ""),
            role=role,
            branch=branch,
        )
