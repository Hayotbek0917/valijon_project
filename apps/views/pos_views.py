from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.models import (
    Category, Product, Supplier, SupplierCatalogItem, Warehouse, InventoryItem,
    Sale, PosCartDraft, PurchaseOrder, Customer, Agent, AgentOrder, User,
)
from apps.serializers.pos_serializers import (
    SupplierSerializer, WarehouseSerializer, InventoryItemSerializer,
    SaleSerializer, PosCartDraftSerializer, PurchaseOrderSerializer, PurchaseReceiveSerializer,
    CustomerSerializer, AgentSerializer, AgentOrderSerializer,
    UserStaffSerializer, StaffCreateSerializer,
)
from apps.serializers.product_serializers import CategorySerializer, ProductSerializer
from apps.services.purchase import receive_purchase_order
from apps.services.catalog import register_catalog_item_as_product


@extend_schema(tags=['Category'])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']


@extend_schema(tags=['Product'])
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related('category', 'branch').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['branch', 'category', 'is_draft']
    search_fields = ['name', 'barcode', 'category__name']
    ordering_fields = ['name', 'stock', 'selling_price']


@extend_schema(tags=['Supplier'])
class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.select_related('branch').prefetch_related('catalog').all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch', 'status']

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {
            'catalog_item_id': {'type': 'integer'},
            'selling_price': {'type': 'number'},
        }}},
        responses=ProductSerializer,
    )
    @action(detail=True, methods=['post'], url_path='register-catalog-product')
    def register_catalog_product(self, request, pk=None):
        supplier = self.get_object()
        catalog_id = request.data.get('catalog_item_id')
        if not catalog_id:
            return Response({'detail': 'catalog_item_id kerak'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            catalog_item = supplier.catalog.get(pk=catalog_id)
        except SupplierCatalogItem.DoesNotExist:
            return Response({'detail': 'Katalog elementi topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        already_linked = bool(catalog_item.product_id)
        product = register_catalog_item_as_product(
            catalog_item,
            supplier.branch,
            selling_price=request.data.get('selling_price'),
        )
        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_200_OK if already_linked else status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Warehouse'])
class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.select_related('branch').all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch']


@extend_schema(tags=['Inventory'])
class InventoryViewSet(ModelViewSet):
    queryset = InventoryItem.objects.select_related('product', 'warehouse').all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['warehouse', 'product']


MAX_POS_DRAFTS = 15


@extend_schema(tags=['POS'])
class PosCartDraftViewSet(ModelViewSet):
    queryset = PosCartDraft.objects.select_related('branch', 'cashier').all()
    serializer_class = PosCartDraftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == User.Role.ADMIN:
            return qs
        return qs.filter(cashier=self.request.user)

    def perform_create(self, serializer):
        branch = serializer.validated_data['branch']
        count = PosCartDraft.objects.filter(
            branch=branch, cashier=self.request.user,
        ).count()
        if count >= MAX_POS_DRAFTS:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {'detail': f'Eng ko\'pi bilan {MAX_POS_DRAFTS} ta chernovik saqlash mumkin'}
            )
        serializer.save(cashier=self.request.user)


@extend_schema(tags=['Sale'])
class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.select_related('branch', 'cashier').prefetch_related('lines').all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch', 'date', 'method']
    search_fields = ['external_id', 'cashier_name']


@extend_schema(tags=['Purchase'])
class PurchaseOrderViewSet(ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'branch').prefetch_related('lines').all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch', 'status', 'supplier']

    @extend_schema(request=PurchaseReceiveSerializer, responses=PurchaseOrderSerializer)
    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status == 'Yetkazilgan':
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


@extend_schema(tags=['Customer'])
class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.select_related('branch').all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch']


@extend_schema(tags=['Agent'])
class AgentViewSet(ModelViewSet):
    queryset = Agent.objects.select_related('supplier', 'branch').all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch', 'supplier']


@extend_schema(tags=['Agent order'])
class AgentOrderViewSet(ModelViewSet):
    queryset = AgentOrder.objects.select_related('agent', 'branch').all()
    serializer_class = AgentOrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['branch', 'agent']


@extend_schema(tags=['Staff'])
class UserStaffViewSet(ModelViewSet):
    queryset = User.objects.select_related('branch').all()
    serializer_class = UserStaffSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'head', 'options']
    filterset_fields = ['role', 'branch', 'is_active']


@extend_schema(tags=['Staff'])
class StaffCreateAPIView(GenericAPIView):
    serializer_class = StaffCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in (User.Role.ADMIN, User.Role.BOSS):
            return Response(
                {'detail': 'Faqat admin yoki boss xodim qo\'sha oladi'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserStaffSerializer(user).data, status=status.HTTP_201_CREATED)
