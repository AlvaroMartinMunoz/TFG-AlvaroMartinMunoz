from django.test import TestCase
from django.utils import timezone
from ..models.clickPropiedad import ClickPropiedad
from ..models.propiedad import Propiedad, FechaBloqueada
from usuario.models.usuario import Usuario
from django.contrib.auth.models import User
from datetime import date
from ..models.favorito import Favorito
from ..models.fotoPropiedad import FotoPropiedad
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from ..models.precioEspecial import PrecioEspecial
from datetime import timedelta
from django.utils.timezone import now
from ..models.valoracionPropiedad import ValoracionPropiedad
from ..models.reserva import Reserva
from ..models.reservaPaypalTemporal import ReservaPaypalTemporal



class ClickPropiedadModelTest(TestCase):
    def setUp(self):
        # Crear usuario de Django
        self.user = User.objects.create_user(username='testuser', password='password')

        # Crear instancia de Usuario
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1)
        )

        # Crear Propiedad válida
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa de Prueba',
            descripcion='Una casa muy bonita',
            direccion='Calle Real 123',
            ciudad='Madrid',
            pais='España',
            codigo_postal='28001',
            tipo_de_propiedad='Casa',
            precio_por_noche=100.00,
            maximo_huespedes=4,
            numero_de_habitaciones=2,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=80,
            wifi=True,
            aire_acondicionado=False,
            calefaccion=True,
            parking=True,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Flexible'
        )

    def test_click_propiedad_creacion(self):
        click = ClickPropiedad.objects.create(
            usuario=self.usuario,
            propiedad=self.propiedad
        )
        self.assertEqual(click.usuario, self.usuario)
        self.assertEqual(click.propiedad, self.propiedad)
        self.assertIsNotNone(click.timestamp)

    def test_click_propiedad_timestamp(self):
        click = ClickPropiedad.objects.create(
            usuario=self.usuario,
            propiedad=self.propiedad
        )
        now = timezone.now()
        self.assertLessEqual(click.timestamp, now)

    def test_relacion_inversa_clicks_en_propiedad(self):
        click = ClickPropiedad.objects.create(
            usuario=self.usuario,
            propiedad=self.propiedad
        )
        self.assertIn(click, self.propiedad.clicks.all())

class FavoritoModelTest(TestCase):
    def setUp(self):
        # Crear usuario base de Django
        self.user = User.objects.create_user(username='testuser', password='password')

        # Crear instancia de Usuario extendido
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Usuario de prueba',
            fecha_de_nacimiento=date(2000, 1, 1)
        )

        # Crear Propiedad válida
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa Favorita',
            descripcion='Una casa muy agradable',
            direccion='Calle Favorita 456',
            ciudad='Barcelona',
            pais='España',
            codigo_postal='08001',
            tipo_de_propiedad='Apartamento',
            precio_por_noche=85.50,
            maximo_huespedes=3,
            numero_de_habitaciones=1,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=70,
            wifi=True,
            aire_acondicionado=True,
            calefaccion=True,
            parking=False,
            mascotas=False,
            permitido_fumar=False,
            politica_de_cancelacion='Flexible'
        )

    def test_creacion_favorito(self):
        favorito = Favorito.objects.create(usuario=self.usuario, propiedad=self.propiedad)
        self.assertEqual(favorito.usuario, self.usuario)
        self.assertEqual(favorito.propiedad, self.propiedad)

    def test_relacion_inversa_favoritos_en_usuario(self):
        favorito = Favorito.objects.create(usuario=self.usuario, propiedad=self.propiedad)
        self.assertIn(favorito, self.usuario.favoritos.all())

    def test_relacion_inversa_favoritos_en_propiedad(self):
        favorito = Favorito.objects.create(usuario=self.usuario, propiedad=self.propiedad)
        self.assertIn(favorito, self.propiedad.favoritos.all())

    def test_favorito_unicidad_usuario_propiedad(self):
        Favorito.objects.create(usuario=self.usuario, propiedad=self.propiedad)
        with self.assertRaises(Exception):
            # Debería fallar por unique_together
            Favorito.objects.create(usuario=self.usuario, propiedad=self.propiedad)

