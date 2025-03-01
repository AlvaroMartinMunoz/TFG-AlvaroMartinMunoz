from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from propiedad.models.valoracionPropiedad import ValoracionPropiedad
from usuario.models.usuario import Usuario
from django.utils import timezone

class Propiedad(models.Model):

    TIPOS_DE_PROPIEDAD = [
        ('Apartamento', 'Apartamento'),
        ('Casa', 'Casa'),
        ('Villa', 'Villa'),
    ]

    POLITICAS_DE_CANCELACION = [
        ('Flexible', 'Flexible'),
        ('Moderada', 'Moderada'),
        ('Estricta', 'Estricta'),
    ]

    anfitrion = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='propiedades')

    # INFORMACIÓN GENERAL
    nombre = models.CharField(max_length=100,blank=False, null=False, help_text='Introduzca un nombre para su propiedad.', unique=True)
    descripcion = models.TextField(blank=False, null=False, help_text='Introduzca una descripción para su propiedad.')
    direccion = models.CharField(max_length=255, blank=False, null=False, help_text='Introduzca la dirección de su propiedad.')
    ciudad = models.CharField(max_length=100, blank=False, null=False, help_text='Introduzca la ciudad donde se encuentra su propiedad.')
    pais = models.CharField(max_length=100, blank=False, null=False, help_text='Introduzca el país donde se encuentra su propiedad.')
    codigo_postal = models.CharField(max_length=5, validators=[RegexValidator(r'^\d{5}$', message='El código postal debe tener 5 dígitos.')],help_text='Introduzca un código postal válido de 5 dígitos.')
    tipo_de_propiedad = models.CharField(max_length=20, choices=TIPOS_DE_PROPIEDAD, blank=False, null=False, help_text='Seleccione el tipo de propiedad.')

    # PRECIOS Y DISPONIBILIDAD
    precio_por_noche = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(1)], help_text='Introduzca el precio por noche en EUR.')
    maximo_huespedes = models.PositiveIntegerField(validators=[MinValueValidator(1)], help_text='Introduzca el número máximo de huéspedes permitidos.')

    # CARACTERISTICAS GENERALES
    numero_de_habitaciones = models.PositiveIntegerField(validators=[MinValueValidator(1)], help_text='Introduzca el número de habitaciones.')
    numero_de_banos = models.PositiveIntegerField(validators=[MinValueValidator(1)], help_text='Introduzca el número de baños.')
    numero_de_camas = models.PositiveIntegerField(validators=[MinValueValidator(1)], help_text='Introduzca el número de camas.')
    tamano = models.PositiveIntegerField(validators=[MinValueValidator(10)],help_text='Introduzca el tamaño en metros cuadrados.')

    # SERVICIOS
    wifi = models.BooleanField(default=False)
    aire_acondicionado = models.BooleanField(default=False)
    calefaccion = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    mascotas = models.BooleanField(default=False)
    permitido_fumar = models.BooleanField(default=False)

    # UBICACIÓN GEOGRÁFICA
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, validators=[MinValueValidator(-90), MaxValueValidator(90)], help_text='Introduzca la latitud de su propiedad.')
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, validators=[MinValueValidator(-180), MaxValueValidator(180)], help_text='Introduzca la longitud de su propiedad.')

    # POLITICAS DE CANCELACIÓN
    politica_de_cancelacion = models.CharField(max_length=20, choices=POLITICAS_DE_CANCELACION, blank=False, null=False, help_text='Seleccione la política de cancelación.')

    def valoracion_promedio_propiedad(self):
        valoraciones = ValoracionPropiedad.objects.filter(propiedad=self)
        if valoraciones:
            return sum([valoracion.valoracion for valoracion in valoraciones]) / len(valoraciones)
        return None

    def clean(self):
        if self.disponible_desde and self.disponible_hasta:
            if self.disponible_desde > self.disponible_hasta:
                raise ValidationError('La fecha de inicio de disponibilidad no puede ser mayor que la fecha de fin de disponibilidad.')

    def __str__(self):
        return self.nombre
    
    class Meta:
        unique_together = ['latitud', 'longitud', 'direccion', 'ciudad', 'pais', 'codigo_postal', 'nombre']

class FechaBloqueada(models.Model):
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='fechas_bloqueadas')
    fecha = models.DateField(help_text='Introduzca la fecha que desea bloquear.')

    class Meta:
        unique_together = ['propiedad', 'fecha']

    def clean(self):
        if self.fecha < timezone.now().date():
            raise ValidationError('La fecha de bloqueo no puede ser anterior a la fecha actual.')

    def __str__(self):
        return f'{self.propiedad.nombre} - {self.fecha}'
