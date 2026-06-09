import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0003_supplier_catalog'),
    ]

    operations = [
        migrations.CreateModel(
            name='PosCartDraft',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=120)),
                ('pay_method', models.CharField(default='Naqd', max_length=50)),
                ('items', models.JSONField(default=list)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pos_cart_drafts', to='apps.branch')),
                ('cashier', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pos_cart_drafts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
    ]
