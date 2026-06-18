from django.db.models import CharField, DateField, DecimalField

from backend.apps.models.base_model import TimeStampedModel, branch_foreign_key, supplier_foreign_key


class AgentOrder(TimeStampedModel):
    """Agent orqali kelgan buyurtma —  dilerga bog'langan."""

    branch = branch_foreign_key('agent_orders', verbose_name='Filial')
    supplier = supplier_foreign_key('agent_orders', verbose_name='Diler')
    agent_name = CharField(max_length=50, blank=True, verbose_name='Agent ismi')
    customer_name = CharField(max_length=50, verbose_name='Mijoz ismi')
    items = CharField(max_length=500, verbose_name='Mahsulotlar')
    total = DecimalField(max_digits=14, decimal_places=2, verbose_name='Jami summa')
    date = DateField(verbose_name='Sana')

    class Meta:
        verbose_name = 'Agent buyurtmasi'
        verbose_name_plural = 'Agent buyurtmalari'
        ordering = ['-date']

    def __str__(self):
        return f'{self.agent_name} — {self.customer_name}'
