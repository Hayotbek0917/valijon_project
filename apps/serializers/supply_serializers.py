from rest_framework import serializers
from rest_framework.fields import CharField, JSONField
from rest_framework.serializers import ModelSerializer

from apps.models.supply import Supply, SupplyItem

class SupplyItemSerializer(ModelSerializer):
    product_name = CharField(source='product.name', read_only=True)

    class Meta:
        model = SupplyItem
        fields = ['id', 'product', 'product_name', 'quantity', 'buying_price']

class SupplySerializer(ModelSerializer):
    items = SupplyItemSerializer(many=True, read_only=True)
    agent_name = CharField(source='agent.company', read_only=True)
    branch_name = CharField(source='branch.name', read_only=True)

    class Meta:
        model = Supply
        fields = ['id', 'agent', 'agent_name', 'branch', 'branch_name', 'total_amount', 'items', 'created_at']

class SupplyCreateSerializer(ModelSerializer):
    items = JSONField(write_only=True)

    class Meta:
        model = Supply
        fields = ['id', 'agent', 'branch', 'items', 'total_amount', 'created_at']
        read_only_fields = ['total_amount']