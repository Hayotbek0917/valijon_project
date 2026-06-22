from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from apps.views import (
    BranchViewSet,
    MarketViewSet,
    AgentViewSet,
    CategoryViewSet,
    ProductViewSet,
    SupplierViewSet,
    WarehouseViewSet,
    InventoryViewSet,
    SaleViewSet,
    PosCartDraftViewSet,
    PurchaseOrderViewSet,
    AgentOrderViewSet,
    DebtCustomersViewSet,
    UserStaffViewSet,
    StaffCreateAPIView,
    LoginView,
    RegisterView,
)

api_router = SimpleRouter(trailing_slash=False)

api_router.register("markets", MarketViewSet, basename="market")
api_router.register("branches", BranchViewSet, basename="branch")
api_router.register("agents", AgentViewSet, basename="agent")

api_router.register("categories", CategoryViewSet, basename="category")
api_router.register("products", ProductViewSet, basename="product")
api_router.register("suppliers", SupplierViewSet, basename="supplier")
api_router.register("warehouses", WarehouseViewSet, basename="warehouse")
api_router.register("inventory", InventoryViewSet, basename="inventory")
api_router.register("sales", SaleViewSet, basename="sale")
api_router.register("pos-drafts", PosCartDraftViewSet, basename="pos-draft")
api_router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
api_router.register("agent-orders", AgentOrderViewSet, basename="agent-order")
api_router.register("credit-accounts", DebtCustomersViewSet, basename="credit-account")
api_router.register("users", UserStaffViewSet, basename="staff-user")


urlpatterns = [
    path("users/create", StaffCreateAPIView.as_view(), name="staff-create"),
    path("", include(api_router.urls)),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/register", RegisterView.as_view(), name="login"),
    path("token", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
]
