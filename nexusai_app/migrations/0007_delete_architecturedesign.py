from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('nexusai_app', '0006_merge_20261102_2114'),
    ]

    operations = [
        migrations.DeleteModel(name='ArchitectureDesign'),
    ]
