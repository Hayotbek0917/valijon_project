from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0006_creditaccount_credittransaction'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='creditaccount',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='creditaccount',
            constraint=models.UniqueConstraint(
                fields=('branch', 'phone'),
                condition=models.Q(phone__gt=''),
                name='unique_branch_phone_when_set',
            ),
        ),
    ]
