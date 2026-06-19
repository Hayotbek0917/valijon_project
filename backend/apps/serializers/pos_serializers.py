import random
from rest_framework.serializers import ModelSerializer, Serializer
from rest_framework.fields import UUIDField, DecimalField, SerializerMethodField, CharField, IntegerField, DateField

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
    User,
    DebtCustomers,
)
from apps.serializers.choice_utils import normalize_choice_label


class SupplierCatalogItemSerializer(ModelSerializer):
    product_id = IntegerField(read_only=True, allow_null=True)
    default_cost = DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = SupplierCatalogItem
        fields = [
            "id",
            "name",
            "default_cost",
            "item_type",
            "size",
            "unit",
            "barcode",
            "product",
            "product_id",
            "created_at",
        ]
        read_only_fields = ["product", "product_id", "created_at"]


class SupplierSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True, allow_null=True)

    class Meta:
        model = Supplier
        fields = ["id", "name", "phone", "address", "status", "total_orders", "business_id"]


class WarehouseSerializer(ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "branch"]


class InventoryItemSerializer(ModelSerializer):
    product_name = CharField(source="product.name", read_only=True)
    warehouse_name = CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = InventoryItem
        fields = ["id", "product", "product_name", "warehouse", "warehouse_name", "quantity"]


class SaleLineSerializer(ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ["id", "product_name", "quantity", "unit_price"]


class SaleSerializer(ModelSerializer):
    lines = SaleLineSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "branch",
            "external_id",
            "date",
            "time",
            "amount",
            "method",
            "cashier",
            "cashier_name",
            "items",
            "lines",
        ]


class PosCartDraftSerializer(ModelSerializer):
    class Meta:
        model = PosCartDraft
        fields = [
            "id",
            "branch",
            "cashier",
            "label",
            "pay_method",
            "customer_name",
            "items",
            "created_at",
            "updated_at",
        ]


class PurchaseOrderLineSerializer(ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = ["id", "product", "catalog_item", "name", "quantity", "item_type", "size", "unit", "cost_price"]


class PurchaseOrderSerializer(ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "branch",
            "external_id",
            "supplier",
            "supplier_name",
            "date",
            "receipt_date",
            "total",
            "status",
            "lines",
        ]


class PurchaseReceiveLineSerializer(Serializer):
    line_id = UUIDField()
    received_qty = IntegerField(min_value=0)
    selling_price = DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    barcode = CharField(required=False, allow_blank=True, allow_null=True)


class PurchaseReceiveSerializer(Serializer):
    warehouse_id = UUIDField()
    receipt_date = DateField(required=False, allow_null=True)
    lines = PurchaseReceiveLineSerializer(many=True)


class AgentOrderSerializer(ModelSerializer):
    class Meta:
        model = AgentOrder
        fields = ["id", "branch", "supplier", "agent_name", "customer_name", "items", "total", "date"]


class UserStaffSerializer(ModelSerializer):
    branch_name = CharField(source="branch.name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "phone", "first_name", "last_name", "role", "branch", "branch_name", "is_active"]


class CreditAccountSerializer(ModelSerializer):
    phone_display = SerializerMethodField()
    balance = DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = DebtCustomers
        fields = ["id", "customer_name", "phone", "phone_display", "balance"]

    def get_phone_display(self, obj):
        if not obj.phone:
            return ""
        from apps.validators.phone import format_uz_phone_display

        return format_uz_phone_display(obj.phone)


class CreditPaymentSerializer(Serializer):
    amount = DecimalField(max_digits=14, decimal_places=2)
    note = CharField(required=False, allow_blank=True, default="")


# TO'G'RILANDI: O'zgaruvchilar va create mantiqi barqaror holatga keltirildi
class StaffCreateSerializer(Serializer):
    first_name = CharField()
    last_name = CharField()
    phone = CharField(required=False, allow_blank=True)
    password = CharField(write_only=True)
    role = CharField()
    branch = UUIDField(required=False, allow_null=True)

    def validate_role(self, value):
        labels = {
            "boss": User.Role.OWNER,
            "owner": User.Role.OWNER,
            "manager": User.Role.MANAGER,
            "cashier": User.Role.CASHIER,
            "kassir": User.Role.CASHIER,
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

    def create(self, validated_data):
        from apps.models import Branch

        role = validated_data.get("role")
        branch_id = validated_data.get("branch")

        branch = Branch.objects.filter(id=branch_id).first()
        if not branch and role in [User.Role.MANAGER, User.Role.CASHIER]:
            branch = Branch.objects.first()

        # Tasodifiy username yaratish mantiqi
        username = f"user_{random.randint(10000, 99999)}"
        while User.objects.filter(username=username).exists():
            username = f"user_{random.randint(10000, 99999)}"

        return User.objects.create_user(
            username=username,
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            phone=validated_data.get("phone", ""),
            role=role,
            branch=branch,
        )
