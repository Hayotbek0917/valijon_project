
from apps.views.auth_views import RegisterView, LoginView
from apps.views.managment import MarketViewSet, BranchViewSet, AgentViewSet
from apps.views.pos_views import (
    SupplierViewSet,
    WarehouseViewSet,
    InventoryViewSet,
    SaleViewSet,
    PosCartDraftViewSet,
    PurchaseOrderViewSet,
    AgentOrderViewSet,
    UserStaffViewSet,
    DebtCustomersViewSet,
    StaffCreateAPIView,
)
from apps.views.product_views import CategoryViewSet, ProductViewSet