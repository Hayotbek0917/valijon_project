from django.db.models import Model, CharField, ForeignKey, CASCADE

from apps.models.users import Branch


class Customer(Model):
    branch = ForeignKey(Branch, on_delete=CASCADE, related_name='customers')
    name = CharField(max_length=255)
    phone = CharField(max_length=20, blank=True)
    email = CharField(max_length=254, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
