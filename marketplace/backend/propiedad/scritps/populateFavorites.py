import os
import sys
import django
import random
import time  
from faker import Faker

# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad
from propiedad.models.favorito import Favorito


fake = Faker("es_ES")  

def poblar_favoritos():
    usuarios = list(Usuario.objects.all())
    propiedades = list(Propiedad.objects.all())

    for usuario in usuarios:
        try:
            propiedades_favoritas = random.sample(propiedades, random.randint(1, 3))
            for propiedad in propiedades_favoritas:
                Favorito.objects.create(
                    usuario=usuario,
                    propiedad=propiedad
                )
                print(f"Favorito creado para {usuario.usuario.username} en {propiedad.nombre}")
        except Exception as e:
            print(f"Error al crear favorito: {e}")

poblar_favoritos()


          