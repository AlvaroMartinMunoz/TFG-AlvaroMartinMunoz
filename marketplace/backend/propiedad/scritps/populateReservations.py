from faker import Faker
import random
import os
import sys
import django
from datetime import timedelta, date
from decimal import Decimal

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from propiedad.models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from propiedad.models.reserva import Reserva

fake = Faker("es_ES")

ESTADOS_DE_RESERVA = ['Pendiente', 'Aceptada', 'Cancelada']
METODOS_DE_PAGO = ['Tarjeta de crédito', 'PayPal']

comentarios_predefinidos = [
    "¿La propiedad cuenta con aire acondicionado en todas las habitaciones?",
    "¿Hay opciones de transporte público cerca de la propiedad?",
    "¿Se pueden organizar eventos o reuniones en el lugar?",
    "¿Está permitido llevar mascotas?",
    "¿Hay algún servicio de limpieza durante la estancia?",
    "¿Cómo es la seguridad en la zona, es tranquila?",
    "¿La propiedad dispone de parking para más de un coche?",
    "¿Hay supermercados o tiendas cerca?",
    "¿La piscina está abierta todo el año?",
    "¿Cuál es la política de cancelación en caso de imprevistos?",
    "¿El wifi es de buena calidad y tiene cobertura en toda la propiedad?",
    "¿La propiedad está adaptada para personas con movilidad reducida?",
    "¿Hay algún servicio de transporte desde el aeropuerto o estación de tren?",
    "¿Cuánto tiempo se tarda en llegar a la playa/centro/atracciones turísticas?",
    "¿Es posible hacer el check-in más tarde de la hora estándar?",
    "¿Está incluida la limpieza final en el precio o es adicional?",
    "¿La propiedad tiene calefacción durante el invierno?",
    "¿Hay alguna restricción en cuanto al número de personas que pueden alojarse?",
    "¿El precio por noche incluye todos los gastos o hay cargos adicionales?",
    "¿Se permiten fiestas o reuniones dentro de la propiedad?",
    "¿Cómo es la política de depósito o pago inicial?",
    "¿Cuántas camas tiene la propiedad y son cómodas para grupos grandes?",
    "¿Es posible solicitar un servicio de cuna o cama extra?",
    "¿Hay algún tipo de equipo o material disponible para actividades al aire libre?",
    "¿Se puede pagar con tarjeta de crédito o solo en efectivo?",
    "¿Cómo puedo contactar con el anfitrión en caso de necesitar algo durante la estancia?",
    "¿Existen restricciones en cuanto al ruido después de cierto horario?",
    "¿Hay alguna recomendación sobre restaurantes o actividades cercanas?",
    "¿Está la propiedad cerca de alguna zona de interés turístico?",
    "¿El lugar tiene buen acceso para personas mayores o con movilidad reducida?",
    "¿Puedo hacer modificaciones a la reserva una vez confirmada?"
]

def poblar_reservas():
    usuarios = list(Usuario.objects.all())
    propiedades = list(Propiedad.objects.all())

    if not usuarios or not propiedades:
        print("No hay usuarios o propiedades disponibles.")
        return

    for usuario in usuarios:
        propiedades_disponibles = [p for p in propiedades if p.anfitrion != usuario]
        if len(propiedades_disponibles) < 2:
            continue

        for _ in range(2):
            propiedad = random.choice(propiedades_disponibles)
            propiedades_disponibles.remove(propiedad)
            anfitrion = propiedad.anfitrion

            fecha_llegada = fake.date_between(start_date="+2d", end_date="+14d")
            fecha_salida = fecha_llegada + timedelta(days=random.randint(1, 7))
            numero_personas = random.randint(1, 4)
            precio_por_noche = propiedad.precio_por_noche
            precio_total = precio_por_noche * (fecha_salida - fecha_llegada).days * Decimal(1.1)
            estado = random.choice(ESTADOS_DE_RESERVA)
            metodo_pago = random.choice(METODOS_DE_PAGO)

            try:
                reserva, created = Reserva.objects.get_or_create(
                    propiedad=propiedad,
                    usuario=usuario,
                    fecha_llegada=fecha_llegada,
                    fecha_salida=fecha_salida,
                    defaults={
                        "anfitrion": anfitrion,
                        "numero_personas": numero_personas,
                        "precio_por_noche": precio_por_noche,
                        "precio_total": precio_total,
                        "estado": estado,
                        "metodo_pago": metodo_pago,
                        "comentarios_usuario": random.choice(comentarios_predefinidos),
                    }
                )
                if created:
                    print(f"✅ Reserva creada: {reserva} - Estado: {estado} - Método de pago: {metodo_pago}")
                else:
                    print(f"⚠️ Ya existe una reserva para {usuario} en {propiedad} entre {fecha_llegada} y {fecha_salida}")
            except Exception as e:
                print(f"❌ Error al crear reserva para {usuario.id} en {propiedad.id}: {e}")

poblar_reservas()