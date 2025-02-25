import os
import sys
import django
import random

# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from datetime import date
from django.db import IntegrityError
from faker import Faker
from django.contrib.auth.models import User
from usuario.models.usuario import Usuario



fake = Faker("es_ES")
NUM_USUARIOS = 35

def calcular_edad(fecha_nacimiento):
    hoy = date.today()
    return hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))

def crear_usuarios():
    hobbies = [
        "senderismo", "cocina", "fotografía", 
        "lectura", "viajar", "deportes",
        "música", "pintura", "videojuegos"
    ]
    
    creados = 0
    intentos = 0
    max_intentos = NUM_USUARIOS * 2
    
    while creados < NUM_USUARIOS and intentos < max_intentos:
        intentos += 1
        try:
            
            nombre = fake.first_name()
            apellido = fake.last_name()
            fecha_nac = fake.date_of_birth(minimum_age=18, maximum_age=70)
            edad = calcular_edad(fecha_nac)
            mis_hobbies = random.sample(hobbies, random.randint(2, 4))
            
            
            user = User.objects.create_user(
                username=fake.unique.user_name(),
                email=fake.unique.email(),
                password="Password123#",
                first_name=nombre,
                last_name=apellido
            )
            
            
            Usuario.objects.create(
                usuario=user,
                dni=f"{random.randint(10_000_000, 99_999_999)}{'TRWAGMYFPDXBNJZSQVHLCKE'[random.randint(0,22)]}",
                telefono=fake.unique.numerify('6########'),
                direccion=fake.address(),
                biografia=f"{nombre} {apellido}, {edad} años. Me gusta: {', '.join(mis_hobbies)}.",
                fecha_de_nacimiento=fecha_nac,
                valoraciones_usuario=0,
                numero_de_resenas=0
            )
            
            creados += 1
            print(f"Creado: {nombre} ({edad} años)", end='\r')
            
        except IntegrityError:
            continue
            
    print(f"\n✅ {creados} usuarios creados")
    print(f"Hobbies populares: {', '.join(random.sample(hobbies, 3))}...")

if __name__ == "__main__":
    crear_usuarios()