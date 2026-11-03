# Generated for project-specific database and ORM designer.
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('nexusai_app', '0003_requirement_source_analysis'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectDatabaseDesign',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(default='Google Gemini', max_length=50)),
                ('model', models.CharField(default='gemini-3.8-flash', max_length=120)),
                ('tables', models.JSONField(default=list)),
                ('django_models', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_database_designs', to=settings.AUTH_USER_MODEL)),
                ('project', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='database_design', to='nexusai_app.project')),
            ],
        ),
    ]
