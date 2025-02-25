from django.db import models
from django.contrib.auth.models import User
from usuario.models.valoracionUsuario import ValoracionUsuario
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


    foto_de_perfil = models.ImageField(upload_to='fotos_de_perfil/', blank=True, null=True, default=None, help_text='Suba una foto de perfil.')

    # Características
    valoraciones_usuario = models.FloatField(default=0, help_text='Valoración promedio del usuario por sus interacciones.')
    numero_de_resenas = models.PositiveIntegerField(default=0, help_text='Número de valoraciones recibidas por el usuario.')

    # def valoracion_promedio_usuario(self):
    #     valoraciones_recibidas = ValoracionUsuario.objects.filter(usuario_valorado=self.usuario.id)
    #     if valoraciones_recibidas:
    #         return sum([valoracion.valoracion for valoracion in valoraciones_recibidas]) / len(valoraciones_recibidas)
    #     return None