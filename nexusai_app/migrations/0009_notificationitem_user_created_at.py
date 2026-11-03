from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('nexusai_app', '0008_cicdpipeline_project_stages'), ('auth', '0012_alter_user_first_name_max_length')]
    operations = [
        migrations.AddField(model_name='notificationitem', name='user', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='nexus_notifications', to='auth.user')),
        migrations.AddField(model_name='notificationitem', name='created_at', field=models.DateTimeField(auto_now_add=True), preserve_default=False),
    ]
