from django_filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.models import Category, Product
from apps.serializers import CategorySerializer, ProductSerializer


@extend_schema(tags=["Categories"])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=["Products"])
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "branch", "status"]
    search_fields = ["name", "barcode"]
    ordering_fields = ["created_at", "selling_price"]

    def get_serializer_context(self):
        """Image URL uchun request kontekstini yuborish."""
        return {"request": self.request}
