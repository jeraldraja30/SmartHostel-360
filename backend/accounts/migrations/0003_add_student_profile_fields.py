# Generated manually — adds full_name, address, phone_number to User model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_hosteler_id_alter_user_role'),
    ]

    operations = [
        # ── New student profile fields ─────────────────────────────────────────
        migrations.AddField(
            model_name='user',
            name='full_name',
            field=models.CharField(
                blank=True,
                max_length=200,
                help_text='Full name of the student. Required for students.',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(
                blank=True,
                help_text='Residential address. Required for students.',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='phone_number',
            field=models.CharField(
                blank=True,
                max_length=15,
                help_text='Mobile/phone number. Required for students.',
            ),
        ),
        # ── Widen hosteler_id field to support longer room-based format ────────
        migrations.AlterField(
            model_name='user',
            name='hosteler_id',
            field=models.CharField(
                blank=True,
                max_length=25,
                help_text='Auto-generated for students: H<year><floor><room><bed> format.',
            ),
        ),
    ]
