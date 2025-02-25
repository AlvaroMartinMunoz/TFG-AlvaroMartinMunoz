import os
import sys
import django
import random
from faker import Faker

# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

fake = Faker("es_ES")
from datetime import date, timedelta
from django.db import IntegrityError

from django.contrib.auth.models import User
from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad



def crear_propiedades():
    tipos_propiedad = ["Apartamento", "Casa", "Villa"]
    politicas_cancelacion = ["Flexible", "Moderada", "Estricta"]


    usuarios = list(Usuario.objects.all())  # Convertimos a lista para evitar errores

    if not usuarios:
        print("⚠️ No hay usuarios en la base de datos. Creando propiedades sin anfitriones.")
    
    num_propiedades = max(5, len(usuarios) * 2)  # Al menos 5 propiedades, ajustado a usuarios

    for _ in range(num_propiedades):
        anfitrion = random.choice(usuarios) if usuarios else None  # Puede ser None si no hay usuarios
        
        try:
            propiedad = Propiedad.objects.create(
                anfitrion=anfitrion,
                nombre=fake.street_name(),
                descripcion=fake.text(),
                direccion=fake.address(),
                ciudad=fake.city(),
                codigo_postal=fake.postcode(),
                pais="España",
                tipo_de_propiedad=random.choice(tipos_propiedad),
                precio_por_noche=round(random.uniform(30, 300), 2),
                disponible_desde=date.today(),
                disponible_hasta=date.today() + timedelta(days=random.randint(30, 365)),
                maximo_huespedes=random.randint(1, 10),
                numero_de_habitaciones=random.randint(1, 5),
                numero_de_banos=random.randint(1, 3),
                numero_de_camas=random.randint(1, 5),
                tamano=random.randint(30, 300),
                wifi=random.choice([True, False]),
                aire_acondicionado=random.choice([True, False]),
                calefaccion=random.choice([True, False]),
                parking=random.choice([True, False]),
                mascotas=random.choice([True, False]),
                permitido_fumar=random.choice([True, False]),
                politica_de_cancelacion=random.choice(politicas_cancelacion),
            )
            print(f"✅ Propiedad creada: {propiedad.nombre} en {propiedad.ciudad}")

        except IntegrityError as e:
            print(f"⚠️ Error al crear propiedad: {e}")

if __name__ == "__main__":
    crear_propiedades()
