# Generated manually for credit ledger

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0005_suppliercatalogitem_barcode'),
    ]

    operations = [
        migrations.CreateModel(
            name='CreditAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(max_length=255)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('balance', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='credit_accounts', to='apps.branch')),
            ],
            options={
                'ordering': ['customer_name'],
                'unique_together': {('branch', 'customer_name')},
            },
        ),
        migrations.CreateModel(
            name='CreditTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('charge', 'Qarz'), ('payment', "To'lov")], max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14)),
                ('note', models.CharField(blank=True, max_length=500)),
                ('cashier_name', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='apps.creditaccount')),
                ('sale', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='credit_transactions', to='apps.sale')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
