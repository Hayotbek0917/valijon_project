from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.models import Branch
from apps.serializers.product_serializers import BranchModelSerializer


@extend_schema(tags=['Branch'])
class BranchModelViewSet(ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchModelSerializer
    permission_classes = [IsAuthenticated]
