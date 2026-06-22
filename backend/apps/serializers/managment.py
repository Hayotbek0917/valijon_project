from rest_framework import serializers
from apps.models import Market, Branch, Agent

class MarketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Market
        fields = ["id", "name", "owner_name", "phone", "address", "status", "branch_count"]
        read_only_fields = ["branch_count"]

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "market", "name", "address", "phone"]

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "name", "phone", "supplier", "branch"]