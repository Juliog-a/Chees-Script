# Generated by Django 5.1.7 on 2025-03-12 17:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_trofeo_desafios_desbloqueantes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trofeo',
            name='desbloqueo_por_nivel',
            field=models.BooleanField(default=False, null=True),
        ),
    ]
