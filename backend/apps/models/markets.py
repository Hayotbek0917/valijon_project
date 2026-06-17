from django.db.models import CharField, TextChoices, Q
from django.db.models.constraints import UniqueConstraint
from apps.models.base_model import CreatedModel, uzbek_phone_validator


class Market(CreatedModel):
    """
    Tizimdagi eng yuqori daraja — bitta biznes/do'kon egasi.
    Bir Market bir nechta Filial(Branch)ga ega bo'lishi mumkin.
    """

    class Status(TextChoices):
        ACTIVE = "active", "Faol"
        INACTIVE = "inactive", "Nofaol"

    name = CharField(max_length=255, unique=True, verbose_name="Market nomi")
    owner_name = CharField(max_length=255, blank=True, default="", verbose_name="Egasi")
    phone = CharField(max_length=20, blank=True, validators=[uzbek_phone_validator])
    address = CharField(max_length=500, blank=True, default="", verbose_name="Manzil")
    status = CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Holat",
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            UniqueConstraint(
                fields=["phone"],
                condition=Q(phone__gt=""),
                name="unique_magazin_phone_when_set",
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    @property
    def branch_count(self):
        return self.branches.count()