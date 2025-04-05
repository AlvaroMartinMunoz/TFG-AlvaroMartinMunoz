

from django.core.exceptions import ValidationError
from django.db import models
from propiedad.models.propiedad import Propiedad
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.timezone import now


class PrecioEspecial(models.Model):
    """
    Modelo para representar un precio especial para una propiedad en una fecha específica.
    """
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='precios_especiales')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    precio_especial = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(1), MaxValueValidator(5000)], help_text='Precio especial por noche.')

    def __str__(self):
        return f"Precio especial de {self.precio_especial} para {self.propiedad.nombre} desde {self.fecha_inicio} hasta {self.fecha_fin}"
    
    class Meta:
        unique_together = ('propiedad', 'fecha_inicio', 'fecha_fin')

    def clean(self):
        if self.fecha_inicio > self.fecha_fin:
            raise ValidationError('La fecha de inicio no puede ser posterior a la fecha de fin.')
        
        if self.fecha_inicio < now().date():
            raise ValidationError('La fecha de inicio no puede ser anterior a la fecha actual.')