from rest_framework import serializers
from rest_framework.fields import CharField, JSONField, IntegerField, BooleanField
from rest_framework.serializers import ModelSerializer

from apps.models import Category, Product, Order, OrderItem, Agent, ProductBatch, Expense


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(ModelSerializer):
    category_name = CharField(source='category.name', read_only=True)
    branch_name = CharField(source='branch.name', read_only=True)
    is_low_stock = BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'branch', 'branch_name', 'category', 'category_name', 'name', 'barcode', 'selling_price',
                  'base_price', 'stock', 'min_stock_alert', 'expiration_date', 'is_low_stock']


class AgentSerializer(ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name', 'company', 'phone', 'created_at']


class ProductBatchSerializer(ModelSerializer):
    product_name = CharField(source='product.name', read_only=True)
    category_name = CharField(source='product.category.name', read_only=True)
    days_left = IntegerField(read_only=True)
    status = CharField(read_only=True)

    class Meta:
        model = ProductBatch
        fields = ['id', 'product', 'product_name', 'category_name', 'batch_number', 'quantity', 'expiration_date',
                  'days_left', 'status']


class ExpenseSerializer(ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'branch', 'title', 'amount', 'date']


class OrderItemSerializer(ModelSerializer):
    product_name = CharField(source='product.name', read_only=True)
    barcode = CharField(source='product.barcode', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'barcode', 'quantity', 'selling_price', 'profit']


class OrderSerializer(ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    cashier_name = CharField(source='cashier.full_name', read_only=True)
    branch_name = CharField(source='branch.name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'branch', 'branch_name', 'cashier', 'cashier_name', 'total_amount', 'total_profit', 'items',
                  'created_at']


class OrderCreateSerializer(ModelSerializer):
    items = JSONField(write_only=True)

    class Meta:
        model = Order
        fields = ['id', 'branch', 'items', 'total_amount', 'total_profit', 'created_at']
        read_only_fields = ['total_amount', 'total_profit']

    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Telefon raqam xalqaro formatda bo'lishi shart (Masalan: +998...)")
        return value
