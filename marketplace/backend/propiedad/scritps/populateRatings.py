
from faker import Faker
import random
import os
import sys
import django


# Configuración Django
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from propiedad.models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from propiedad.models.valoracionPropiedad import ValoracionPropiedad

fake = Faker("es_ES")  

comentarios_predefinidos = [
    "La propiedad tiene un gran potencial para inversión.",
    "Me encantó la ubicación, muy cerca de todo.",
    "La propiedad está en una zona tranquila y segura.",
    "Las instalaciones son modernas y están bien mantenidas.",
    "Muy buena relación calidad-precio.",
    "Ideal para familias grandes, espaciosa y cómoda.",
    "Excelente vista desde el balcón.",
    "La propiedad está bien equipada y lista para mudarse.",
    "Es un lugar perfecto para descansar y disfrutar de la tranquilidad.",
    "A pesar de ser pequeña, tiene todo lo necesario para vivir cómodamente.",
    "El diseño de la propiedad es muy elegante y funcional.",
    "La casa tiene un hermoso jardín, perfecto para reuniones al aire libre.",
    "Un apartamento acogedor y bien iluminado, ideal para una pareja.",
    "La propiedad cuenta con una excelente distribución de espacios.",
    "Es una propiedad con mucho carácter y encanto, totalmente única.",
    "La zona es muy accesible, con excelente transporte público cercano.",
    "La propiedad tiene detalles de alta calidad que marcan la diferencia.",
    "La piscina es una maravilla, perfecta para disfrutar en verano.",
    "Muy buena opción si buscas tranquilidad y cercanía al centro de la ciudad.",
    "El vecindario es muy amigable y la comunidad está bien organizada.",
    "Ideal para aquellos que buscan una propiedad con un toque rústico.",
    "Es un lugar perfecto para disfrutar de las vacaciones o fines de semana.",
    "La propiedad cuenta con un sistema de seguridad muy confiable.",
    "Excelente para personas que trabajan desde casa, tiene espacios amplios y tranquilos.",
    "El balcón es perfecto para disfrutar del clima y de la vista panorámica.",
    "Ideal para quienes buscan una propiedad con un estilo moderno y minimalista.",
    "La propiedad tiene acabados de lujo que la hacen destacar.",
    "La propiedad es perfecta para quienes buscan comodidad y lujo a un precio razonable.",
    "Las vistas al mar desde la terraza son impresionantes.",
    "La casa tiene un diseño abierto que crea una sensación de amplitud.",
    "Perfecta para aquellos que buscan un ambiente relajado y privado.",
    "La propiedad está en una excelente ubicación, cerca de todo lo necesario.",
    "La casa tiene un estilo contemporáneo que se adapta perfectamente a la vida moderna.",
    "Ideal para quienes buscan una propiedad con espacio para crecer y personalizar.",
    "La casa tiene una chimenea que le da un toque muy acogedor en invierno.",
    "La propiedad tiene todo lo necesario para una vida cómoda y tranquila.",
    "Excelente opción para quienes buscan un lugar cerca de la naturaleza pero con todas las comodidades.",
    "La propiedad cuenta con un amplio garaje para varios vehículos.",
    "Ideal para quienes disfrutan de la jardinería, cuenta con un espacio exterior perfecto.",
    "La propiedad tiene una gran cocina, perfecta para quienes disfrutan de la cocina casera.",
    "Perfecta para familias que buscan un espacio seguro y cómodo.",
    "El diseño interior es moderno, pero con un toque de calidez.",
    "La propiedad es muy tranquila, ideal para quienes buscan paz y privacidad.",
    "Es una propiedad que combina confort, estilo y funcionalidad a la perfección.",
    "La zona tiene una excelente calidad de vida, con parques y espacios recreativos cercanos.",
    "Muy buena opción para quienes buscan una propiedad lista para mudarse sin complicaciones.",
    "La propiedad tiene un gran espacio para hacer mejoras y personalizarla a tu gusto.",
    "Es una propiedad de lujo, con todas las comodidades que puedas imaginar.",
    "La terraza es ideal para hacer parrilladas o disfrutar de una buena tarde de sol.",
    "Una propiedad con mucha luz natural, creando un ambiente muy agradable.",
    "Ideal para quienes buscan un lugar con mucha privacidad y sin ruido de la ciudad.",
    "La propiedad tiene un encanto especial que la hace única en su tipo.",
    "La zona es muy segura, perfecta para vivir con tranquilidad y sin preocupaciones.",
    "Es una propiedad que se adapta perfectamente a cualquier tipo de familia o persona.",
    "La casa tiene un diseño práctico y funcional, aprovechando al máximo cada espacio.",
    "Muy bien situada, cerca de colegios, centros comerciales y transporte público.",
    "La propiedad tiene un sistema de climatización perfecto para todas las estaciones del año.",
    "La piscina y el jardín son ideales para organizar eventos al aire libre con amigos y familiares."
]


def poblar_valoraciones():
    usuarios = Usuario.objects.all()
    propiedades = Propiedad.objects.all()

    if not usuarios or not propiedades:
        print("No hay usuarios o propiedades en la base de datos.")
        return
    try: 
        for usuario in usuarios:
            try:
                for propiedad in propiedades:
                    valoracion = ValoracionPropiedad.objects.filter(usuario=usuario, propiedad=propiedad).first()
                    if usuario != propiedad.anfitrion and not valoracion:
                        comentario = random.choice(comentarios_predefinidos)
                        valoracion = random.choices([1, 2, 3, 4, 5], [0.05, 0.05, 0.20, 0.30, 0.40])[0]

                        ValoracionPropiedad.objects.create(
                            usuario=usuario,
                            propiedad=propiedad,
                            valoracion=valoracion,
                            comentario=comentario,
                        )
                        print(f"Valoración creada para la propiedad {propiedad.id} por el usuario {usuario.id}")
                    else:
                        print(f"El usuario {usuario.id} ya ha valorado la propiedad {propiedad.id} o es el anfitrión.")
            except Exception as e:
                print(f"Error al crear valoración para la propiedad {propiedad.id} por el usuario {usuario.id}: {e}")   
    except Exception as e:
        print(f"Error al crear valoraciones: {e}")

poblar_valoraciones()
            