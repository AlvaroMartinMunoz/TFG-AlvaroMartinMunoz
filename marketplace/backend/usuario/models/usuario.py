from django.db import models
from django.contrib.auth.models import User
from usuario.models.valoracionUsuario import ValoracionUsuario


class Usuario(models.Model):

    ROLES_DE_USUARIO = [
        ('Anfitrion', 'Anfitrion'),
        ('Huesped', 'Huesped'),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE)

    dni = models.CharField(max_length=9, blank=False, null=False, help_text='Introduzca su DNI.')
    telefono = models.CharField(max_length=9, blank=False, null=False, help_text='Introduzca su número de teléfono.')
    direccion = models.CharField(max_length=255, blank=False, null=False, help_text='Introduzca su dirección.')
    biografia = models.TextField(blank=True, null=True, default=None, help_text='Introduzca una breve descripción sobre usted.')
    fecha_de_nacimiento = models.DateField(blank=False, null=False, help_text='Introduzca su fecha de nacimiento.')
    rol = models.CharField(max_length=20, choices=ROLES_DE_USUARIO, blank=False, null=False, help_text='Seleccione su rol.')
    foto_de_perfil = models.ImageField(upload_to='fotos_de_perfil/', blank=True, null=True, default=None, help_text='Suba una foto de perfil.')

    # Características
    valoraciones_usuario = models.FloatField(default=0, help_text='Valoración promedio del usuario por sus interacciones.')
    numero_de_resenas = models.PositiveIntegerField(default=0, help_text='Número de valoraciones recibidas por el usuario.')

    def valoracion_promedio_usuario(self):
        valoraciones_recibidas = ValoracionUsuario.objects.filter(usuario_valorado=self.usuario)
        if valoraciones_recibidas:
            return sum([valoracion.valoracion for valoracion in valoraciones_recibidas]) / len(valoraciones_recibidas)
        return None