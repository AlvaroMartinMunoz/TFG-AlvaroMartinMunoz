import os
import sys
import django
import random
import time  
from faker import Faker
from datetime import datetime
from datetime import timedelta

# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad
from propiedad.models.precioEspecial import PrecioEspecial

fake = Faker("es_ES")  

from datetime import datetime, timedelta
from propiedad.models.precioEspecial import PrecioEspecial

def poblar_precios_especiales():
    usuarios = Usuario.objects.all()

    for usuario in usuarios:
        try:
            mis_propiedades = Propiedad.objects.filter(anfitrion=usuario)

            if not mis_propiedades.exists():
                print(f"⚠️ El usuario {usuario} no tiene propiedades.")
                continue

            for propiedad in mis_propiedades:
                cantidad = random.randint(10, 15)
                for _ in range(cantidad):
                    hoy = datetime.now()
                    dias_atras = random.randint(0, 365)
                    fecha_inicio = hoy - timedelta(days=dias_atras)
                    dias_duracion = random.randint(1, 30)
                    fecha_fin = fecha_inicio + timedelta(days=dias_duracion)

                    variacion = random.randint(50, 300)
                    if random.choice([True, False]): 
                        precio_especial_valor = propiedad.precio_por_noche - variacion
                        modalidad = "descuento"
                    else:  
                        precio_especial_valor = propiedad.precio_por_noche + variacion
                        modalidad = "aumento"

                    if precio_especial_valor < 0:
                        precio_especial_valor = 50

                    try:
                        PrecioEspecial.objects.create(
                            propiedad=propiedad,
                            fecha_inicio=fecha_inicio,
                            fecha_fin=fecha_fin,
                            precio_especial=precio_especial_valor,
                        )
                        print(f"✅ Precio especial ({modalidad}) creado para {usuario} en '{propiedad.nombre}'")
                    except Exception as e:
                        print(f"❌ Error al crear precio especial para propiedad {propiedad.id}: {e}")
        except Exception as e:
            print(f"❌ Error general con el usuario {usuario}: {e}")

poblar_precios_especiales()
