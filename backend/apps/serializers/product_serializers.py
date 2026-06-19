from rest_framework import serializers
from rest_framework.fields import CharField, DecimalField, SerializerMethodField, UUIDField
from rest_framework.relations import SlugRelatedField
from rest_framework.serializers import ModelSerializer

from apps.models import Branch, Category, Product
from apps.serializers.choice_utils import normalize_choice_label
from apps.serializers.fields import UzPhoneField


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['created_at']

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
    status = CharField(required=False)
    status_display = CharField(source='get_status_display', read_only=True)
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)
    image_url = SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name',
            'branch', 'business_id', 'selling_price', 'base_price', 'price', 'cost',
            'emoji', 'image', 'image_url', 'profit', 'stock', 'status', 'status_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at', 'image', 'image_url')

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_profit(self, obj):
        if obj.selling_price and obj.base_price:
            return obj.selling_price - obj.base_price
        return 0

    def validate_status(self, value):
        return normalize_choice_label(
            value, Product.Status.choices, "Holat noto'g'ri"
        )

class BranchModelSerializer(ModelSerializer):
    phone = UzPhoneField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')