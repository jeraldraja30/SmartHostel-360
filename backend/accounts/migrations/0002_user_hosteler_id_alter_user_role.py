# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='hosteler_id',
            field=models.CharField(blank=True, help_text='Auto-generated for students: H2026001 format. Leave blank for wardens/admins.', max_length=20),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('student', 'Student'), ('warden', 'Warden'), ('admin', 'Admin')], default='student', max_length=10),
        ),
    ]