class FotoPropiedadModelTest(TestCase):
    def setUp(self):
        # Usuario base + extendido
        self.user = User.objects.create_user(username='testuser', password='password')
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Usuario de prueba',
            fecha_de_nacimiento=date(2000, 1, 1)
        )

        # Propiedad válida
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa con Fotos',
            descripcion='Descripción de prueba',
            direccion='Calle Imagen 123',
            ciudad='Madrid',
            pais='España',
            codigo_postal='28001',
            tipo_de_propiedad='Apartamento',
            precio_por_noche=100,
            maximo_huespedes=2,
            numero_de_habitaciones=1,
            numero_de_banos=1,
            numero_de_camas=1,
            tamano=50,
            wifi=True,
            aire_acondicionado=True,
            calefaccion=True,
            parking=True,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Moderada'
        )

        # Imagen de prueba
        self.fake_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'some_image_data',
            content_type='image/jpeg'
        )

    def test_creacion_foto_propiedad(self):
        foto = FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=self.fake_image,
            es_portada=False
        )
        self.assertEqual(foto.propiedad, self.propiedad)
        self.assertFalse(foto.es_portada)

    def test_es_portada_unica(self):
        # Creamos una foto como portada
        FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=self.fake_image,
            es_portada=True
        )

        # Nueva imagen
        otra_imagen = SimpleUploadedFile('otra.jpg', b'data', content_type='image/jpeg')

        # Intentamos crear otra portada (debería lanzar error al hacer clean)
        foto = FotoPropiedad(
            propiedad=self.propiedad,
            foto=otra_imagen,
            es_portada=True
        )
        with self.assertRaises(ValidationError):
            foto.clean()

    def test_str_repr(self):
        foto = FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=self.fake_image,
            es_portada=False
        )
        self.assertIn('Casa con Fotos', str(foto))


class PrecioEspecialModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Bio test',
            fecha_de_nacimiento=date(2000, 1, 1)
        )

        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa Precio Especial',
            descripcion='Descripción prueba',
            direccion='Calle Prueba 456',
            ciudad='Sevilla',
            pais='España',
            codigo_postal='41001',
            tipo_de_propiedad='Casa',
            precio_por_noche=150,
            maximo_huespedes=4,
            numero_de_habitaciones=2,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=80,
            wifi=True,
            aire_acondicionado=False,
            calefaccion=True,
            parking=False,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Flexible'
        )

    def test_creacion_precio_especial_valido(self):
        precio = PrecioEspecial.objects.create(
            propiedad=self.propiedad,
            fecha_inicio=now().date() + timedelta(days=1),
            fecha_fin=now().date() + timedelta(days=5),
            precio_especial=99.99
        )
        self.assertEqual(precio.propiedad, self.propiedad)
        self.assertEqual(precio.precio_especial, 99.99)

    def test_fecha_inicio_mayor_que_fecha_fin(self):
        precio = PrecioEspecial(
            propiedad=self.propiedad,
            fecha_inicio=now().date() + timedelta(days=5),
            fecha_fin=now().date() + timedelta(days=1),
            precio_especial=99.99
        )
        with self.assertRaises(ValidationError) as ctx:
            precio.clean()
        self.assertIn('inicio no puede ser posterior', str(ctx.exception))

    def test_fecha_inicio_pasada(self):
        precio = PrecioEspecial(
            propiedad=self.propiedad,
            fecha_inicio=now().date() - timedelta(days=1),
            fecha_fin=now().date() + timedelta(days=2),
            precio_especial=50
        )
        with self.assertRaises(ValidationError) as ctx:
            precio.clean()
        self.assertIn('inicio no puede ser anterior', str(ctx.exception))

    def test_unique_together(self):
        PrecioEspecial.objects.create(
            propiedad=self.propiedad,
            fecha_inicio=date.today() + timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=3),
            precio_especial=90
        )
        with self.assertRaises(Exception):  # IntegrityError OR ValidationError
            PrecioEspecial.objects.create(
                propiedad=self.propiedad,
                fecha_inicio=date.today() + timedelta(days=1),
                fecha_fin=date.today() + timedelta(days=3),
                precio_especial=95
            )

    def test_str_repr(self):
        precio = PrecioEspecial.objects.create(
            propiedad=self.propiedad,
            fecha_inicio=date.today() + timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=2),
            precio_especial=120
        )
        self.assertIn("Precio especial de 120", str(precio))


class PropiedadModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678Z',
            telefono='600000001',
            direccion='Calle Falsa 123',
            biografia='Usuario test',
            fecha_de_nacimiento=date(1990, 5, 20)
        )

    def test_creacion_propiedad_valida(self):
        propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Villa Test',
            descripcion='Una villa de prueba',
            direccion='Calle Prueba 1',
            ciudad='Madrid',
            pais='España',
            codigo_postal='28001',
            tipo_de_propiedad='Villa',
            precio_por_noche=250.00,
            maximo_huespedes=6,
            numero_de_habitaciones=3,
            numero_de_banos=2,
            numero_de_camas=3,
            tamano=120,
            wifi=True,
            aire_acondicionado=True,
            calefaccion=True,
            parking=True,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Moderada'
        )
        self.assertEqual(propiedad.nombre, 'Villa Test')
        self.assertTrue(propiedad.wifi)

    def test_str_repr(self):
        propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Apartamento Test',
            descripcion='Descripción',
            direccion='Calle Test 5',
            ciudad='Valencia',
            pais='España',
            codigo_postal='46000',
            tipo_de_propiedad='Apartamento',
            precio_por_noche=100,
            maximo_huespedes=2,
            numero_de_habitaciones=1,
            numero_de_banos=1,
            numero_de_camas=1,
            tamano=60,
            wifi=False,
            aire_acondicionado=False,
            calefaccion=True,
            parking=False,
            mascotas=False,
            permitido_fumar=True,
            politica_de_cancelacion='Flexible'
        )
        self.assertEqual(str(propiedad), 'Apartamento Test')

    def test_valoracion_promedio(self):
        propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa Valorada',
            descripcion='Casa para test de valoración',
            direccion='Calle X',
            ciudad='Sevilla',
            pais='España',
            codigo_postal='41001',
            tipo_de_propiedad='Casa',
            precio_por_noche=200,
            maximo_huespedes=4,
            numero_de_habitaciones=2,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=80,
            wifi=True,
            aire_acondicionado=False,
            calefaccion=True,
            parking=False,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Estricta'
        )

        # Crear el primer usuario
        user_val1 = User.objects.create_user(username='val_user_1', password='password123')
        usuario_val1 = Usuario.objects.create(
            usuario=user_val1,
            dni='11223344A',
            telefono='600000003',
            direccion='Calle Valorador',
            biografia='Usuario que valora',
            fecha_de_nacimiento=date(1992, 1, 1)
        )

        # Crear un segundo usuario
        user_val2 = User.objects.create_user(username='val_user_2', password='password123')
        usuario_val2 = Usuario.objects.create(
            usuario=user_val2,
            dni='22334455B',
            telefono='600000004',
            direccion='Calle Valorador 2',
            biografia='Usuario diferente',
            fecha_de_nacimiento=date(1993, 2, 2)
        )

        # Crear las valoraciones
        ValoracionPropiedad.objects.create(propiedad=propiedad, valoracion=4, usuario=usuario_val1)
        ValoracionPropiedad.objects.create(propiedad=propiedad, valoracion=5, usuario=usuario_val2)

        # Verificar que el promedio es correcto
        self.assertEqual(propiedad.valoracion_promedio_propiedad(), 4.5)



class FechaBloqueadaModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='password')
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='87654321B',
            telefono='600000002',
            direccion='Calle Bloqueo',
            biografia='Bloqueador de fechas',
            fecha_de_nacimiento=date(1985, 7, 10)
        )
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario,
            nombre='Casa con Fechas',
            descripcion='Casa con fechas bloqueadas',
            direccion='Calle Y',
            ciudad='Barcelona',
            pais='España',
            codigo_postal='08001',
            tipo_de_propiedad='Casa',
            precio_por_noche=180,
            maximo_huespedes=5,
            numero_de_habitaciones=2,
            numero_de_banos=2,
            numero_de_camas=2,
            tamano=90,
            wifi=True,
            aire_acondicionado=True,
            calefaccion=False,
            parking=False,
            mascotas=True,
            permitido_fumar=True,
            politica_de_cancelacion='Moderada'
        )

    def test_fecha_bloqueada_valida(self):
        bloqueada = FechaBloqueada.objects.create(
            propiedad=self.propiedad,
            fecha=date.today() + timedelta(days=3)
        )
        self.assertEqual(str(bloqueada), f'{self.propiedad.nombre} - {bloqueada.fecha}')

    def test_fecha_bloqueada_pasada_invalida(self):
        bloqueada = FechaBloqueada(
            propiedad=self.propiedad,
            fecha=date.today() - timedelta(days=1)
        )
        with self.assertRaises(ValidationError):
            bloqueada.clean()

    def test_unique_fecha_bloqueada(self):
        FechaBloqueada.objects.create(
            propiedad=self.propiedad,
            fecha=date.today() + timedelta(days=5)
        )
        with self.assertRaises(Exception):  # Puede ser IntegrityError o similar
            FechaBloqueada.objects.create(
                propiedad=self.propiedad,
                fecha=date.today() + timedelta(days=5)
            )



