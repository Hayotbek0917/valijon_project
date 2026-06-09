import re

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.fields import UUIDField, SerializerMethodField, DecimalField, CharField
from rest_framework.relations import SlugRelatedField
from rest_framework.serializers import ModelSerializer

from apps.models import Branch, Category, Product


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(ModelSerializer):
    category = SlugRelatedField(
        slug_field='name', queryset=Category.objects.all(),
    )
    category_name = CharField(source='category.name', read_only=True)
    price = DecimalField(
        source='selling_price', max_digits=12, decimal_places=2, required=False,
    )
    cost = DecimalField(
        source='base_price', max_digits=12, decimal_places=2, required=False,
    )
    profit = SerializerMethodField()
    status = SerializerMethodField()
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name',
            'branch', 'business_id', 'selling_price', 'base_price', 'price', 'cost',
            'emoji', 'is_draft', 'profit', 'stock', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at')

    def get_profit(self, obj):
        return obj.profit

    def get_status(self, obj):
        return obj.status


class BranchModelSerializer(ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True}
        }



def validate_phone(self, value):
    if value and not re.match(r'^\+\d{9,15}$', value):
        raise ValidationError(
            "Telefon raqam noto'g'ri formatda. Masalan: +998901234567"
        )
    return value
