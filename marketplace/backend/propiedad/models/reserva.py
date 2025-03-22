from django.db import models
from .propiedad import Propiedad
from django.core.exceptions import ValidationError
from usuario.models.usuario import Usuario


class Reserva(models.Model):

    ESTADOS_DE_RESERVA = [
        ('Pendiente', 'Pendiente'),
        ('Aceptada', 'Aceptada'),
        ('Cancelada', 'Cancelada'),
    ]

    METODOS_DE_PAGO = [
        ('Tarjeta de crédito', 'Tarjeta de crédito'),
        ('PayPal', 'PayPal'),
    ]


    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='reservas')
    anfitrion = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reservas_anfitrion')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reservas')
    fecha_llegada = models.DateField(blank=False, null=False, help_text='Introduzca la fecha de llegada.')
    fecha_salida = models.DateField(blank=False, null=False, help_text='Introduzca la fecha de salida.')
    numero_personas = models.PositiveIntegerField(blank=False, null=False, help_text='Introduzca el número de personas.')
    precio_por_noche = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False, help_text='Introduzca el precio por noche en EUR.')
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False, help_text='Introduzca el precio total en EUR.')
    estado = models.CharField(max_length=20, choices=ESTADOS_DE_RESERVA, blank=False, null=False, help_text='Seleccione el estado de la reserva.')
    metodo_pago = models.CharField(max_length=30, choices=METODOS_DE_PAGO, blank=False, null=False, help_text='Seleccione el método de pago.')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aceptacion_rechazo = models.DateTimeField(blank=True, null=True)  
    comentarios_usuario = models.TextField(blank=True, null=True, help_text='Introduzca un comentario para el anfitrión.')
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f'{self.propiedad} - {self.fecha_llegada} - {self.fecha_salida}'
    
    class Meta:
        unique_together = ['propiedad', 'fecha_llegada', 'fecha_salida']
        ordering = ['fecha_llegada']

    def clean(self):

        if self.fecha_salida <= self.fecha_llegada:
            raise ValidationError('La fecha de salida debe ser posterior a la fecha de llegada.')
        if self.fecha_llegada < self.fecha_creacion.date():
            raise ValidationError('La fecha de llegada no puede ser anterior a la fecha actual.')
        if self.fecha_salida < self.fecha_creacion.date():
            raise ValidationError('La fecha de salida no puede ser anterior a la fecha actual.')
        if self.precio_total < 0:
            raise ValidationError('El precio total no puede ser negativo.') 
        if self.precio_por_noche < 0:
            raise ValidationError('El precio por noche no puede ser negativo.')
        if self.numero_personas <= 0:
            raise ValidationError('El número de personas debe ser mayor que 0.')
        
        
        
    

