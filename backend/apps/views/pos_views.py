from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

# Modellar real kodingizga asosan tartiblandi
from apps.models import (
    Category, Product, Supplier, Warehouse, InventoryItem,
    Sale, PosCartDraft, PurchaseOrder, AgentOrder, DebtCustomers
)
from apps.paginations import LargePageNumberPagination
from apps.permission import PlatformReadOnlyPermission, user_has_global_branch_access
from apps.serializers.pos_serializers import (
    SupplierSerializer, SupplierCatalogItemSerializer, WarehouseSerializer, InventoryItemSerializer,
    SaleSerializer, PosCartDraftSerializer, PurchaseOrderSerializer, PurchaseReceiveSerializer,
    AgentOrderSerializer,
    UserStaffSerializer, StaffCreateSerializer,
    CreditAccountSerializer, CreditPaymentSerializer,
)
from apps.serializers.product_serializers import CategorySerializer, ProductSerializer, ProductListSerializer
from apps.services.catalog import register_catalog_item_as_product
from apps.services.credit import record_credit_payment


class BranchScopedMixin:
    """Filial bo'yicha filtrlash — ?branch= va platform egasi."""

    @action(detail=True, methods=['post'], serializer_class=CreditPaymentSerializer)
    def pay(self, request, pk=None):
        account = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()

        branch_id = self.request.query_params.get('branch')
        if branch_id and user_has_global_branch_access(user):
            return qs.filter(**{self.branch_field: branch_id})

        if user_has_global_branch_access(user):
            return qs
        if user.branch_id:
            return qs.filter(**{self.branch_field: user.branch_id})
        return qs.none()


# class ReadOnlyPlatformMixin:
#     permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
#         account = record_credit_payment(
#             account=account,
#             amount=serializer.validated_data['amount'],
#             cashier_name=cashier,
#             note=serializer.validated_data.get('note', ''),
#         )
#         account.refresh_from_db()
#         return Response(CreditAccountSerializer(account).data)


@extend_schema(tags=['Categories'])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    search_fields = ['name']



@extend_schema(tags=['Product'])
class ProductViewSet(ReadOnlyPlatformMixin, BranchScopedMixin, ModelViewSet):
    queryset = Product.objects.select_related('category', 'branch').all()
    serializer_class = ProductSerializer
    pagination_class = LargePageNumberPagination
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['branch', 'category']
    search_fields = ['name', 'barcode', 'category__name']
    ordering_fields = ['name', 'stock', 'selling_price']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        inv_total = (
            InventoryItem.objects.filter(product=product).aggregate(total=Sum('quantity'))['total'] or 0
        )
        if inv_total != 0:
            return Response(
                {'detail': 'Faqat qoldiqi 0 ta bo\'lgan mahsulotni o\'chirish mumkin'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


@extend_schema(tags=['Suppliers'])
class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filterset_fields = ['branch', 'status']
    search_fields = ['name', 'phone']


@extend_schema(tags=['Warehouses'])
class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filterset_fields = ['branch']


@extend_schema(tags=['Inventory'])
class InventoryViewSet(ReadOnlyPlatformMixin, ModelViewSet):
    queryset = InventoryItem.objects.select_related('product', 'warehouse').all()
    serializer_class = InventoryItemSerializer
    pagination_class = LargePageNumberPagination
    filterset_fields = ['warehouse', 'product']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        branch_id = self.request.query_params.get('branch')
        if branch_id and user_has_global_branch_access(user):
            return qs.filter(warehouse__branch_id=branch_id)
        if user_has_global_branch_access(user):
            return qs
        if user.branch_id:
            return qs.filter(warehouse__branch_id=user.branch_id)
        return qs.none()


MAX_POS_DRAFTS = 15


@extend_schema(tags=['POS'])
class PosCartDraftViewSet(BranchScopedMixin, ModelViewSet):
    queryset = PosCartDraft.objects.select_related('branch', 'cashier').filter(is_draft=True)
    serializer_class = PosCartDraftSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'product']

    def perform_create(self, serializer):
        branch = serializer.validated_data['branch']
        count = PosCartDraft.objects.filter(branch=branch, cashier=self.request.user, is_draft=True).count()
        if count >= MAX_POS_DRAFTS:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': f'Eng ko\'pi bilan {MAX_POS_DRAFTS} ta chernovik saqlash mumkin'})
        serializer.save(cashier=self.request.user, is_draft=True)


