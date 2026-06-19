
# Dinamik User modelini olish
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

# Modellar real kodingizga asosan tartiblandi
from apps.models import (
    Category, Product, Supplier, Warehouse, InventoryItem,
    Sale, PosCartDraft, PurchaseOrder, AgentOrder, DebtCustomers
)
from serializers import ProductSerializer

User = get_user_model()

# Serializerlar import qismi
from apps.serializers.pos_serializers import (
    SupplierSerializer, WarehouseSerializer, InventoryItemSerializer,
    SaleSerializer, PosCartDraftSerializer, PurchaseOrderSerializer,
    AgentOrderSerializer, UserStaffSerializer, StaffCreateSerializer,
    CreditAccountSerializer, CreditPaymentSerializer,)
from apps.services.credit import record_credit_payment


@extend_schema(tags=['Credit Accounts'])
class CreditAccountViewSet(ModelViewSet):
    queryset = DebtCustomers.objects.all()
    serializer_class = CreditAccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['branch']
    search_fields = ['customer_name', 'phone']

    @action(detail=True, methods=['post'], serializer_class=CreditPaymentSerializer)
    def pay(self, request, pk=None):
        account = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cashier = request.user.first_name or request.user.phone

        account = record_credit_payment(
            account=account,
            amount=serializer.validated_data['amount'],
            cashier_name=cashier,
            note=serializer.validated_data.get('note', ''),
        )
        account.refresh_from_db()
        return Response(CreditAccountSerializer(account).data)


@extend_schema(tags=['Categories'])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer # Endi NameError xatosi bermaydi
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name']


@extend_schema(tags=['Products'])
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'branch', 'status']
    search_fields = ['name', 'barcode']


@extend_schema(tags=['Suppliers'])
class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['branch', 'status']
    search_fields = ['name', 'phone']


@extend_schema(tags=['Warehouses'])
class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch']


@extend_schema(tags=['Inventory'])
class InventoryViewSet(ModelViewSet):
    queryset = InventoryItem.objects.select_related('product', 'warehouse').all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'product']


@extend_schema(tags=['Sales'])
class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['branch', 'method', 'cashier']


@extend_schema(tags=['POS Cart Drafts'])
class PosCartDraftViewSet(ModelViewSet):
    queryset = PosCartDraft.objects.all()
    serializer_class = PosCartDraftSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Purchase Orders'])
class PurchaseOrderViewSet(ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'supplier', 'status']


@extend_schema(tags=['Agent Orders'])
class AgentOrderViewSet(ModelViewSet):
    queryset = AgentOrder.objects.all()
    serializer_class = AgentOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'supplier']


@extend_schema(tags=['Staff'])
class UserStaffViewSet(ModelViewSet):
    queryset = User.objects.select_related('branch').all()
    serializer_class = UserStaffSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'head', 'options']
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'branch', 'is_active']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.OWNER or user.is_superuser:
            return qs
        if user.branch_id:
            return qs.filter(branch_id=user.branch_id)
        return qs.filter(pk=user.pk)


@extend_schema(tags=['Staff'])
class StaffCreateAPIView(GenericAPIView):
    serializer_class = StaffCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in (User.Role.OWNER,):
            if not request.user.is_superuser:
                return Response(
                    {'detail': "Faqat admin yoki boss xodim qo'sha oladi"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Xodim muvaffaqiyatli yaratildi"}, status=status.HTTP_201_CREATED)

