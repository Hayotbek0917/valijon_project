from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0004_poscartdraft'),
    ]

    operations = [
        migrations.AddField(
            model_name='suppliercatalogitem',
            name='barcode',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
