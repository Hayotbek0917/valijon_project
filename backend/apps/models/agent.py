from django.db.models import Model, CharField, ForeignKey, DecimalField, DateField, CASCADE, SET_NULL

from apps.models.supplier import Supplier
from apps.models.users import Branch


class Agent(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='agents')
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True)
    supplier = ForeignKey(Supplier, on_delete=SET_NULL, null=True, blank=True, related_name='agents')
    supplier_name = CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class AgentOrder(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='agent_orders')
    agent = ForeignKey(Agent, on_delete=CASCADE, related_name='orders')
    agent_name = CharField(max_length=255, blank=True)
    customer_name = CharField(max_length=255)
    items = CharField(max_length=500)
    total = DecimalField(max_digits=14, decimal_places=2)
    date = DateField()

    class Meta:
        ordering = ['-date']
