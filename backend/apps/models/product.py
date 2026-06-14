from django.db.models import CharField, TextChoices, ForeignKey, PROTECT, SET_NULL, DecimalField, ImageField, \
    PositiveIntegerField

from apps.models import TimeStampedModel
from backend.apps.models import BaseModel


class Category(BaseModel):
    name = CharField(max_length=255, unique=True, verbose_name='Kategoriya nomi')

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    class Status(TextChoices):
        AVAILABLE = 'available', 'Mavjud'
        OUT_OF_STOCK = 'out_of_stock', 'Tugagan'
        DRAFT = 'draft', 'Qoralama'

    name = CharField(max_length=255)
    barcode = CharField(max_length=50, unique=True, blank=True, default='', verbose_name='Shtrix-kod')
    category = ForeignKey('apps.Category', PROTECT, related_name='products')
    branch = ForeignKey('apps.Branch', SET_NULL, null=True, blank=True, related_name='products')

    selling_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Sotuv narxi')
    base_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Tannarx')
    emoji = CharField(max_length=16, blank=True, default='📦')
    image = ImageField(upload_to='products/', blank=True, null=True)
    status = CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, verbose_name='Holat')
    stock = PositiveIntegerField(default=0, verbose_name='Qoldiq')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def profit(self):
        return self.selling_price - self.base_price

    @property
    def stock_status(self):
        if self.stock > 0:
            return 'Yetarli'
        return 'Tugagan'