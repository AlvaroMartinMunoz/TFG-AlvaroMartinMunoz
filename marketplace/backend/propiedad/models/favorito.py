from django.db import models
from .propiedad import Propiedad
from usuario.models.usuario import Usuario

class Favorito(models.Model):
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['usuario', 'propiedad']

    def __str__(self):
        return f'{self.usuario} - {self.propiedad}'