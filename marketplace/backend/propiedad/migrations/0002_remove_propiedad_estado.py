# Generated by Django 5.1.6 on 2025-02-25 18:19

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('propiedad', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='propiedad',
            name='estado',
        ),
    ]
