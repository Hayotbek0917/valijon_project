import re

from rest_framework import serializers
from apps.models import Branch, Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field='name', queryset=Category.objects.all(),
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    price = serializers.DecimalField(
        source='selling_price', max_digits=12, decimal_places=2, required=False,
    )
    cost = serializers.DecimalField(
        source='base_price', max_digits=12, decimal_places=2, required=False,
    )
    profit = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_draft = serializers.SerializerMethodField()
    business_id = serializers.UUIDField(source='branch_id', read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name',
            'branch', 'business_id', 'selling_price', 'base_price', 'price', 'cost',
            'emoji', 'image', 'image_url', 'is_draft', 'profit', 'stock',
            'status', 'status_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at', 'image')

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_profit(self, obj):
        return obj.profit

    def get_is_draft(self, obj):
        return obj.status == Product.Status.DRAFT


class BranchModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True}
        }

    def validate_phone(self, value):
        if value and not re.fullmatch(r'\d{9}', value):
            raise serializers.ValidationError(
                "Telefon raqam 901234567 formatida bo'lishi kerak (9 ta raqam, '+' va boshqa belgilarsiz)."
            )
        return value
