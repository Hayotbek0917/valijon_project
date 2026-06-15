import random

from rest_framework.serializers import ModelSerializer, Serializer, ValidationError
from rest_framework.fields import (
    UUIDField,
    DecimalField,
    SerializerMethodField,
    CharField,
    BooleanField,
    IntegerField,
    DateField,
    ChoiceField,
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
    Customer,
    Agent,
    AgentOrder,
    User,
    DebtCustomers,
    CreditTransaction,
    Branch,
)
from apps.services import create_sale_with_stock, record_credit_charge




class SupplierCatalogItemSerializer(ModelSerializer):
    product_id = UUIDField(read_only=True, allow_null=True)
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
        ]
        read_only_fields = ["product", "product_id"]


class SupplierSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)
    catalog = SupplierCatalogItemSerializer(many=True, required=False)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "branch",
            "business_id",
            "name",
            "phone",
            "address",
            "total_orders",
            "status",
            "catalog",
        ]

    def create(self, validated_data):
        catalog_data = validated_data.pop("catalog", [])
        supplier = Supplier.objects.create(**validated_data)
        for item in catalog_data:
            SupplierCatalogItem.objects.create(supplier=supplier, **item)
        return supplier


class WarehouseSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)

    class Meta:
        model = Warehouse
        fields = ["id", "branch", "business_id", "name"]


class InventoryItemSerializer(ModelSerializer):
    product_id = UUIDField(read_only=True)
    warehouse_id = UUIDField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "product",
            "product_id",
            "warehouse",
            "warehouse_id",
            "quantity",
        ]


class SaleLineSerializer(ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ["id", "product_name", "quantity", "unit_price"]


class PosCartDraftSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)
    cashier_id = UUIDField(read_only=True)
    item_count = SerializerMethodField()

    class Meta:
        model = PosCartDraft
        fields = [
            "id",
            "branch",
            "business_id",
            "cashier",
            "cashier_id",
            "label",
            "pay_method",
            "items",
            "total",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["cashier", "cashier_id", "created_at", "updated_at"]

    def get_item_count(self, obj):
        return sum(int(i.get("qty", 0)) for i in (obj.items or []))

    def validate_items(self, value):
        if not value:
            raise ValidationError("Savat bo'sh bo'lishi mumkin emas")
        return value

    def validate(self, attrs):
        from apps.services.stock import get_available_qty

        branch = attrs.get("branch")
        if not branch:
            return attrs
        for item in attrs.get("items") or []:
            pid = item.get("id")
            if pid is None:
                continue
            qty = int(item.get("qty") or 0)
            available = get_available_qty(branch.id, int(pid))
            if qty > available:
                name = item.get("name") or f"#{pid}"
                raise ValidationError(
                    {
                        "items": (
                            f'"{name}" uchun skladda faqat {available} ta mavjud '
                            f"({qty} ta saqlab bo'lmaydi — boshqa navbatda band)."
                        ),
                    }
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        branch = validated_data["branch"]
        if not validated_data.get("label"):
            n = PosCartDraft.objects.filter(branch=branch, cashier=user).count() + 1
            validated_data["label"] = f"Navbat #{n}"
        validated_data["cashier"] = user
        return super().create(validated_data)


class SaleSerializer(ModelSerializer):
    lines = SaleLineSerializer(many=True, required=False)
    business_id = UUIDField(source="branch_id", read_only=True)
    pos_draft_id = UUIDField(required=False, allow_null=True, write_only=True)
    customer_name = CharField(required=False, allow_blank=True, write_only=True)
    customer_phone = CharField(required=False, allow_blank=True, write_only=True)
    credit_account_id = UUIDField(required=False, allow_null=True, write_only=True)
    create_new_credit_account = BooleanField(
        required=False, default=False, write_only=True
    )

    class Meta:
        model = Sale
        fields = [
            "id",
            "branch",
            "business_id",
            "external_id",
            "date",
            "time",
            "amount",
            "method",
            "cashier",
            "cashier_name",
            "items",
            "lines",
            "pos_draft_id",
            "customer_name",
            "customer_phone",
            "credit_account_id",
            "create_new_credit_account",
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        pos_draft_id = validated_data.pop("pos_draft_id", None)
        customer_name = (validated_data.pop("customer_name", "") or "").strip()
        customer_phone = (validated_data.pop("customer_phone", "") or "").strip()
        credit_account_id = validated_data.pop("credit_account_id", None)
        create_new_credit_account = validated_data.pop(
            "create_new_credit_account", False
        )
        method = validated_data.get("method", Sale.PayMethod.CASH)

        if (
            method == Sale.PayMethod.CASH
            and not credit_account_id
            and not customer_name
        ):
            pass

        sale = create_sale_with_stock(
            validated_data, lines_data, exclude_draft_id=pos_draft_id
        )

        if method == "Nasiya":
            record_credit_charge(
                sale.branch,
                sale.amount,
                sale=sale,
                cashier_name=sale.cashier_name or "",
                account_id=credit_account_id,
                customer_name=customer_name,
                phone=customer_phone,
                force_new=bool(create_new_credit_account),
            )

        return sale


class CreditTransactionSerializer(ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ["id", "kind", "amount", "note", "cashier_name", "created_at", "sale"]


class DebtCustomersSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)
    transactions = CreditTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = DebtCustomers
        fields = [
            "id",
            "branch",
            "business_id",
            "customer_name",
            "phone",
            "balance",
            "transactions",
        ]


class CreditPaymentSerializer(Serializer):
    amount = DecimalField(max_digits=14, decimal_places=2)
    note = CharField(required=False, allow_blank=True, default="")


class PurchaseOrderLineSerializer(ModelSerializer):
    product_id = UUIDField(allow_null=True, required=False)
    catalog_item_id = UUIDField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            "id",
            "product",
            "product_id",
            "catalog_item",
            "catalog_item_id",
            "name",
            "quantity",
            "item_type",
            "size",
            "unit",
            "cost_price",
        ]


class PurchaseOrderSerializer(ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, required=False)
    business_id = UUIDField(source="branch_id", read_only=True)
    supplier_id = UUIDField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "branch",
            "business_id",
            "external_id",
            "supplier",
            "supplier_id",
            "supplier_name",
            "date",
            "receipt_date",
            "total",
            "status",
            "lines",
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        order = PurchaseOrder.objects.create(**validated_data)
        for line in lines_data:
            PurchaseOrderLine.objects.create(order=order, **line)
        return order


class PurchaseReceiveLineSerializer(Serializer):
    line_id = UUIDField()
    received_qty = IntegerField(min_value=0)
    damaged_qty = IntegerField(min_value=0, required=False, default=0)


class PurchaseReceiveSerializer(Serializer):
    warehouse = UUIDField()
    receipt_date = DateField(required=False)
    lines = PurchaseReceiveLineSerializer(many=True)


class CustomerSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)

    class Meta:
        model = Customer
        fields = ["id", "branch", "business_id", "name", "phone"]


class AgentSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)
    supplier_id = UUIDField(allow_null=True, required=False)

    class Meta:
        model = Agent
        fields = [
            "id",
            "branch",
            "business_id",
            "name",
            "phone",
            "supplier",
            "supplier_id",
        ]

    def create(self, validated_data):
        supplier = validated_data.get("supplier")
        if supplier and not validated_data.get("supplier_name"):
            validated_data["supplier_name"] = supplier.name
        return super().create(validated_data)