class ReservaModelTest(TestCase):

    def setUp(self):
        # Crear un usuario para el anfitrión
        self.usuario_anfitrion = Usuario.objects.create(
            usuario=User.objects.create_user(username='anfitrion1', password='password123'),
            dni='12345678A',
            telefono='600000001',
            direccion='Calle Anfitrión',
            biografia='Anfitrión de prueba',
            fecha_de_nacimiento=date(1980, 1, 1)
        )
        
        # Crear un usuario para el usuario que realiza la reserva
        self.usuario_reservante = Usuario.objects.create(
            usuario=User.objects.create_user(username='usuario1', password='password123'),
            dni='87654321B',
            telefono='600000002',
            direccion='Calle Usuario',
            biografia='Usuario de prueba',
            fecha_de_nacimiento=date(1990, 1, 1)
        )

        # Crear una propiedad para reservar
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario_anfitrion,
            nombre='Casa de prueba',
            descripcion='Una casa para probar reservas',
            direccion='Calle Propiedad',
            ciudad='Madrid',
            pais='España',
            codigo_postal='28001',
            tipo_de_propiedad='Casa',
            precio_por_noche=100,
            maximo_huespedes=4,
            numero_de_habitaciones=2,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=80,
            wifi=True,
            aire_acondicionado=False,
            calefaccion=True,
            parking=False,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Estricta'
        )

    def test_crear_reserva_valida(self):
        # Crear una reserva válida
        reserva = Reserva.objects.create(
            propiedad=self.propiedad,
            anfitrion=self.usuario_anfitrion,
            usuario=self.usuario_reservante,
            fecha_llegada=date(2025, 5, 1),
            fecha_salida=date(2025, 5, 7),
            numero_personas=2,
            precio_por_noche=100,
            precio_total=600,
            estado='Pendiente',
            metodo_pago='Tarjeta de crédito'
        )

        # Verificar que la reserva se ha creado correctamente
        self.assertEqual(reserva.propiedad, self.propiedad)
        self.assertEqual(reserva.usuario, self.usuario_reservante)
        self.assertEqual(reserva.precio_total, 600)
        self.assertEqual(reserva.estado, 'Pendiente')

    def test_reserva_fecha_salida_anterior_a_llegada(self):
        # Intentar crear una reserva con fecha de salida anterior a la llegada
        with self.assertRaises(ValidationError):
            reserva_invalida = Reserva(
                propiedad=self.propiedad,
                anfitrion=self.usuario_anfitrion,
                usuario=self.usuario_reservante,
                fecha_llegada=date(2025, 5, 1),
                fecha_salida=date(2025, 4, 30),
                numero_personas=2,
                precio_por_noche=100,
                precio_total=600,
                estado='Pendiente',
                metodo_pago='Tarjeta de crédito'
            )
            reserva_invalida.clean()

    def test_reserva_con_fecha_pasada(self):
        # Intentar crear una reserva con fecha de llegada pasada
        with self.assertRaises(ValidationError):
            reserva_invalida = Reserva(
                propiedad=self.propiedad,
                anfitrion=self.usuario_anfitrion,
                usuario=self.usuario_reservante,
                fecha_llegada=date(2023, 5, 1),
                fecha_salida=date(2023, 5, 7),
                numero_personas=2,
                precio_por_noche=100,
                precio_total=600,
                estado='Pendiente',
                metodo_pago='Tarjeta de crédito'
            )
            reserva_invalida.clean()

    def test_reserva_con_precio_negativo(self):
        # Intentar crear una reserva con precio negativo
        with self.assertRaises(ValidationError):
            reserva_invalida = Reserva(
                propiedad=self.propiedad,
                anfitrion=self.usuario_anfitrion,
                usuario=self.usuario_reservante,
                fecha_llegada=date(2025, 5, 1),
                fecha_salida=date(2025, 5, 7),
                numero_personas=2,
                precio_por_noche=-100,  # Precio negativo
                precio_total=-600,  # Precio total negativo
                estado='Pendiente',
                metodo_pago='Tarjeta de crédito'
            )
            reserva_invalida.clean()

    def test_reserva_unica_por_propiedad_y_fechas(self):
        # Crear una primera reserva
        reserva_1 = Reserva.objects.create(
            propiedad=self.propiedad,
            anfitrion=self.usuario_anfitrion,
            usuario=self.usuario_reservante,
            fecha_llegada=date(2025, 5, 1),
            fecha_salida=date(2025, 5, 7),
            numero_personas=2,
            precio_por_noche=100,
            precio_total=600,
            estado='Pendiente',
            metodo_pago='Tarjeta de crédito'
        )

        # Intentar crear una segunda reserva con las mismas fechas para la misma propiedad
        with self.assertRaises(IntegrityError):
            reserva_2 = Reserva.objects.create(
                propiedad=self.propiedad,
                anfitrion=self.usuario_anfitrion,
                usuario=self.usuario_reservante,
                fecha_llegada=date(2025, 5, 1),
                fecha_salida=date(2025, 5, 7),
                numero_personas=2,
                precio_por_noche=100,
                precio_total=600,
                estado='Pendiente',
                metodo_pago='PayPal'
            )




