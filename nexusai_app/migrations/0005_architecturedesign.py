from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("nexusai_app", "0004_projectdatabasedesign"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ArchitectureDesign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("architecture_type", models.CharField(choices=[("microservices", "Microservices"), ("layered", "Layered / Monolithic")], default="microservices", max_length=30)),
                ("nodes", models.JSONField(default=list)),
                ("connections", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="architecture_designs", to="nexusai_app.project")),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
    ]