class AgentOrderSerializer(ModelSerializer):
    business_id = UUIDField(source="branch_id", read_only=True)
    agent_id = UUIDField(read_only=True)

    class Meta:
        model = AgentOrder
        fields = [
            "id",
            "branch",
            "business_id",
            "agent",
            "agent_id",
            "agent_name",
            "customer_name",
            "items",
            "total",
            "date",
            "status",
        ]

    def create(self, validated_data):
        agent = validated_data.get("agent")
        if agent and not validated_data.get("agent_name"):
            validated_data["agent_name"] = agent.name
        return super().create(validated_data)


class UserStaffSerializer(ModelSerializer):
    name = CharField(source="full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "first_name",
            "last_name",
            "phone",
            "email",
            "role",
            "is_active",
            "branch",
        ]
        read_only_fields = fields


class StaffCreateSerializer(Serializer):
    first_name = CharField()
    last_name = CharField()
    phone = CharField(required=False, allow_blank=True)
    password = CharField(write_only=True)
    role = ChoiceField(choices=["boss", "manager", "cashier"])
    branch = UUIDField(required=False, allow_null=True)

    def create(self, validated_data):
        role = validated_data["role"]
        branch_id = validated_data.pop("branch", None)

        branch = Branch.objects.filter(id=branch_id).first()
        if not branch and role in ["manager", "cashier"]:
            branch = Branch.objects.first()

        phone = (
            validated_data.pop("phone", "").strip()
            or f"90{random.randint(1000000, 9999999)}"
        )

        return User.objects.create_user(
            phone=phone,
            password=validated_data["password"],
            first_name=validated_data["first_name"].strip(),
            last_name=validated_data["last_name"].strip(),
            role=role,
            branch=branch,
        )
