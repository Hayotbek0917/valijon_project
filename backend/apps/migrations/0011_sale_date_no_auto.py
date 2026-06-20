from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0010_user_username'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sale',
            name='date',
            field=models.DateField(verbose_name='Sana'),
        ),
    ]
