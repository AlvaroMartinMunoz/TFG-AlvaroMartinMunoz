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

fake = Faker("es_ES")  

from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad
from propiedad.models.fotoPropiedad import FotoPropiedad
from django.core.files.base import ContentFile
import requests
from io import BytesIO

UNSPLASH_ACCESS_KEY = "SkcR0_hfyhVkevG3PwKqIps6v5wf_hqD8tURRsabjFs"

ciudadesEspana = [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Sevilla",
    "Zaragoza",
    "Málaga",
    "Murcia",
    "Palma",
    "Bilbao",
    "Alicante",
    "Córdoba",
    "Valladolid",
    "Vigo",
    "Gijón",
    "Granada",
    "Elche",
    "Oviedo",
    "Badalona",
    "Cartagena",
    "Terrassa",
    "Jerez de la Frontera",
    "Sabadell",
    "Móstoles",
    "Santa Cruz de Tenerife",
    "Pamplona",
    "Almería",
    "Alcalá de Henares",
    "San Sebastián",
    "Donostia",
    "Leganés",
    "Santander",
    "Burgos",
    "Castellón de la Plana",
    "Alcorcón",
    "Albacete",
    "Getafe",
    "Salamanca",
    "Logroño",
    "Huelva",
    "Badajoz",
    "Tarragona",
    "Lleida",
    "Marbella",
    "León",
    "Cádiz",
    "Jaén",
    "Ourense",
    "Lugo",
    "Santiago de Compostela",
    "Cáceres",
    "Melilla",
    "Ceuta",
    "Ávila",
    "Segovia",
    "Guadalajara",
    "Cuenca",
    "Soria",
    "Zamora",
    "Palencia",
    "Toledo",
    "Ciudad Real",
    "Huesca",
  ];


def obtener_imagen():
    url = f"https://api.unsplash.com/photos/random?query=apartment&client_id={UNSPLASH_ACCESS_KEY}"

    time.sleep(1)  
    try:
        response = requests.get(url)
        response.raise_for_status()  

        print(f"Respuesta de Unsplash: {response.status_code}")
        data = response.json()

        if not data or 'urls' not in data or 'regular' not in data['urls']:
            print("La respuesta de Unsplash no contiene los datos esperados")
            return None

        imagen_url = data["urls"]["regular"]
        print(f"Descargando imagen desde {imagen_url}")

        time.sleep(1)  
        imagen_response = requests.get(imagen_url)
        imagen_response.raise_for_status()

        nombre_archivo = f"{data.get('id', 'imagen')}.jpg"
        return ContentFile(BytesIO(imagen_response.content).read(), name=nombre_archivo)

    except requests.exceptions.RequestException as e:
        print(f"Error al conectarse con Unsplash: {str(e)}")
    except Exception as e:
        print(f"Error inesperado al procesar la imagen: {str(e)}")

    return None

def generar_nombre_propiedad(ciudad):
    """Genera un nombre de propiedad aleatorio como 'Apartamento Azul en Madrid'."""
    tipo = random.choice(["Apartamento", "Casa", "Villa"])
    adjetivos = ["Soleado", "Azul", "Elegante", "Moderno", "Rústico", "Tranquilo", "Encantador"]
    nombre = f"{tipo} {random.choice(adjetivos) } en {ciudad}"
    return nombre


def generar_descripcion(tipo, ciudad, habitaciones, banos, camas, max_huespedes, wifi, aire_acondicionado, calefaccion, parking, mascotas, permitido_fumar):
    """Genera una descripción dinámica basada en los atributos de la propiedad."""
    tipo = tipo.lower()
    servicios = []

    if wifi:
        servicios.append("wifi gratuito")
    if aire_acondicionado:
        servicios.append("aire acondicionado")
    if calefaccion:
        servicios.append("calefacción")
    if parking:
        servicios.append("parking gratuito")
    if mascotas:
        servicios.append("mascotas permitidas")
    if permitido_fumar:
        servicios.append("permitido fumar")

    descripcion = (f"Este {tipo} se encuentra en la preciosa ciudad de {ciudad}. "
                   f"Con {habitaciones} habitaciones y {banos} baños, es ideal para {max_huespedes} huéspedes. "
                   f"Cuenta con {camas} camas cómodas para asegurar una estancia agradable. ")

    if servicios:
        descripcion += f"Además, dispone de servicios como {', '.join(servicios)}. "
    
    descripcion += "¡No dudes en reservar tu estancia en este maravilloso espacio!"

    return descripcion


def poblar_propiedades(n=10):
    usuarios = Usuario.objects.all()
    if not usuarios:
        print("No hay usuarios en la base de datos.")
        return

    tipos_de_propiedad = ["Apartamento", "Casa", "Villa"]
    politicas_cancelacion = ["Flexible", "Moderada", "Estricta"]

    for _ in range(n):
        anfitrion = random.choice(usuarios)

        tipo_de_propiedad = random.choice(tipos_de_propiedad)
        ciudad = random.choice(ciudadesEspana)
        habitaciones = random.randint(1, 5)
        banos = random.randint(1, 3)
        camas = random.randint(1, 5)
        max_huespedes = random.randint(1, 10)
        wifi = fake.boolean()
        aire_acondicionado = fake.boolean()
        calefaccion = fake.boolean()
        parking = fake.boolean()
        mascotas = fake.boolean()
        permitido_fumar = fake.boolean()

        propiedad = Propiedad.objects.create(
            anfitrion=anfitrion,
            nombre=generar_nombre_propiedad(ciudad),  
            descripcion=generar_descripcion(tipo_de_propiedad, ciudad, habitaciones, banos, camas, max_huespedes, wifi, aire_acondicionado, calefaccion, parking, mascotas, permitido_fumar),  # 🔹 Descripción dinámica
            direccion=fake.street_address(),
            ciudad=ciudad,
            pais="España",
            codigo_postal=fake.postcode()[:5],
            tipo_de_propiedad=tipo_de_propiedad,
            precio_por_noche=round(random.uniform(50, 500), 2),
            maximo_huespedes=max_huespedes,
            numero_de_habitaciones=habitaciones,
            numero_de_banos=banos,
            numero_de_camas=camas,
            tamano=random.randint(30, 300),
            wifi=wifi,
            aire_acondicionado=aire_acondicionado,
            calefaccion=calefaccion,
            parking=parking,
            mascotas=mascotas,
            permitido_fumar=permitido_fumar,
            politica_de_cancelacion=random.choice(politicas_cancelacion),
        )

        for i in range(random.randint(2, 3)): 
            imagen = obtener_imagen()
            if imagen:
                FotoPropiedad.objects.create(
                    propiedad=propiedad,
                    foto=imagen,
                    es_portada=(i == 0) 
                )

        print(f"🏠 Propiedad creada: {propiedad.nombre}")

poblar_propiedades(5)
