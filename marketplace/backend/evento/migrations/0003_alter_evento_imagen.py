# Generated by Django 5.1.6 on 2025-03-15 19:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evento', '0002_alter_evento_categoria_alter_evento_fecha_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='evento',
            name='imagen',
            field=models.URLField(),
        ),
    ]
