# Generated by Django 5.1.6 on 2025-02-26 08:24

import datetime
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuario', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='fecha_de_nacimiento',
            field=models.DateField(help_text='Introduzca su fecha de nacimiento.', validators=[django.core.validators.MinValueValidator(datetime.date(1900, 1, 1)), django.core.validators.MaxValueValidator(datetime.date(2007, 3, 3))]),
        ),
    ]
