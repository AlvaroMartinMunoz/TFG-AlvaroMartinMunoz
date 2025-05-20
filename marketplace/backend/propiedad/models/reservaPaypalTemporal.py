from django.db import models
from django.contrib.auth import get_user_model
from usuario.models.usuario import Usuario

User = get_user_model()

class ReservaPaypalTemporal(models.Model):
    order_id = models.CharField(max_length=128, unique=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    datos_reserva = models.JSONField()
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reserva temporal PayPal {self.order_id}"