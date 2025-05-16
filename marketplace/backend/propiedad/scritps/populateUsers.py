from faker import Faker
from datetime import timedelta, date
import random
import os
import sys
import django


project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from usuario.models.usuario import Usuario
from django.contrib.auth.models import User

fake = Faker("es_ES")

biografias_predefinidas = [
    "Soy un apasionado de los viajes y la fotografía. Me encanta conocer nuevas culturas y lugares.",
    "Disfruto de la lectura, el cine y las caminatas al aire libre. Siempre busco nuevas aventuras.",
    "Me encanta la música, el arte y todo lo relacionado con la creatividad. Vivo para explorar nuevas ideas.",
    "Soy un profesional del sector tecnológico y en mis ratos libres disfruto haciendo deporte y cocinando.",
    "Amo la naturaleza y la tranquilidad. Mi hobby favorito es la jardinería y el senderismo.",
    "Soy una persona extrovertida que disfruta de la buena compañía y de socializar en eventos y reuniones.",
    "Trabajo como diseñador gráfico y me encanta todo lo relacionado con la moda y el diseño. En mi tiempo libre, disfruto de pintar y crear arte.",
    "Apasionado del cine clásico y de la literatura histórica. Me encanta aprender sobre el pasado y entender el presente.",
    "Soy un amante de los animales y la vida al aire libre. Mi día perfecto incluye una caminata por la montaña con mi perro.",
    "Me considero una persona emprendedora y siempre estoy buscando nuevas oportunidades. En mi tiempo libre disfruto de los deportes extremos y la cocina.",
]

def generar_dni():
    numeros = ''.join(random.choices('0123456789', k=8))
    letra = random.choice('TRWAGMYFPDXBNJZSQVHLCKE')
    return f'{numeros}{letra}'

def generar_telefono():
    return ''.join(random.choices('0123456789', k=9))

def poblar_usuarios():
    for _ in range(10):
        try:
            username = fake.user_name()
            email = fake.email()

            user = User.objects.create_user(
                username=username,
                email=email,
                password='password123',
            )

            dni = generar_dni()
            telefono = generar_telefono()
            direccion = fake.address()
            biografia = random.choice(biografias_predefinidas)
            fecha_de_nacimiento = fake.date_of_birth(minimum_age=18, maximum_age=60)

            Usuario.objects.create(
                usuario=user,
                dni=dni,
                telefono=telefono,
                direccion=direccion,
                biografia=biografia,
                fecha_de_nacimiento=fecha_de_nacimiento,
            )

            print(f"✅ Usuario creado: {user.username}, DNI: {dni}, Teléfono: {telefono}, Dirección: {direccion}, Biografía: {biografia}, Fecha de nacimiento: {fecha_de_nacimiento}")

        except Exception as e:
            print(f"❌ Error al crear usuario: {e}")

poblar_usuarios()