@extend_schema(tags=['Sale'])
class SaleViewSet(ReadOnlyPlatformMixin, BranchScopedMixin, ModelViewSet):
    queryset = Sale.objects.select_related('branch', 'cashier').prefetch_related('lines').all()
    serializer_class = SaleSerializer
    pagination_class = LargePageNumberPagination
    filterset_fields = ['branch', 'date', 'method']
    search_fields = ['external_id', 'cashier_name']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.CASHIER:
            cutoff = timezone.localdate() - timedelta(days=30)
            qs = qs.filter(cashier=user, date__gte=cutoff)
        days = self.request.query_params.get('days')
        if days:
            try:
                cutoff = timezone.localdate() - timedelta(days=max(1, int(days)))
                qs = qs.filter(date__gte=cutoff)
            except (TypeError, ValueError):
                pass
        return qs



@extend_schema(tags=['Purchase Orders'])
class PurchaseOrderViewSet(ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filterset_fields = ['branch', 'status', 'supplier']

    @extend_schema(request=PurchaseReceiveSerializer, responses=PurchaseOrderSerializer)
    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status == PurchaseOrder.Status.DELIVERED:
            return Response({'detail': 'Buyurtma allaqachon qabul qilingan'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PurchaseReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            warehouse = Warehouse.objects.get(pk=data['warehouse'])
        except Warehouse.DoesNotExist:
            return Response({'detail': 'Sklad topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        receive_purchase_order(order, warehouse, data.get('receipt_date'), data['lines'])
        order.refresh_from_db()
        return Response(PurchaseOrderSerializer(order).data)


@extend_schema(tags=['Agent order'])
class AgentOrderViewSet(BranchScopedMixin, ModelViewSet):
    queryset = AgentOrder.objects.select_related('agent', 'branch').all()
    serializer_class = AgentOrderSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filterset_fields = ['branch', 'agent']


@extend_schema(tags=['Credit'])
class CreditAccountViewSet(BranchScopedMixin, ModelViewSet):
    queryset = CreditAccount.objects.select_related('branch').prefetch_related('transactions').all()
    serializer_class = CreditAccountSerializer
    pagination_class = LargePageNumberPagination
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    filterset_fields = ['branch']
    search_fields = ['customer_name', 'phone']
    http_method_names = ['get', 'head', 'options', 'post']

    @extend_schema(request=CreditPaymentSerializer, responses=CreditAccountSerializer)
    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        account = self.get_object()
        serializer = CreditPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cashier = request.user.full_name or request.user.username
        record_credit_payment(
            account,
            serializer.validated_data['amount'],
            cashier_name=cashier,
            note=serializer.validated_data.get('note', ''),
        )
        account.refresh_from_db()
        return Response(CreditAccountSerializer(account).data)


@extend_schema(tags=['Staff'])
class UserStaffViewSet(ModelViewSet):
    queryset = User.objects.select_related('branch').all()
    serializer_class = UserStaffSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]
    http_method_names = ['get', 'head', 'options']
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'branch', 'is_active']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        branch_id = self.request.query_params.get('branch')
        if user_has_global_branch_access(user):
            if branch_id:
                return qs.filter(branch_id=branch_id)
            return qs.none()
        if user.branch_id:
            return qs.filter(branch_id=user.branch_id)
        return qs.filter(pk=user.pk)


@extend_schema(tags=['Staff'])
class StaffCreateAPIView(GenericAPIView):
    serializer_class = StaffCreateSerializer
    permission_classes = [IsAuthenticated, PlatformReadOnlyPermission]

    def post(self, request):
        if user_has_global_branch_access(request.user):
            return Response(
                {'detail': 'Platform egasi xodim qo\'sha olmaydi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.user.role not in (User.Role.ADMIN, User.Role.OWNER, User.Role.BOSS):
            return Response(
                {'detail': 'Faqat admin yoki boss xodim qo\'sha oladi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not request.user.branch_id:
            return Response(
                {'detail': 'Filial tanlanmagan'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Xodim muvaffaqiyatli yaratildi"}, status=status.HTTP_201_CREATED)

