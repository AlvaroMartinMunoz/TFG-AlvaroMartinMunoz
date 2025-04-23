# En propiedad/tests/test_serializers.py

from django.test import TestCase
from django.contrib.auth.models import User
from usuario.models.usuario import Usuario
from propiedad.models.propiedad import Propiedad
from propiedad.models.valoracionPropiedad import ValoracionPropiedad
from propiedad.models.fotoPropiedad import FotoPropiedad
from propiedad.models.propiedad import FechaBloqueada
from propiedad.models.reserva import Reserva
from propiedad.models.favorito import Favorito
from propiedad.models.precioEspecial import PrecioEspecial
from propiedad.serializers import (
    PropiedadSerializer,
    ValoracionPropiedadSerializer,
    FotoPropiedadSerializer,
    FechaBloqueadaSerializer,
    ReservaSerializer,
    FavoritoSerializer,
    PrecioEspecialSerializer
)
from datetime import date, timedelta
from django.utils import timezone
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile # Para FotoPropiedad

# Helper para imagen (puedes ponerlo aquí o importar)
def create_test_image(name='test_image.jpg', content_type='image/jpeg', size=1024):
    return SimpleUploadedFile(name, b'0' * size, content_type=content_type)

class PropiedadSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        user = User.objects.create_user('testanfitrion', 'test@host.com', 'password')
        cls.anfitrion = Usuario.objects.create(usuario=user, dni='11111111P', telefono='61111111P', direccion='Dir Prop Test', fecha_de_nacimiento=date(1985,1,1))
        cls.propiedad = Propiedad.objects.create(
            anfitrion=cls.anfitrion, nombre='Casa Serializer Test', descripcion='Desc Test',
            direccion='Dir Ser Test 1', ciudad='CitySer', pais='CountrySer', codigo_postal='12121',
            tipo_de_propiedad='Casa', precio_por_noche=Decimal('120.50'), maximo_huespedes=5,
            numero_de_habitaciones=3, numero_de_banos=2, numero_de_camas=4, tamano=110, politica_de_cancelacion='Moderada'
        )
        # Crear algunas valoraciones para probar el método promedio
        user_val1 = User.objects.create_user('val1', 'v1@t.com', 'p')
        user_val2 = User.objects.create_user('val2', 'v2@t.com', 'p')
        cls.usuario_val1 = Usuario.objects.create(usuario=user_val1, dni='22222222P', telefono='62222222P', direccion='Dir Val 1', fecha_de_nacimiento=date(1990,1,1))
        cls.usuario_val2 = Usuario.objects.create(usuario=user_val2, dni='33333333P', telefono='63333333P', direccion='Dir Val 2', fecha_de_nacimiento=date(1991,1,1))
        ValoracionPropiedad.objects.create(propiedad=cls.propiedad, usuario=cls.usuario_val1, valoracion=5)
        ValoracionPropiedad.objects.create(propiedad=cls.propiedad, usuario=cls.usuario_val2, valoracion=3)



    def test_serializacion_contiene_campos_esperados(self):
        """Verifica que todos los campos del modelo y el campo calculado están presentes."""
        serializer = PropiedadSerializer(self.propiedad)
        data = serializer.data
        # Verificamos algunos campos clave y el calculado
        self.assertIn('id', data)
        self.assertIn('nombre', data)
        self.assertIn('anfitrion', data) # Se serializa como ID por defecto
        self.assertEqual(data['nombre'], self.propiedad.nombre)
        self.assertEqual(data['anfitrion'], self.anfitrion.id)
        # Verificar campo calculado
        self.assertIn('valoracion_promedio', data)
        self.assertIsInstance(data['valoracion_promedio'], float) # El método devuelve float

    def test_serializacion_valoracion_promedio_calculada(self):
        """Verifica que la valoración promedio se calcula correctamente."""
        serializer = PropiedadSerializer(self.propiedad)
        # Promedio de 5 y 3 es 4.0
        self.assertEqual(serializer.data['valoracion_promedio'], 4.0)

        # Probamos con una propiedad sin valoraciones
        propiedad_sin_val = Propiedad.objects.create(
             anfitrion=self.anfitrion, nombre='Casa Sin Vals', descripcion='Desc Sin Vals',
            direccion='Dir Ser Test 2', ciudad='CitySer', pais='CountrySer', codigo_postal='13131',
            tipo_de_propiedad='Casa', precio_por_noche=Decimal('100.00'), maximo_huespedes=2,
             numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=40, politica_de_cancelacion='Flexible'
        )
        serializer_sin_val = PropiedadSerializer(propiedad_sin_val)
        # El método valoracion_promedio_propiedad devuelve None si no hay valoraciones
        self.assertIsNone(serializer_sin_val.data['valoracion_promedio'])

    def test_deserializacion_valida(self):
        """Verifica que datos válidos pasan la validación y crean el objeto."""
        valid_data = {
            'anfitrion': self.anfitrion.id, # FK como ID
            'nombre': 'Nueva Prop Serializer', 'descripcion': 'Desc Nueva',
            'direccion': 'Dir Nueva', 'ciudad': 'CityNueva', 'pais': 'CountryNuevo', 'codigo_postal': '54321',
            'tipo_de_propiedad': 'Villa', 'precio_por_noche': '150.00', 'maximo_huespedes': 4,
             'numero_de_habitaciones': 2, 'numero_de_banos': 1, 'numero_de_camas': 3, 'tamano': 100,
             'politica_de_cancelacion': 'Estricta'
             # No incluimos campos opcionales o calculados como 'valoracion_promedio'
        }
        serializer = PropiedadSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertIsInstance(instance, Propiedad)
        self.assertEqual(instance.nombre, valid_data['nombre'])
        self.assertEqual(instance.anfitrion, self.anfitrion)

    def test_deserializacion_campo_requerido_faltante(self):
        """Verifica que falla si falta un campo requerido."""
        invalid_data = { # Falta 'nombre'
            'anfitrion': self.anfitrion.id, 'descripcion': 'Desc Nueva',
            'direccion': 'Dir Nueva', 'ciudad': 'CityNueva', 'pais': 'CountryNuevo', 'codigo_postal': '54321',
            'tipo_de_propiedad': 'Villa', 'precio_por_noche': '150.00', 'maximo_huespedes': 4,
             'numero_de_habitaciones': 2, 'numero_de_banos': 1, 'numero_de_camas': 3, 'tamano': 100,
             'politica_de_cancelacion': 'Estricta'
        }
        serializer = PropiedadSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('nombre', serializer.errors)
        self.assertEqual(serializer.errors['nombre'][0].code, 'required')