class ValoracionPropiedadModelTest(TestCase):

    def setUp(self):
        # Crear usuarios base
        user1 = User.objects.create_user(username='user1', email='user1@example.com', password='pass1234')
        user2 = User.objects.create_user(username='user2', email='user2@example.com', password='pass5678')

        # Crear perfiles de Usuario
        self.usuario1 = Usuario.objects.create(
            usuario=user1,
            dni='12345678A',
            telefono='600000001',
            direccion='Calle Falsa 123',
            fecha_de_nacimiento=date(1990, 5, 10)
        )

        self.usuario2 = Usuario.objects.create(
            usuario=user2,
            dni='87654321B',
            telefono='699999999',
            direccion='Avenida Siempre Viva 742',
            fecha_de_nacimiento=date(1995, 6, 15)
        )

        # Crear propiedad
        self.propiedad = Propiedad.objects.create(
            anfitrion=self.usuario1,
            nombre='Villa Tranquila',
            descripcion='Hermosa villa con vistas al mar.',
            direccion='Calle Playa 12',
            ciudad='Valencia',
            pais='España',
            codigo_postal='46001',
            tipo_de_propiedad='Villa',
            precio_por_noche=150.00,
            maximo_huespedes=6,
            numero_de_habitaciones=3,
            numero_de_banos=2,
            numero_de_camas=4,
            tamano=120,
            wifi=True,
            aire_acondicionado=True,
            calefaccion=True,
            parking=True,
            mascotas=True,
            permitido_fumar=False,
            politica_de_cancelacion='Flexible'
        )

    def test_valoracion_valida(self):
        valoracion = ValoracionPropiedad.objects.create(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=4.5,
            comentario='Una experiencia increíble.'
        )
        self.assertEqual(valoracion.valoracion, 4.5)
        self.assertEqual(valoracion.comentario, 'Una experiencia increíble.')

    def test_valoracion_fuera_de_rango_inferior(self):
        valoracion = ValoracionPropiedad(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=0.5,
            comentario='Muy mala.'
        )
        with self.assertRaises(ValidationError):
            valoracion.full_clean()

    def test_valoracion_fuera_de_rango_superior(self):
        valoracion = ValoracionPropiedad(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=5.5,
            comentario='Demasiado buena para ser real.'
        )
        with self.assertRaises(ValidationError):
            valoracion.full_clean()

    def test_valoracion_sin_comentario(self):
        valoracion = ValoracionPropiedad(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=4.0,
            comentario=''  # Campo obligatorio
        )
        with self.assertRaises(ValidationError):
            valoracion.full_clean()

    def test_valoracion_duplicada(self):
        ValoracionPropiedad.objects.create(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=4.0,
            comentario='Muy bien todo.'
        )

        duplicada = ValoracionPropiedad(
            propiedad=self.propiedad,
            usuario=self.usuario2,
            valoracion=3.0,
            comentario='Cambiaría algunas cosas.'
        )

        with self.assertRaises(ValidationError):
            duplicada.full_clean()


