from django.test import TestCase
from django.utils import timezone
from ..models.clickPropiedad import ClickPropiedad
from ..models.propiedad import Propiedad
from usuario.models.usuario import Usuario
from django.contrib.auth.models import User
from datetime import date
from ..models.favorito import Favorito
from ..models.fotoPropiedad import FotoPropiedad
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError



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

