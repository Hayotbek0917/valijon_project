from apps.serializers.managment import MarketSerializer, BranchSerializer, AgentSerializer
from apps.serializers.product_serializers import ProductSerializer, CategorySerializer

from apps.serializers.auth_serializers import RegisterModelSerializer, LoginModelSerializer

from apps.serializers.pos_serializers import (
    DebtCustomersSerializer,
    CreditPaymentSerializer,
    SupplierSerializer,
    WarehouseSerializer,
    InventoryItemSerializer,
    SaleSerializer,
    PosCartDraftSerializer,
    PurchaseOrderSerializer,
    AgentOrderSerializer,
    UserStaffSerializer,
    StaffCreateSerializer,
)

