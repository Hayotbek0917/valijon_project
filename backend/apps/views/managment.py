from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.models import Market, Branch, Agent
from apps.serializers import MarketSerializer, BranchSerializer, AgentSerializer

@extend_schema(tags=["Management - Markets"])
class MarketViewSet(ModelViewSet):
    queryset = Market.objects.all()
    serializer_class = MarketSerializer
    permission_classes = [IsAuthenticated]

@extend_schema(tags=["Management - Branches"])
class BranchViewSet(ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["market"]

@extend_schema(tags=["Management - Agents"])
class AgentViewSet(ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["branch", "supplier"]