from django.db import models
from propiedad.models.propiedad import Propiedad
from django.core.exceptions import ValidationError

class FotoPropiedad(models.Model):
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='fotos')
    foto = models.ImageField(upload_to='fotos_propiedades/', help_text='Seleccione una foto de su propiedad.')
    es_portada = models.BooleanField(default=False, help_text='Seleccione si desea que esta foto sea la portada de su propiedad.')

    def clean(self):
        if self.es_portada:
            otras_portadas = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).exclude(id=self.id)
            if otras_portadas.exists():
                raise ValidationError('Ya existe una foto de portada para esta propiedad.')

    def __str__(self):
        return f'{self.propiedad.nombre} - {self.foto}'
    
    class Meta:
        unique_together = ['propiedad', 'foto']