class ReservaPaypalTemporalModelTest(TestCase):

    def setUp(self):
        # Crear usuario de Django
        self.django_user = User.objects.create_user(
            username='paypaluser',
            password='password123',
            email='paypal@example.com'
        )

        # Crear instancia de Usuario (tu modelo extendido)
        self.usuario_app = Usuario.objects.create(
            usuario=self.django_user,
            dni='98765432X',
            telefono='600112233',
            direccion='Calle Paypal 123',
            biografia='Usuario para pruebas de PayPal.',
            fecha_de_nacimiento=date(1995, 10, 20)
        )

        self.sample_order_id = 'PAYPAL_ORDER_ID_12345'
        self.sample_datos_reserva = {
            'propiedad_id': 1,
            'fecha_llegada': '2025-12-24',
            'fecha_salida': '2025-12-26',
            'precio_total': 250.75,
            'numero_personas': 2
        }

    def test_creacion_reserva_paypal_temporal(self):
        """
        Prueba la creación de una instancia de ReservaPaypalTemporal.
        """
        reserva_temporal = ReservaPaypalTemporal.objects.create(
            order_id=self.sample_order_id,
            usuario=self.usuario_app,
            datos_reserva=self.sample_datos_reserva
        )
        self.assertEqual(reserva_temporal.order_id, self.sample_order_id)
        self.assertEqual(reserva_temporal.usuario, self.usuario_app)
        self.assertEqual(reserva_temporal.datos_reserva['propiedad_id'], self.sample_datos_reserva['propiedad_id'])
        self.assertEqual(reserva_temporal.datos_reserva['precio_total'], self.sample_datos_reserva['precio_total'])
        self.assertIsNotNone(reserva_temporal.creado_en)
        self.assertTrue(reserva_temporal.creado_en <= timezone.now())

    def test_order_id_unique(self):
        """
        Prueba la restricción de unicidad en el campo order_id.
        """
        ReservaPaypalTemporal.objects.create(
            order_id=self.sample_order_id,
            usuario=self.usuario_app,
            datos_reserva=self.sample_datos_reserva
        )
        with self.assertRaises(IntegrityError):
            ReservaPaypalTemporal.objects.create(
                order_id=self.sample_order_id, # Mismo order_id
                usuario=self.usuario_app,
                datos_reserva={'otra_info': 'diferente'}
            )

    def test_datos_reserva_json_field(self):
        """
        Prueba que el campo JSONField almacena y recupera datos correctamente.
        """
        datos_complejos = {
            'id_reserva_original': 'abc-123',
            'items': [
                {'nombre': 'noche_estancia', 'cantidad': 2, 'precio_unitario': 100},
                {'nombre': 'servicio_limpieza', 'cantidad': 1, 'precio_unitario': 50.75}
            ],
            'descuento_aplicado': None,
            'notas_cliente': 'Llegaremos tarde.'
        }
        reserva_temporal = ReservaPaypalTemporal.objects.create(
            order_id='JSON_TEST_ORDER_ID',
            usuario=self.usuario_app,
            datos_reserva=datos_complejos
        )
        retrieved_reserva = ReservaPaypalTemporal.objects.get(order_id='JSON_TEST_ORDER_ID')
        self.assertEqual(retrieved_reserva.datos_reserva, datos_complejos)
        self.assertEqual(retrieved_reserva.datos_reserva['items'][0]['nombre'], 'noche_estancia')

    def test_creado_en_auto_now_add(self):
        """
        Prueba que el campo creado_en se establece automáticamente al crear.
        """
        # Pequeña demora para asegurar que el tiempo cambie si es necesario
        # En la práctica, la resolución del reloj suele ser suficiente.
        # import time
        # time.sleep(0.001)

        now_before_create = timezone.now()
        reserva_temporal = ReservaPaypalTemporal.objects.create(
            order_id='TIMESTAMP_ORDER_ID',
            usuario=self.usuario_app,
            datos_reserva=self.sample_datos_reserva
        )
        # El tiempo de creación debe ser mayor o igual al tiempo antes de la creación
        # y menor o igual al tiempo actual (después de la creación)
        self.assertTrue(now_before_create <= reserva_temporal.creado_en <= timezone.now())

    def test_str_representation(self):
        """
        Prueba la representación en cadena del modelo.
        """
        reserva_temporal = ReservaPaypalTemporal.objects.create(
            order_id=self.sample_order_id,
            usuario=self.usuario_app,
            datos_reserva=self.sample_datos_reserva
        )
        expected_str = f"Reserva temporal PayPal {self.sample_order_id}"
        self.assertEqual(str(reserva_temporal), expected_str)

    def test_relacion_usuario_on_delete_cascade(self):
        """
        Prueba que si se elimina el Usuario, la ReservaPaypalTemporal asociada se elimina.
        """
        reserva_temporal = ReservaPaypalTemporal.objects.create(
            order_id=self.sample_order_id,
            usuario=self.usuario_app,
            datos_reserva=self.sample_datos_reserva
        )
        order_id_temp = reserva_temporal.order_id
        self.assertEqual(ReservaPaypalTemporal.objects.count(), 1)

        # Eliminar el usuario de Django (que debería desencadenar la eliminación de Usuario_app si está configurado)
        # O directamente el self.usuario_app
        self.usuario_app.delete() # Esto debería eliminar en cascada la ReservaPaypalTemporal

        with self.assertRaises(ReservaPaypalTemporal.DoesNotExist):
            ReservaPaypalTemporal.objects.get(order_id=order_id_temp)
        self.assertEqual(ReservaPaypalTemporal.objects.count(), 0)
