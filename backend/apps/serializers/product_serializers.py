from rest_framework.fields import CharField, DecimalField, SerializerMethodField, UUIDField, IntegerField
from rest_framework.relations import SlugRelatedField
from rest_framework.serializers import ModelSerializer

from apps.models import Category, Product
from apps.serializers.choice_utils import normalize_choice_label
from apps.serializers.fields import UzPhoneField


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductListSerializer(serializers.ModelSerializer):
    """Ro'yxat — yengil (rasm URL va qo'shimcha hisoblar yo'q)."""

    category = serializers.CharField(source='category.name', read_only=True)
    price = serializers.DecimalField(
        source='selling_price', max_digits=12, decimal_places=2, read_only=True,
    )
    cost = serializers.DecimalField(
        source='base_price', max_digits=12, decimal_places=2, read_only=True,
    )
    business_id = serializers.UUIDField(source='branch_id', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'branch', 'business_id',
            'selling_price', 'base_price', 'price', 'cost', 'emoji', 'stock',
        ]


class ProductSerializer(serializers.ModelSerializer):
    """Mahsulot API — is_draft Product da emas, faqat PosCartDraft da."""

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
    status = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    is_draft = serializers.SerializerMethodField()
    business_id = serializers.UUIDField(source='branch_id', read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name',
            'branch', 'business_id', 'selling_price', 'base_price', 'price', 'cost',
            'emoji', 'image', 'image_url', 'profit', 'stock', 'status', 'status_display',
            'is_draft', 'created_at', 'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at', 'image_url')

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_profit(self, obj):
        return obj.profit

    def get_status(self, obj):
        if obj.is_draft:
            return Product.Status.DRAFT
        if obj.stock <= 0:
            return Product.Status.OUT_OF_STOCK
        return Product.Status.AVAILABLE

    def get_status_display(self, obj):
        labels = dict(Product.Status.choices)
        return labels.get(self.get_status(obj), '')

    def get_is_draft(self, obj):
        return getattr(obj, 'is_draft', False)

    def validate_is_draft(self, value):
        return bool(value)


class BranchModelSerializer(serializers.ModelSerializer):
    phone = UzPhoneField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True},
        }
