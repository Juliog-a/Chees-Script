# Generated by Django 5.1.7 on 2025-03-14 17:54

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_remove_trofeo_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='trofeo',
            name='profile',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.profile'),
        ),
    ]
