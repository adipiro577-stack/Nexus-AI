# Adds sprint planning and due dates to project tasks.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("nexusai_app", "0004_projectdatabasedesign"),
    ]

    operations = [
        migrations.AddField(
            model_name="taskitem",
            name="sprint",
            field=models.CharField(blank=True, default="Sprint 1", max_length=100),
        ),
        migrations.AddField(
            model_name="taskitem",
            name="due_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
