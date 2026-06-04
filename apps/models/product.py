from django.db.models import PROTECT, SET_NULL, CASCADE, ForeignKey, CharField, DecimalField, \
    DateField, functions, PositiveIntegerField, DateTimeField

from apps.models import BaseModel
from apps.models import TimeStampedModel


class Category(BaseModel):
    name = CharField(max_length=255, unique=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    branch = ForeignKey('apps.Branch', CASCADE, related_name='products', verbose_name="Filial")
    category = ForeignKey(Category, PROTECT, related_name='products', verbose_name="Kategoriya")
    name = CharField(max_length=255, verbose_name="Mahsulot nomi")
    barcode = CharField(max_length=50, unique=True, verbose_name="Shtrix kod / Barcode")
    selling_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Sotish narxi")
    base_price = DecimalField(max_digits=12, decimal_places=2, verbose_name="Tannarxi")
    stock = PositiveIntegerField(default=0, verbose_name="Skladdagi qoldiq")
    min_stock_alert = PositiveIntegerField(default=10, verbose_name="Minimal qoldiq (Ogohlantirish)")
    expiration_date = DateField(null=True, blank=True, verbose_name="Yaroqlilik muddati")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.branch.name if self.branch else 'Filialsiz'}"

    @property
    def is_low_stock(self):
        return self.stock <= self.min_stock_alert


class Order(BaseModel):
    branch = ForeignKey('apps.Branch', CASCADE, related_name='orders')
    cashier = ForeignKey('apps.User', SET_NULL, null=True, related_name='orders')
    total_amount = DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_profit = DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Buyurtma #{str(self.id)[:8]} ({self.branch.name if self.branch else 'Filialsiz'})"


class OrderItem(BaseModel):
    order = ForeignKey(Order, CASCADE, related_name='items')
    product = ForeignKey(Product, CASCADE, related_name='order_items')
    quantity = PositiveIntegerField(default=1)
    selling_price = DecimalField(max_digits=12, decimal_places=2)
    profit = DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.profit = (self.selling_price - self.product.base_price) * self.quantity
        super().save(*args, **kwargs)


class ProductBatch(BaseModel):
    product = ForeignKey(Product, CASCADE, related_name='batches')
    batch_number = CharField(max_length=50, verbose_name="Partiya raqami")
    quantity = PositiveIntegerField(verbose_name="Miqdor")
    expiration_date = DateField(verbose_name="Yaroqlilik muddati")
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def days_left(self):
        from django.utils import timezone
        today = timezone.now().date()
        return (self.expiration_date - today).days

    @property
    def status(self):
        days = self.days_left
        if days < 0:
            return "muddati_otgan"
        elif days <= 15:
            return "diqqat"
        return "yaxshi"


class Expense(BaseModel):
    branch = ForeignKey('apps.Branch', CASCADE, related_name='expenses')
    title = CharField(max_length=255, verbose_name="Xarajat maqsadi")
    amount = DecimalField(max_digits=12, decimal_places=2, verbose_name="Xarajat summasi")
    date = DateField(default=functions.Now, verbose_name="Xarajat sanasi")

    class Meta:
        ordering = ["-created_at"]
