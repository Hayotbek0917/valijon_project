from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    BranchModelViewSet,
    CategoryViewSet,
    ProductViewSet,
    SupplierViewSet,
    WarehouseViewSet,
    InventoryViewSet,
    SaleViewSet,
    PosCartDraftViewSet,
    PurchaseOrderViewSet,
    CustomerViewSet,
    AgentViewSet,
    AgentOrderViewSet,
    CreditAccountViewSet,
    UserStaffViewSet,
    StaffCreateAPIView,
    RegisterView,
    LoginView,
)

router = SimpleRouter(trailing_slash=False)
router.register("branches", BranchModelViewSet, basename="branch")
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("warehouses", WarehouseViewSet, basename="warehouse")
router.register("inventory", InventoryViewSet, basename="inventory")
router.register("sales", SaleViewSet, basename="sale")
router.register("pos-drafts", PosCartDraftViewSet, basename="pos-draft")
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register("customers", CustomerViewSet, basename="customer")
router.register("agents", AgentViewSet, basename="agent")
router.register("agent-orders", AgentOrderViewSet, basename="agent-order")
router.register("credit-accounts", CreditAccountViewSet, basename="credit-account")
router.register("users", UserStaffViewSet, basename="staff-user")

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("users/create", StaffCreateAPIView.as_view(), name="staff-create"),
    path("", include(router.urls)),
    path("token", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
]
