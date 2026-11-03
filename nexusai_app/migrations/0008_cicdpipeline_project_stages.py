from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('nexusai_app', '0007_delete_architecturedesign'),
    ]

    operations = [
        migrations.AddField(
            model_name='cicdpipeline',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cicd_pipelines', to='nexusai_app.project'),
        ),
        migrations.AddField(
            model_name='cicdpipeline',
            name='stages',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
