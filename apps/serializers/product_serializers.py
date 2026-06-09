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
    status = serializers.SerializerMethodField()
    business_id = serializers.UUIDField(source='branch_id', read_only=True, allow_null=True)

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


class BranchModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True}
        }

    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Telefon raqam xalqaro formatda bo'lishi shart (Masalan: +998...)")
        return value
