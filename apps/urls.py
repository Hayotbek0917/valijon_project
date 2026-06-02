from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from apps.views import (
    BranchModelViewSet, RegisterModelViewSet, LoginAPIView, UserViewSet,
    CategoryModelViewSet, ProductModelViewSet, DashboardAnalyticsAPIView,
    OrderModelViewSet, AgentModelViewSet, ProductBatchModelViewSet, FinancialReportAPIView
)

api_router = SimpleRouter(trailing_slash=False)
api_router.register('branch', BranchModelViewSet)
api_router.register('users', UserViewSet, basename='users')
api_router.register('categories', CategoryModelViewSet, basename='categories')
api_router.register('products', ProductModelViewSet, basename='products')
api_router.register('orders', OrderModelViewSet, basename='orders')
api_router.register('agents', AgentModelViewSet, basename='agents')
api_router.register('batches', ProductBatchModelViewSet, basename='batches')

auth_router = SimpleRouter(trailing_slash=False)
auth_router.register('register', RegisterModelViewSet, basename='auth-register')

urlpatterns = [
    path('api/v1/', include([
        path('', include(api_router.urls)),
        path('dashboard/analytics', DashboardAnalyticsAPIView.as_view(), name='dashboard-analytics'),
        path('reports/financial', FinancialReportAPIView.as_view(), name='financial-report'),
        path('token', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    path('auth/', include([
        path('', include(auth_router.urls)),
        path('login/', LoginAPIView.as_view()),
    ]))
]