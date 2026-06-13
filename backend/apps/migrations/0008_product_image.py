from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0007_creditaccount_allow_duplicate_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='products/'),
        ),
    ]
