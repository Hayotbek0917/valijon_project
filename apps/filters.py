from django_filters import FilterSet, NumberFilter, BooleanFilter

from apps.models import Product


class ProductFilter(FilterSet):
    category = NumberFilter(field_name="category__id")
    min_price = NumberFilter(field_name="selling_price", lookup_expr='gte')
    max_price = NumberFilter(field_name="selling_price", lookup_expr='lte')

    low_stock = BooleanFilter(method='filter_low_stock')

    class Meta:
        model = Product
        fields = ['category', 'min_price', 'max_price', 'low_stock']

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__lte=F('min_stock_alert'))
        return queryset
