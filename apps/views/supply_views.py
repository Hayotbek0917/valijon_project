import uuid
from decimal import Decimal

from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.models.product import Product, ProductBatch
from apps.models.supply import Supply, SupplyItem
from apps.serializers.supply_serializers import SupplySerializer, SupplyCreateSerializer


@extend_schema(tags=["Batches (Yuk Partiyalari)"])
class SupplyModelViewSet(ModelViewSet):
    queryset = Supply.objects.all().prefetch_related('items__product')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return SupplyCreateSerializer if self.action == 'create' else SupplySerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        agent = serializer.validated_data.get('agent')
        branch = serializer.validated_data.get('branch')
        items_data = serializer.validated_data.get('items', [])

        if not items_data:
            return Response({"error": "Kamida bitta mahsulot kiritilishi shart."}, status=status.HTTP_400_BAD_REQUEST)

        supply = Supply.objects.create(agent=agent, branch=branch)
        total_amount = Decimal('0.00')

        for item in items_data:
            product_id = item.get('product')
            quantity = int(item.get('quantity', 0))
            buying_price = Decimal(str(item.get('buying_price', 0)))

            try:
                product = Product.objects.select_for_update().get(id=product_id)
            except Product.DoesNotExist:
                return Response({"error": f"ID={product_id} tovar topilmadi."}, status=status.HTTP_400_BAD_REQUEST)

            product.stock += quantity
            product.base_price = buying_price
            product.save()

            SupplyItem.objects.create(
                supply=supply,
                product=product,
                quantity=quantity,
                buying_price=buying_price
            )

            ProductBatch.objects.create(
                product=product,
                batch_number=f"BATCH-{str(uuid.uuid4())[:8].upper()}",
                quantity=quantity,
                expiration_date=product.expiration_date if product.expiration_date else "2027-12-31"
            )

            total_amount += (buying_price * quantity)

        supply.total_amount = total_amount
        supply.save()

        full_supply = Supply.objects.prefetch_related('items__product').get(id=supply.id)
        return Response(SupplySerializer(full_supply).data, status=status.HTTP_201_CREATED)