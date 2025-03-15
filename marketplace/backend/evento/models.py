from django.db import models

class Evento(models.Model):
    nombre = models.CharField(max_length=500, null=False, blank=False)
    fecha = models.CharField(max_length=500, null=False, blank=False)
    lugar = models.CharField(max_length=500, null=False, blank=False)
    imagen = models.URLField()
    categoria = models.CharField(max_length=500, null=False, blank=False)

    def __str__(self):
        return self.nombre
    
    class Meta:
        unique_together = ['nombre', 'fecha', 'lugar']

