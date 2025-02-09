from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class ValoracionPropiedad(models.Model):
    propiedad = models.ForeignKey('propiedad.Propiedad', on_delete=models.CASCADE, related_name='valoraciones_a_propiedad')
    usuario = models.ForeignKey('usuario.Usuario', on_delete=models.CASCADE, related_name='usuario_que_valora')
    valoracion = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Valoración del 1 al 5.'
    )
    comentario = models.TextField(blank=True, null=True, help_text='Comentario adicional sobre la propiedad.')

    def __str__(self):
        return f'Valoración de {self.usuario.username} para la propiedad {self.propiedad.nombre}'
