from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class ValoracionPropiedad(models.Model):
    propiedad = models.ForeignKey('propiedad.Propiedad', on_delete=models.CASCADE, related_name='valoraciones_a_propiedad')
    usuario = models.ForeignKey('usuario.Usuario', on_delete=models.CASCADE, related_name='usuario_que_valora')
    valoracion = models.FloatField(
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text='Valoración del 1 al 5.',
        null=False,
        blank=False,
    )
    comentario = models.TextField(blank=False, null=False, help_text='Comentario adicional sobre la propiedad.')

    class Meta:
        unique_together = ['propiedad', 'usuario']

    def __str__(self):
        return f'Valoración de {self.usuario.username} para la propiedad {self.propiedad.nombre}'
