import os
import sys
import django
import random

# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from datetime import date, timedelta
from django.db import IntegrityError
from faker import Faker
from django.contrib.auth.models import User
from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad

fake = Faker("es_ES")

def crear_propiedades():
    tipos_propiedad = ["Apartamento", "Casa", "Villa"]
    politicas_cancelacion = ["Flexible", "Moderada", "Estricta"]
    
    usuarios = Usuario.objects.all()
    
    porcentaje_anfitriones = 0.4  
    num_anfitriones = int(usuarios.count() * porcentaje_anfitriones)
    anfitriones = random.sample(list(usuarios), num_anfitriones)
    
    for anfitrion in anfitriones:
        num_propiedades = random.randint(1, 3)  
        for _ in range(num_propiedades):
            Propiedad.objects.create(
                anfitrion=anfitrion.usuario,
                nombre=fake.street_name(),
                descripcion=fake.text(),
                direccion=fake.address(),
                ciudad=fake.city(),
                estado=fake.state(),
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
        print(f"✅ Propiedades creadas para: {anfitrion.usuario.username}")

if __name__ == "__main__":
    crear_propiedades()