class ValoracionPropiedadSerializerTest(TestCase):
    # (Similar a PropiedadSerializerTest: setUp con datos, test_serializacion, test_deserializacion_valida, test_deserializacion_invalida)
    @classmethod
    def setUpTestData(cls):
        # Crear usuario anfitrion, usuario huesped, propiedad
        user_a = User.objects.create_user('val_anf', 'va@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='44444444V', telefono='64444444V', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P Val', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='44444', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        user_h = User.objects.create_user('val_hue', 'vh@t.com', 'p')
        cls.huesped = Usuario.objects.create(usuario=user_h, dni='55555555V', telefono='65555555V', direccion='D', fecha_de_nacimiento=date(1991,1,1))
        cls.valoracion = ValoracionPropiedad.objects.create(propiedad=cls.prop, usuario=cls.huesped, valoracion=4, comentario="OK")
        user_h2 = User.objects.create_user('val_hue2', 'vh2@t.com', 'p')
        cls.huesped2 = Usuario.objects.create(usuario=user_h2, dni='66666666V', telefono='66666666V', direccion='D2', fecha_de_nacimiento=date(1992,1,1))


    def test_serializacion_valoracion(self):
        serializer = ValoracionPropiedadSerializer(self.valoracion)
        data = serializer.data
        self.assertEqual(data['id'], self.valoracion.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertEqual(data['usuario'], self.huesped.id)
        self.assertEqual(data['valoracion'], 4)
        self.assertEqual(data['comentario'], "OK")

    def test_deserializacion_valoracion_valida(self):
        valid_data = {'propiedad': self.prop.id, 'usuario': self.huesped2.id, 'valoracion': 5, 'comentario': 'Genial!'}
        serializer = ValoracionPropiedadSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.valoracion, 5)

    def test_deserializacion_valoracion_invalida_rango(self):
        # Asumiendo que el modelo ValoracionPropiedad tiene validadores de rango (ej: 1 a 5)
        invalid_data = {'propiedad': self.prop.id, 'usuario': self.huesped2.id, 'valoracion': 6, 'comentario': 'Fuera de rango'}
        serializer = ValoracionPropiedadSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('valoracion', serializer.errors)


class FotoPropiedadSerializerTest(TestCase):
    # (setUp con datos, test_serializacion, tests de validación)
    @classmethod
    def setUpTestData(cls):
        user_a = User.objects.create_user('foto_anf', 'fa@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='44455544F', telefono='64455544F', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P Foto', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='45454', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        cls.foto = FotoPropiedad.objects.create(propiedad=cls.prop, foto=create_test_image('test.jpg'), es_portada=True)

    def test_serializacion_foto(self):
        serializer = FotoPropiedadSerializer(self.foto)
        data = serializer.data
        self.assertEqual(data['id'], self.foto.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertTrue(data['foto'].endswith('.jpg')) # Verifica que la URL de la foto está presente
        self.assertTrue(data['es_portada'])

    # Nota: Testear deserialización/creación de ImageField es más complejo,
    # usualmente se prueba más a nivel de vista/integración. Se pueden validar otros campos.
    def test_deserializacion_foto_valida_campos_no_imagen(self):
        # Creamos una nueva propiedad para no violar unique_together de FotoPropiedad si existiera
        prop2 = Propiedad.objects.create(anfitrion=self.anfitrion, nombre='P Foto 2', descripcion='D', direccion='D2', ciudad='C', pais='P', codigo_postal='45455', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        valid_data = {'propiedad': prop2.id, 'es_portada': False}
        # No incluimos 'foto' aquí, ModelSerializer podría requerirlo o no.
        # Si lo requiere, este test fallaría y habría que ajustar.
        serializer = FotoPropiedadSerializer(data=valid_data)
        # Ajusta la expectativa según si 'foto' es requerido por el serializer
        # self.assertTrue(serializer.is_valid(), serializer.errors)
        # O
        self.assertFalse(serializer.is_valid())
        self.assertIn('foto', serializer.errors)


class FechaBloqueadaSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_a = User.objects.create_user('fb_anf', 'fba@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='11188811F', telefono='61188811F', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P FB', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='18181', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        cls.fecha = timezone.now().date() + timedelta(days=5)
        cls.fb = FechaBloqueada.objects.create(propiedad=cls.prop, fecha=cls.fecha)

    def test_serializacion_fecha_bloqueada(self):
        serializer = FechaBloqueadaSerializer(self.fb)
        data = serializer.data
        self.assertEqual(data['id'], self.fb.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertEqual(data['fecha'], self.fecha.strftime('%Y-%m-%d'))

    def test_deserializacion_fb_valida(self):
        fecha_nueva = self.fecha + timedelta(days=1)
        valid_data = {'propiedad': self.prop.id, 'fecha': fecha_nueva.strftime('%Y-%m-%d')}
        serializer = FechaBloqueadaSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.fecha, fecha_nueva)

    def test_deserializacion_fb_duplicada(self):
        # Intentar crear una con la misma propiedad y fecha que self.fb
        invalid_data = {'propiedad': self.prop.id, 'fecha': self.fecha.strftime('%Y-%m-%d')}
        serializer = FechaBloqueadaSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        # DRF debe detectar unique_together
        self.assertIn('non_field_errors', serializer.errors)
        self.assertEqual(serializer.errors['non_field_errors'][0].code, 'unique')


class ReservaSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Crear anfitrion, huesped, propiedad
        user_a = User.objects.create_user('res_anf', 'ra@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='88811188R', telefono='68811188R', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P Res', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='81818', tipo_de_propiedad='Casa', precio_por_noche=Decimal('100.00'), maximo_huespedes=2, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        user_h = User.objects.create_user('res_hue', 'rh@t.com', 'p')
        cls.huesped = Usuario.objects.create(usuario=user_h, dni='11188811R', telefono='61188811R', direccion='D', fecha_de_nacimiento=date(1991,1,1))
        cls.llegada = timezone.now().date() + timedelta(days=10)
        cls.salida = timezone.now().date() + timedelta(days=15)
        cls.reserva = Reserva.objects.create(
            propiedad=cls.prop, anfitrion=cls.anfitrion, usuario=cls.huesped,
            fecha_llegada=cls.llegada, fecha_salida=cls.salida, numero_personas=2,
            precio_por_noche=cls.prop.precio_por_noche, precio_total=cls.prop.precio_por_noche*5,
            estado='Pendiente', metodo_pago='PayPal'
        )

    def test_serializacion_reserva(self):
        serializer = ReservaSerializer(self.reserva)
        data = serializer.data
        self.assertEqual(data['id'], self.reserva.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertEqual(data['anfitrion'], self.anfitrion.id)
        self.assertEqual(data['usuario'], self.huesped.id)
        self.assertEqual(data['fecha_llegada'], self.llegada.strftime('%Y-%m-%d'))
        self.assertEqual(data['fecha_salida'], self.salida.strftime('%Y-%m-%d'))
        self.assertEqual(data['estado'], 'Pendiente')
        # ... verificar otros campos ...

    def test_deserializacion_reserva_valida_minima(self):
        # Probamos a validar solo con los campos que un usuario enviaría
        # Asumiendo que el ViewSet/perform_create asigna el resto
        llegada_nueva = timezone.now().date() + timedelta(days=20)
        salida_nueva = timezone.now().date() + timedelta(days=25)
        valid_data = {
            'propiedad': self.prop.id,
            'fecha_llegada': llegada_nueva.strftime('%Y-%m-%d'),
            'fecha_salida': salida_nueva.strftime('%Y-%m-%d'),
            'numero_personas': 1,
            'metodo_pago': 'Tarjeta de crédito'
            # Faltan: anfitrion, usuario, estado, precios (se asignarían en save/perform_create)
        }
        serializer = ReservaSerializer(data=valid_data)
        # is_valid() fallará porque faltan campos requeridos por el serializer (__all__)
        self.assertFalse(serializer.is_valid())
        self.assertIn('anfitrion', serializer.errors)
        self.assertIn('usuario', serializer.errors)
        self.assertIn('estado', serializer.errors)
        self.assertIn('precio_por_noche', serializer.errors)
        self.assertIn('precio_total', serializer.errors)
        # Para testear save(), necesitaríamos mockear o asignar estos campos de alguna forma,
        # o definir el serializer de forma más explícita (con read_only_fields).


class FavoritoSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_a = User.objects.create_user('fav_anf', 'fava@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='99911199F', telefono='69911199F', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P Fav', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='91919', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        user_u = User.objects.create_user('fav_usr', 'favu@t.com', 'p')
        cls.usuario = Usuario.objects.create(usuario=user_u, dni='11199911F', telefono='61199911F', direccion='D', fecha_de_nacimiento=date(1991,1,1))
        cls.fav = Favorito.objects.create(propiedad=cls.prop, usuario=cls.usuario)

    def test_serializacion_favorito(self):
        serializer = FavoritoSerializer(self.fav)
        data = serializer.data
        self.assertEqual(data['id'], self.fav.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertEqual(data['usuario'], self.usuario.id)

    def test_deserializacion_favorito_valida(self):
        # Necesitamos otra propiedad u otro usuario para crear uno nuevo
        prop2 = Propiedad.objects.create(anfitrion=self.anfitrion, nombre='P Fav 2', descripcion='D', direccion='D2', ciudad='C', pais='P', codigo_postal='91918', tipo_de_propiedad='Casa', precio_por_noche=100, maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        valid_data = {'propiedad': prop2.id, 'usuario': self.usuario.id}
        serializer = FavoritoSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.propiedad, prop2)
        self.assertEqual(instance.usuario, self.usuario)

    def test_deserializacion_favorito_duplicado(self):
        # Intentar recrear self.fav
        invalid_data = {'propiedad': self.prop.id, 'usuario': self.usuario.id}
        serializer = FavoritoSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertEqual(serializer.errors['non_field_errors'][0].code, 'unique')


class PrecioEspecialSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_a = User.objects.create_user('pe_anf', 'pea@t.com', 'p')
        cls.anfitrion = Usuario.objects.create(usuario=user_a, dni='77711177P', telefono='67711177P', direccion='D', fecha_de_nacimiento=date(1990,1,1))
        cls.prop = Propiedad.objects.create(anfitrion=cls.anfitrion, nombre='P PE', descripcion='D', direccion='D', ciudad='C', pais='P', codigo_postal='71717', tipo_de_propiedad='Casa', precio_por_noche=Decimal('100.00'), maximo_huespedes=1, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=10, politica_de_cancelacion='Flexible')
        cls.fecha_i = timezone.now().date() + timedelta(days=5)
        cls.fecha_f = timezone.now().date() + timedelta(days=10)
        cls.pe = PrecioEspecial.objects.create(propiedad=cls.prop, fecha_inicio=cls.fecha_i, fecha_fin=cls.fecha_f, precio_especial=Decimal('80.00'))

    def test_serializacion_precio_especial(self):
        serializer = PrecioEspecialSerializer(self.pe)
        data = serializer.data
        self.assertEqual(data['id'], self.pe.id)
        self.assertEqual(data['propiedad'], self.prop.id)
        self.assertEqual(data['fecha_inicio'], self.fecha_i.strftime('%Y-%m-%d'))
        self.assertEqual(data['fecha_fin'], self.fecha_f.strftime('%Y-%m-%d'))
        self.assertEqual(data['precio_especial'], '80.00') # Decimal se serializa como string

    def test_deserializacion_pe_valida(self):
        fecha_i_n = self.fecha_i + timedelta(days=10)
        fecha_f_n = self.fecha_f + timedelta(days=10)
        valid_data = {
            'propiedad': self.prop.id,
            'fecha_inicio': fecha_i_n.strftime('%Y-%m-%d'),
            'fecha_fin': fecha_f_n.strftime('%Y-%m-%d'),
            'precio_especial': '75.50'
        }
        serializer = PrecioEspecialSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.precio_especial, Decimal('75.50'))

    def test_deserializacion_pe_precio_invalido_cero(self):
        invalid_data = { # Precio 0, viola MinValueValidator(1)
            'propiedad': self.prop.id,
            'fecha_inicio': (self.fecha_i + timedelta(days=10)).strftime('%Y-%m-%d'),
            'fecha_fin': (self.fecha_f + timedelta(days=10)).strftime('%Y-%m-%d'),
            'precio_especial': '0.00'
        }
        serializer = PrecioEspecialSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('precio_especial', serializer.errors)

    def test_deserializacion_pe_precio_invalido_demasiado_alto(self):
        invalid_data = { # Precio 6000, viola MaxValueValidator(5000)
            'propiedad': self.prop.id,
            'fecha_inicio': (self.fecha_i + timedelta(days=10)).strftime('%Y-%m-%d'),
            'fecha_fin': (self.fecha_f + timedelta(days=10)).strftime('%Y-%m-%d'),
            'precio_especial': '6000.00'
        }
        serializer = PrecioEspecialSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('precio_especial', serializer.errors)

    def test_deserializacion_pe_duplicado(self):
        # Intentar recrear self.pe
        invalid_data = {
            'propiedad': self.prop.id,
            'fecha_inicio': self.fecha_i.strftime('%Y-%m-%d'),
            'fecha_fin': self.fecha_f.strftime('%Y-%m-%d'),
            'precio_especial': '85.00' # Mismo rango, diferente precio
        }
        serializer = PrecioEspecialSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors) # Por unique_together
        self.assertEqual(serializer.errors['non_field_errors'][0].code, 'unique')