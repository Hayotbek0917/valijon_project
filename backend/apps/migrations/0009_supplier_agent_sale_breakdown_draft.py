# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0008_product_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplier',
            name='agent_name',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Agent ismi'),
        ),
        migrations.AddField(
            model_name='supplier',
            name='agent_phone',
            field=models.CharField(blank=True, default='', max_length=20, verbose_name='Agent telefoni'),
        ),
        migrations.AddField(
            model_name='sale',
            name='payment_breakdown',
            field=models.JSONField(blank=True, default=dict, verbose_name="Aralash to'lov"),
        ),
        migrations.AddField(
            model_name='poscartdraft',
            name='is_draft',
            field=models.BooleanField(default=True, verbose_name='Qoralama'),
        ),
    ]
