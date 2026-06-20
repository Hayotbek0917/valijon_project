from datetime import timedelta

from django.db.models import Count, Sum, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.models import Branch, Sale
from apps.permission import user_has_global_branch_access


def _activity_status(last_sale_date, today):
    if not last_sale_date:
        return 'inactive'
    days = (today - last_sale_date).days
    if days <= 7:
        return 'active'
    if days <= 30:
        return 'low'
    return 'inactive'


@extend_schema(tags=['Platform'])
class MagazinStatusAPIView(APIView):
    """Platform egasi — magazinlar faolligi (superadmin)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not user_has_global_branch_access(request.user):
            return Response({'detail': 'Faqat platform egasi'}, status=403)

        today = timezone.localdate()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        branch_qs = Branch.objects.filter(name__startswith='Magazin ').order_by('name')
        rows = []
        for branch in branch_qs:
            sales_qs = Sale.objects.filter(branch=branch)
            last = sales_qs.order_by('-date').values_list('date', flat=True).first()
            today_sales = sales_qs.filter(date=today)
            week_sales = sales_qs.filter(date__gte=week_ago)
            month_sales = sales_qs.filter(date__gte=month_ago)
            code = branch.name.rsplit(' ', 1)[-1].strip()

            rows.append({
                'id': str(branch.id),
                'name': branch.name,
                'store_name': branch.name,
                'store_code': f'm{code}',
                'market': branch.name,
                'status': _activity_status(last, today),
                'branch_count': 1,
                'sales_total': sales_qs.count(),
                'sales_today': today_sales.count(),
                'sales_today_amount': float(today_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'revenue_today': float(today_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'sales_7d': week_sales.count(),
                'sales_7d_amount': float(week_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'revenue_7d': float(week_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'sales_30d': month_sales.count(),
                'sales_30d_amount': float(month_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'revenue_30d': float(month_sales.aggregate(s=Sum('amount'))['s'] or 0),
                'last_sale_date': last.isoformat() if last else None,
            })

        summary = {
            'total': len(rows),
            'active': sum(1 for r in rows if r['status'] == 'active'),
            'low': sum(1 for r in rows if r['status'] == 'low'),
            'inactive': sum(1 for r in rows if r['status'] == 'inactive'),
        }
        return Response({'summary': summary, 'stores': rows, 'magazins': rows})
