from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator, MaxValueValidator, MinValueValidator
from datetime import timedelta, date
from django.utils.timezone import now



class Usuario(models.Model):

    

    usuario = models.OneToOneField(User, on_delete=models.CASCADE)

    dni = models.CharField(max_length=9, validators=[MinLengthValidator(9), MaxLengthValidator(9), RegexValidator(regex=r'^\d{8}[A-Za-z]$')], blank=False, null=False, help_text='Introduzca su DNI.', unique=True)
    telefono = models.CharField(max_length=9, validators=[MinLengthValidator(9), MaxLengthValidator(9)],blank=False, null=False, help_text='Introduzca su número de teléfono.', unique=True)
    direccion = models.CharField(max_length=255, blank=False, null=False, help_text='Introduzca su dirección.')
    biografia = models.TextField(blank=True, null=True, default=None, help_text='Introduzca una breve descripción sobre usted.')

    fecha_limite = date.today() - timedelta(days=365*18)


    fecha_de_nacimiento = models.DateField(blank=False, validators=[MinValueValidator(date(1900,1,1)),MaxValueValidator(fecha_limite)], null=False, help_text='Introduzca su fecha de nacimiento.')



