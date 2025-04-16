from django.db import models
from .propiedad import Propiedad
from usuario.models.usuario import Usuario


class ClickPropiedad(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='clicks')
    timestamp = models.DateTimeField(auto_now_add=True)
