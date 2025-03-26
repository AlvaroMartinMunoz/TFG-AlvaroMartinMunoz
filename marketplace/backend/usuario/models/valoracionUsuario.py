from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class ValoracionUsuario(models.Model):
    usuario_valorado = models.ForeignKey('usuario.Usuario', on_delete=models.CASCADE, related_name='valoracion_a_usuarios')  # El usuario que es valorado (anfitrión o huésped)
    usuario_que_valora = models.ForeignKey('usuario.Usuario', on_delete=models.CASCADE, related_name='usuario_valora')  # El usuario que da la valoración (huésped o anfitrión)
    valoracion = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Valoración del 1 al 5.'
    )
    comentario = models.TextField(blank=True, null=True, help_text='Comentario adicional sobre la interacción.')

    def __str__(self):
        return f'Valoración de {self.usuario_valorador.username} para {self.usuario_valorado.username}'


