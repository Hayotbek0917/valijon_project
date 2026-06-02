from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta

from apps.models.product import Category, Product, Order, Agent, ProductBatch, Expense
from apps.serializers.product_serializers import (
    CategorySerializer, ProductSerializer, AgentSerializer,
    ProductBatchSerializer, ExpenseSerializer, OrderSerializer, OrderCreateSerializer
)

class CategoryModelViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class ProductModelViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'owner'] or not user.branch:
            return Product.objects.all()
        return Product.objects.filter(branch=user.branch)

class DashboardAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        start_of_day = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))

        orders_queryset = Order.objects.all()
        products_queryset = Product.objects.all()

        if user.role in ['manager', 'cashier'] and user.branch:
            orders_queryset = orders_queryset.filter(branch=user.branch)
            products_queryset = products_queryset.filter(branch=user.branch)

        today_stats = orders_queryset.filter(created_at__gte=start_of_day).aggregate(
            total_sales=Sum('total_amount'), total_profit=Sum('total_profit')
        )

        total_products = products_queryset.aggregate(total=Sum('stock'))['total'] or 0
        low_stock_count = products_queryset.filter(stock__lte=F('min_stock_alert')).count()
        expired_count = products_queryset.filter(expiration_date__lt=today).count()

        top_products = products_queryset.order_by('-stock')[:5]
        top_products_data = ProductSerializer(top_products, many=True).data

        seven_days_ago = today - timedelta(days=6)
        weekly_graph = []
        for i in range(7):
            current_day = seven_days_ago + timedelta(days=i)
            day_start = timezone.make_aware(timezone.datetime.combine(current_day, timezone.datetime.min.time()))
            day_end = timezone.make_aware(timezone.datetime.combine(current_day, timezone.datetime.max.time()))
            day_sales = orders_queryset.filter(created_at__range=(day_start, day_end)).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            weekly_graph.append({"date": current_day.strftime("%d %b"), "sales": float(day_sales)})

        ai_insights = []
        if low_stock_count > 0:
            ai_insights.append({"type": "warning", "text": f"{low_stock_count} ta mahsulotning zaxirasi kam qoldi."})
        if expired_count > 0:
            ai_insights.append({"type": "danger", "text": f"Diqqat! {expired_count} ta mahsulotning yaroqlilik muddati o'tgan!"})
        else:
            ai_insights.append({"type": "success", "text": "Hamma mahsulotlar yaroqlilik muddati joyida."})

        return Response({
            "today_sales": today_stats['total_sales'] or 0,
            "today_profit": today_stats['total_profit'] or 0,
            "total_products": total_products,
            "low_stock_products": low_stock_count,
            "expired_products": expired_count,
            "weekly_graph": weekly_graph,
            "top_products": top_products_data,
            "ai_insights": ai_insights
        }, status=status.HTTP_200_OK)

class AgentModelViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all().order_by('-created_at')
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]

class ProductBatchModelViewSet(viewsets.ModelViewSet):
    queryset = ProductBatch.objects.all().select_related('product__category')
    serializer_class = ProductBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        today = timezone.now().date()
        if status_param == 'muddati_otgan': return queryset.filter(expiration_date__lt=today)
        elif status_param == 'diqqat': return queryset.filter(expiration_date__range=(today, today + timedelta(days=15)))
        elif status_param == 'yaxshi': return queryset.filter(expiration_date__gt=today + timedelta(days=15))
        return queryset

class OrderModelViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items__product')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == 'create' else OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'owner'] or not user.branch: return Order.objects.all()
        return Order.objects.filter(branch=user.branch)

class FinancialReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        days_count = int(request.query_params.get('days', 7))
        start_date = today - timedelta(days=days_count - 1)

        orders = Order.objects.filter(created_at__date__range=(start_date, today))
        expenses = Expense.objects.filter(date__range=(start_date, today))
        if user.role in ['manager', 'cashier'] and user.branch:
            orders = orders.filter(branch=user.branch)
            expenses = expenses.filter(branch=user.branch)

        total_sales = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_profit = orders.aggregate(Sum('total_profit'))['total_profit__sum'] or 0
        total_transactions = orders.count()
        avg_order = total_sales / total_transactions if total_transactions > 0 else 0

        chart_data = []
        for i in range(days_count):
            current_day = start_date + timedelta(days=i)
            day_sales = orders.filter(created_at__date=current_day).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            day_profit = orders.filter(created_at__date=current_day).aggregate(Sum('total_profit'))['total_profit__sum'] or 0
            day_expense = expenses.filter(date=current_day).aggregate(Sum('amount'))['amount__sum'] or 0
            chart_data.append({"date": current_day.strftime("%d %b"), "sales": float(day_sales), "profit": float(day_profit), "expense": float(day_expense)})

        from apps.models.product import OrderItem
        category_sales = OrderItem.objects.filter(order__in=orders).values('product__category__name').annotate(total_sum=Sum(F('quantity') * F('selling_price'))).order_by('-total_sum')
        formatted_categories = {item['product__category__name']: float(item['total_sum']) for item in category_sales if item['product__category__name']}

        return Response({
            "total_sales": total_sales, "total_profit": total_profit, "total_transactions": total_transactions,
            "avg_order": round(avg_order, 2), "chart_data": chart_data, "category_sales": formatted_categories
        }, status=status.HTTP_200_OK)