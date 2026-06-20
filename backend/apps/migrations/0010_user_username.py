from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0009_supplier_agent_sale_breakdown_draft'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(blank=True, max_length=150, null=True, unique=True),
        ),
    ]
