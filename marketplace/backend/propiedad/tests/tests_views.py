from usuario.models.usuario import Usuario
from ..models.propiedad import Propiedad
from django.contrib.auth.models import User
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from ..models.clickPropiedad import ClickPropiedad
from rest_framework.test import APITestCase
from ..models.fotoPropiedad import FotoPropiedad
from datetime import date, timedelta
from ..models.valoracionPropiedad import ValoracionPropiedad


class PropiedadViewSetTest(APITestCase):
    def setUp(self):
        # Crear usuarios de Django
        self.host_user = User.objects.create_user('host', 'host@test.com', 'pass')
        self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

        # Crear perfiles de Usuario con todos los campos requeridos
        self.host = Usuario.objects.create(
            usuario=self.host_user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle del Host 1',
            fecha_de_nacimiento='1990-05-15'
        )
        self.other = Usuario.objects.create(
            usuario=self.other_user,
            dni='87654321B',
            telefono='698765432',
            direccion='Calle del Otro 2',
            fecha_de_nacimiento='1992-07-20'
        )

        # Crear una propiedad con todos los campos obligatorios
        self.prop = Propiedad.objects.create(
            anfitrion=self.host,
            nombre='MiCasa',
            descripcion='Descripción de prueba',
            direccion='Calle Falsa 123',
            ciudad='Madrid',
            pais='España',
            codigo_postal='28080',
            tipo_de_propiedad='Casa',
            precio_por_noche=100.00,
            maximo_huespedes=4,
            numero_de_habitaciones=2,
            numero_de_banos=1,
            numero_de_camas=2,
            tamano=50,
            wifi=True,
            aire_acondicionado=False,
            calefaccion=True,
            parking=False,
            mascotas=False,
            permitido_fumar=False,
            politica_de_cancelacion='Flexible'
        )

        # URLs de la API
        self.list_url = reverse('propiedad-list')
        self.detail_url = lambda pk: reverse('propiedad-detail', args=[pk])

    def test_retrieve_unauthenticated_no_click(self):
        """GET /propiedades/{id}/ sin auth no crea ClickPropiedad"""
        resp = self.client.get(self.detail_url(self.prop.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(ClickPropiedad.objects.count(), 0)

    def test_retrieve_host_no_click(self):
        """El anfitrión ve su propia propiedad y no se registra click"""
        self.client.force_authenticate(self.host_user)
        resp = self.client.get(self.detail_url(self.prop.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(ClickPropiedad.objects.count(), 0)

    def test_retrieve_non_owner_creates_click(self):
        """Un usuario distinto crea un ClickPropiedad la primera vez"""
        self.client.force_authenticate(self.other_user)
        resp = self.client.get(self.detail_url(self.prop.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(ClickPropiedad.objects.count(), 1)
        click = ClickPropiedad.objects.first()
        self.assertEqual(click.usuario, self.other)
        self.assertEqual(click.propiedad, self.prop)

    def test_retrieve_non_owner_no_duplicate_within_5s(self):
        """Si ya existe un click en los últimos 5s, no se duplica"""
        # Crear un click reciente manualmente
        reciente = ClickPropiedad.objects.create(usuario=self.other, propiedad=self.prop)
        reciente.timestamp = timezone.now()
        reciente.save()

        self.client.force_authenticate(self.other_user)
        resp = self.client.get(self.detail_url(self.prop.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(ClickPropiedad.objects.count(), 1)

    def test_create_requires_authentication(self):
        """POST /propiedades/ requiere autenticarse"""
        data = {
            'anfitrion': self.host.pk,
            'nombre': 'NuevaCasa',
            'descripcion': 'Desc',
            'direccion': 'Av. Siempre Viva 456',
            'ciudad': 'Barcelona',
            'pais': 'España',
            'codigo_postal': '08001',
            'tipo_de_propiedad': 'Apartamento',
            'precio_por_noche': '75.00',
            'maximo_huespedes': 2,
            'numero_de_habitaciones': 1,
            'numero_de_banos': 1,
            'numero_de_camas': 1,
            'tamano': 30,
            'wifi': False,
            'aire_acondicionado': True,
            'calefaccion': False,
            'parking': True,
            'mascotas': True,
            'permitido_fumar': False,
            'politica_de_cancelacion': 'Moderada'
        }
        # Sin autenticar
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Con autenticación
        self.client.force_authenticate(self.host_user)
        resp2 = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Propiedad.objects.filter(nombre='NuevaCasa').exists())

    def test_update_and_partial_update_permission(self):
        """Sólo el anfitrión puede (partial_)update"""
        url = self.detail_url(self.prop.pk)
        payload = {'nombre': 'CasaCambiada'}

        # Otro usuario intenta editar completamente
        self.client.force_authenticate(self.other_user)
        resp_put = self.client.put(url, payload, format='json')
        self.assertEqual(resp_put.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', resp_put.data)

        # Otro usuario intenta patch
        resp_patch_other = self.client.patch(url, payload, format='json')
        self.assertEqual(resp_patch_other.status_code, status.HTTP_403_FORBIDDEN)

        # Anfitrión edita parcialmente
        self.client.force_authenticate(self.host_user)
        resp_patch = self.client.patch(url, payload, format='json')
        self.assertEqual(resp_patch.status_code, status.HTTP_200_OK)
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.nombre, 'CasaCambiada')

    def test_destroy_permission(self):
        """Sólo el anfitrión puede eliminar la propiedad"""
        url = self.detail_url(self.prop.pk)

        # Otro usuario intenta eliminar
        self.client.force_authenticate(self.other_user)
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Anfitrión elimina exitosamente
        self.client.force_authenticate(self.host_user)
        resp2 = self.client.delete(url)
        self.assertEqual(resp2.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Propiedad.objects.filter(pk=self.prop.pk).exists())



class ValoracionPropiedadViewSetTest(APITestCase):
    def setUp(self):
        # Usuarios
        self.host_user = User.objects.create_user('host', 'host@test.com', 'pass')
        self.reviewer_user = User.objects.create_user('reviewer', 'rev@test.com', 'pass')
        self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

        # Perfiles
        self.host = Usuario.objects.create(
            usuario=self.host_user,
            dni='12345678A', telefono='600111222', direccion='C/ Host 1', fecha_de_nacimiento='1990-01-01'
        )
        self.reviewer = Usuario.objects.create(
            usuario=self.reviewer_user,
            dni='87654321B', telefono='600333444', direccion='C/ Rev 2', fecha_de_nacimiento='1992-02-02'
        )
        self.other = Usuario.objects.create(
            usuario=self.other_user,
            dni='11223344C', telefono='600555666', direccion='C/ Other 3', fecha_de_nacimiento='1994-03-03'
        )

        # Propiedad
        self.prop = Propiedad.objects.create(
            anfitrion=self.host,
            nombre='CasaTest', descripcion='Desc', direccion='Dir', ciudad='Ciudad', pais='Pais',
            codigo_postal='12345', tipo_de_propiedad='Casa', precio_por_noche=50.0,
            maximo_huespedes=2, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1,
            tamano=30, wifi=False, aire_acondicionado=False, calefaccion=False,
            parking=False, mascotas=False, permitido_fumar=False, politica_de_cancelacion='Flexible'
        )

        self.list_url = reverse('valoracionpropiedad-list')
        self.detail_url = lambda pk: reverse('valoracionpropiedad-detail', args=[pk])
        self.media_url = lambda pk: reverse('valoracionpropiedad-media-valoraciones', args=[pk])



    def test_create_unauthenticated(self):
        """POST crea valoración requiere auth"""
        data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 4, 'comentario': 'Good'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_fields(self):
        """Falta campo => 400"""
        self.client.force_authenticate(self.reviewer_user)
        data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 5}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', resp.data)

    def test_create_invalid_propiedad(self):
        """Propiedad no existe => 404"""
        self.client.force_authenticate(self.reviewer_user)
        data = {'propiedad': 9999, 'usuario': self.reviewer.id, 'valoracion': 3, 'comentario': 'Ok'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_out_of_range_valoracion(self):
        """Valoracion fuera de rango => 400"""
        self.client.force_authenticate(self.reviewer_user)
        data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 6, 'comentario': 'Bad'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_own_property(self):
        """Host no puede valorar propia propiedad => 403"""
        self.client.force_authenticate(self.host_user)
        data = {'propiedad': self.prop.id, 'usuario': self.host.id, 'valoracion': 4, 'comentario': 'Nice'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_success(self):
        """Crea valoración correctamente"""
        self.client.force_authenticate(self.reviewer_user)
        data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 5, 'comentario': 'Excelente'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ValoracionPropiedad.objects.filter(propiedad=self.prop, usuario=self.reviewer).exists())

    def test_create_duplicate(self):
        """Duplicado provoca 400"""
        self.client.force_authenticate(self.reviewer_user)
        ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=5, comentario='X')
        data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 3, 'comentario': 'Y'}
        resp = self.client.post(self.list_url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_permission(self):
        """Solo autor puede editar parcial"""
        v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
        url = self.detail_url(v.id)
        # otro usuario
        self.client.force_authenticate(self.other_user)
        resp = self.client.patch(url, {'comentario': 'B'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        # autor
        self.client.force_authenticate(self.reviewer_user)
        resp2 = self.client.patch(url, {'comentario': 'B'}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

    def test_update_permission(self):
        v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
        url = self.detail_url(v.id)
        # host intenta editar review
        self.client.force_authenticate(self.host_user)
        resp_host = self.client.put(url, {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':2, 'comentario':'C'}, format='json')
        self.assertEqual(resp_host.status_code, status.HTTP_403_FORBIDDEN)
        # otro usuario
        self.client.force_authenticate(self.other_user)
        resp_other = self.client.put(url, {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':2, 'comentario':'C'}, format='json')
        self.assertEqual(resp_other.status_code, status.HTTP_403_FORBIDDEN)
        # autor realiza put con todos los campos
        self.client.force_authenticate(self.reviewer_user)
        data_full = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':3, 'comentario':'D'}
        resp_author = self.client.put(url, data_full, format='json')
        self.assertEqual(resp_author.status_code, status.HTTP_200_OK)
        # Verificar cambio
        v.refresh_from_db()
        self.assertEqual(v.valoracion, 3)
        self.assertEqual(v.comentario, 'D')

    def test_destroy_permission(self):
        """Validar permisos destroy"""
        v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
        url = self.detail_url(v.id)
        # host intenta
        self.client.force_authenticate(self.host_user)
        resp_host = self.client.delete(url)
        self.assertEqual(resp_host.status_code, status.HTTP_403_FORBIDDEN)
        # otro usuario
        self.client.force_authenticate(self.other_user)
        resp_other = self.client.delete(url)
        self.assertEqual(resp_other.status_code, status.HTTP_403_FORBIDDEN)
        # autor
        self.client.force_authenticate(self.reviewer_user)
        resp_auth = self.client.delete(url)
        self.assertEqual(resp_auth.status_code, status.HTTP_204_NO_CONTENT)

    def test_media_valoraciones_no_property(self):
        url = self.media_url(9999)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_media_valoraciones_none(self):
        """Propiedad sin valoraciones => mensaje"""
        url = reverse('valoracionpropiedad-media-valoraciones', args=[self.prop.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('mensaje', resp.data)

    def test_media_valoraciones_with_reviews(self):
        """Calcula media y count"""
        # Crear dos valoraciones
        t1 = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
        t2 = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.other, valoracion=2, comentario='B')
        url = reverse('valoracionpropiedad-media-valoraciones', args=[self.prop.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['reseñas'], 2)
        self.assertAlmostEqual(resp.data['media'], 3.0)

def create_test_image(name='test_image.jpg', content_type='image/jpeg', size=1024):
        """Crea un SimpleUploadedFile simulando una imagen para tests."""
        return SimpleUploadedFile(name, b'0' * size, content_type=content_type)
    

class FotoPropiedadViewSetTestsEstilo(APITestCase): # Renombrado para evitar conflictos si mantienes ambos
    


    def setUp(self):
        """Configura los datos necesarios antes de cada test."""
        # Usuarios de Django
        self.anfitrion_user = User.objects.create_user('anfitriontest', 'anfitrion@test.com', 'password123')
        self.normal_user = User.objects.create_user('normaltest', 'normal@test.com', 'password123')
        self.other_user = User.objects.create_user('othertest', 'other@test.com', 'password123') # Otro usuario por si acaso

        # Perfiles de Usuario (modelo personalizado)
        fecha_nacimiento_valida = date.today() - timedelta(days=365*20) # Ejemplo: 20 años
        self.anfitrion = Usuario.objects.create(
        usuario=self.anfitrion_user,
        dni='12345678A', telefono='600111222', direccion='C/ Anfitrion 1', fecha_de_nacimiento=fecha_nacimiento_valida
        )
        self.normal = Usuario.objects.create(
        usuario=self.normal_user,
        dni='87654321B', telefono='600333444', direccion='C/ Normal 2', fecha_de_nacimiento=fecha_nacimiento_valida
            )
        # Creamos también el perfil para other_user si fuera necesario
        self.other = Usuario.objects.create(
             usuario=self.other_user,
             dni='11223344C', telefono='600555666', direccion='C/ Other 3', fecha_de_nacimiento=fecha_nacimiento_valida
        )


        # Propiedad asociada al anfitrión
        self.propiedad = Propiedad.objects.create(
                anfitrion=self.anfitrion,
                nombre='Villa Test setUp', # Nombre diferente para asegurar que es de setUp
                descripcion='Una villa para tests desde setUp',
                direccion='Av Test setUp 123', ciudad='Testville', pais='Testlandia', codigo_postal='12345',
                tipo_de_propiedad='Villa', precio_por_noche=150.00, maximo_huespedes=4,
                numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=3, tamano=100,
                politica_de_cancelacion='Flexible'
            )

            # FotoPropiedad inicial para la propiedad del anfitrión
        self.foto = FotoPropiedad.objects.create(
                propiedad=self.propiedad,
                foto=create_test_image(name='inicial_setup.jpg'),
                es_portada=True # Marcamos esta como portada inicial
            )

            # URLs (usando basename 'fotopropiedad' como en el ejemplo)
        self.list_url = reverse('fotopropiedad-list')
        self.detail_url = lambda pk: reverse('fotopropiedad-detail', args=[pk])
        self.upload_url = reverse('fotopropiedad-upload-photos')

            # Cliente API (se crea automáticamente en APITestCase como self.client)


    # --- Tests de Permisos (No Autenticado) ---

    def test_list_fotos_unauthenticated(self):
        """GET lista fotos no requiere auth (AllowAny)."""
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Verificamos que al menos nuestra foto inicial está en la lista
        self.assertTrue(any(item['id'] == self.foto.id for item in resp.data))

    def test_retrieve_foto_unauthenticated(self):
        """GET detalle foto no requiere auth (AllowAny)."""
        resp = self.client.get(self.detail_url(self.foto.id))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['id'], self.foto.id)

    def test_create_foto_unauthenticated(self):
        """POST crear foto requiere auth (IsAuthenticated)."""
        data = {
            'propiedadId': self.propiedad.id,
            'foto': create_test_image('unauth_create.jpg'),
            'es_portada': False
        }
        resp = self.client.post(self.list_url, data, format='multipart')
        # Esperamos 401 o 403 dependiendo de la config global de autenticación/permisos
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_update_foto_unauthenticated(self):
        """PUT actualizar foto requiere auth."""
        data = {'propiedadId': self.propiedad.id, 'es_portada': False}
        resp = self.client.put(self.detail_url(self.foto.id), data, format='json')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_partial_update_foto_unauthenticated(self):
        """PATCH actualizar foto requiere auth."""
        data = {'propiedadId': self.propiedad.id, 'es_portada': False}
        resp = self.client.patch(self.detail_url(self.foto.id), data, format='json')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_destroy_foto_unauthenticated(self):
        """DELETE eliminar foto requiere auth."""
        resp = self.client.delete(self.detail_url(self.foto.id))
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_upload_photos_unauthenticated(self):
        """POST upload_photos requiere auth."""
        data = {
            'propiedadId': self.propiedad.id,
            'fotos': [create_test_image('multi1_noauth.jpg')],
            'es_portada': [False]
        }
        resp = self.client.post(self.upload_url, data, format='multipart')
        self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


    # --- Tests de Permisos (Autenticado - No Anfitrión) ---

    def test_create_foto_authenticated_not_owner(self):
        """POST crear foto como usuario normal falla (403)."""
        self.client.force_authenticate(user=self.normal_user)
        data = {
            'propiedadId': self.propiedad.id,
            'foto': create_test_image('not_owner_create.jpg'),
            'es_portada': False
        }
        resp = self.client.post(self.list_url, data, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'No tienes permiso para subir fotos a esta propiedad')

    def test_update_foto_authenticated_not_owner(self):
        """PUT actualizar foto como usuario normal falla (403)."""
        self.client.force_authenticate(user=self.normal_user)
        data = {'propiedadId': self.propiedad.id, 'es_portada': False}
        resp = self.client.put(self.detail_url(self.foto.id), data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'No tienes permiso para actualizar fotos de esta propiedad')

    def test_partial_update_foto_authenticated_not_owner(self):
        """PATCH actualizar foto como usuario normal falla (403)."""
        self.client.force_authenticate(user=self.normal_user)
        data = {'propiedadId': self.propiedad.id, 'es_portada': False}
        resp = self.client.patch(self.detail_url(self.foto.id), data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'No tienes permiso para actualizar fotos de esta propiedad')

    def test_destroy_foto_authenticated_not_owner(self):
        """DELETE eliminar foto como usuario normal falla (403)."""
        self.client.force_authenticate(user=self.normal_user)
        resp = self.client.delete(self.detail_url(self.foto.id))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'No tienes permiso para eliminar esta foto')

    def test_upload_photos_authenticated_not_owner(self):
        """POST upload_photos como usuario normal falla (403)."""
        self.client.force_authenticate(user=self.normal_user)
        data = {
            'propiedadId': self.propiedad.id,
            'fotos': [create_test_image('multi1_notowner.jpg')],
            'es_portada': [False]
        }
        resp = self.client.post(self.upload_url, data, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'No tienes permiso para subir fotos a esta propiedad')


    # --- Tests de Funcionalidad (Autenticado - Anfitrión) ---


    def test_create_foto_owner_success(self):
        """POST crear foto como anfitrión funciona (201)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        # Contamos fotos ANTES
        initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()

        # Preparamos datos para crear una foto, no portada
        foto_nueva = create_test_image('owner_create.jpg')
        data = {
            'propiedadId': self.propiedad.id,
            'foto': foto_nueva,
            'es_portada': 'false' # Enviamos 'false' como string
        }

        # Hacemos la petición POST
        resp = self.client.post(self.list_url, data, format='multipart')

        # 1. Verificamos respuesta HTTP y mensaje JSON
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], 'foto subida')

        # 2. Verificamos que el contador de fotos aumentó en 1
        final_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
        self.assertEqual(final_count, initial_count + 1, "El número de fotos no aumentó en 1.")

        # 3. (Opcional pero recomendado) Recuperamos la última foto y verificamos sus datos
        try:
            # Buscamos la foto más reciente añadida a esta propiedad
            foto_creada = FotoPropiedad.objects.filter(propiedad=self.propiedad).latest('id')
            # Verificamos que NO es portada (porque enviamos 'false')
            self.assertFalse(foto_creada.es_portada, "La foto creada debería tener es_portada=False.")
            # Verificamos (opcionalmente) que el nombre guardado contiene la base original
            self.assertTrue('owner_create' in foto_creada.foto.name,
                            f"El nombre de la foto guardada ({foto_creada.foto.name}) no contiene 'owner_create'.")
        except FotoPropiedad.DoesNotExist:
            # Si no podemos recuperarla, el test falla explícitamente
            self.fail("No se pudo recuperar la foto recién creada para verificar sus atributos.")

       
    def test_create_foto_propiedad_not_found(self):
        """POST crear foto para propiedad inexistente falla (404)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        data = {
            'propiedadId': 9999,
            'foto': create_test_image('notfound_create.jpg'),
            'es_portada': False
        }
        resp = self.client.post(self.list_url, data, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data['error'], 'Propiedad no encontrada')

    # Mantengo el test que expone la falta de validación de portada única en el create del viewset actual
    def test_create_segunda_portada_owner(self):
        """POST crear segunda foto como portada (actualmente permitido por el viewset.create)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        self.assertTrue(self.foto.es_portada) # La inicial es portada
        foto_nueva = create_test_image('segunda_portada_owner.jpg')
        data = {
            'propiedadId': self.propiedad.id,
            'foto': foto_nueva,
            'es_portada': 'true'
        }
        resp = self.client.post(self.list_url, data, format='multipart')
        # Esperamos 201 porque tu viewset.create no valida esto
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # Verificamos que ahora hay dos portadas
        portadas_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count()
        self.assertEqual(portadas_count, 2)

    def test_partial_update_foto_owner_success(self):
        """PATCH actualizar 'es_portada' como anfitrión funciona (200)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        # Creamos una segunda foto para el test
        otra_foto = FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=create_test_image('otra_foto_update.jpg'),
            es_portada=False
        )
        self.assertFalse(otra_foto.es_portada) # Aseguramos estado inicial

        # Actualizamos la 'otra_foto' para que sea portada
        data = {'propiedadId': self.propiedad.id, 'es_portada': True}
        resp = self.client.patch(self.detail_url(otra_foto.id), data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Verificamos el cambio en la BD
        otra_foto.refresh_from_db()
        self.assertTrue(otra_foto.es_portada)

        # Verificamos si la validación 'clean' se aplicó y desmarcó la inicial
        self.foto.refresh_from_db()
        # Si falla la siguiente línea, significa que clean() no se ejecutó/propagó correctamente en PATCH
        # self.assertFalse(self.foto.es_portada, "La portada inicial debería haberse desmarcado")

    def test_partial_update_to_portada_with_existing_fails(self):
        """PATCH marcar como portada cuando ya existe otra falla (400)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        self.assertTrue(self.foto.es_portada) # La inicial es portada
        # Creamos una segunda foto
        otra_foto = FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=create_test_image('otra_foto_fail_update.jpg'),
            es_portada=False
        )
        # Intentamos marcar la segunda como portada
        data = {'propiedadId': self.propiedad.id, 'es_portada': True}
        resp = self.client.patch(self.detail_url(otra_foto.id), data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count(), 2, "Se permitió incorrectamente una segunda portada.")


    def test_destroy_foto_owner_success(self):
        """DELETE eliminar foto como anfitrión funciona (204)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        # Creamos una foto específica para eliminar en este test
        foto_a_eliminar = FotoPropiedad.objects.create(
            propiedad=self.propiedad,
            foto=create_test_image('eliminar_owner.jpg'),
            es_portada=False
        )
        foto_id = foto_a_eliminar.id
        initial_count = FotoPropiedad.objects.count()

        resp = self.client.delete(self.detail_url(foto_id))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

        # Verificamos que se eliminó de la BD
        self.assertEqual(FotoPropiedad.objects.count(), initial_count - 1)
        with self.assertRaises(FotoPropiedad.DoesNotExist):
            FotoPropiedad.objects.get(id=foto_id)

    def test_destroy_foto_not_found(self):
        """DELETE eliminar foto inexistente falla (404)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        resp = self.client.delete(self.detail_url(9999))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


    def test_upload_photos_owner_success(self):
        """POST upload_photos como anfitrión funciona (201)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        # Contamos cuántas fotos tiene la propiedad ANTES de la subida
        initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()

        # Preparamos los datos para subir 2 fotos
        foto1 = create_test_image('multi_owner1.jpg')
        foto2 = create_test_image('multi_owner2.png', 'image/png')
        data = {
            'propiedadId': self.propiedad.id,
            'fotos': [foto1, foto2],
            'es_portada': ['false', 'false'] # Lista de strings
        }

        # Hacemos la petición POST a la URL de subida múltiple
        resp = self.client.post(self.upload_url, data, format='multipart')

        # 1. Verificamos que la respuesta HTTP fue exitosa (201 Created)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # 2. Verificamos el mensaje de estado en la respuesta JSON
        self.assertEqual(resp.data['status'], 'fotos subidas')

        # 3. Verificamos que el número de fotos AHORA es el inicial + 2
        final_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
        self.assertEqual(final_count, initial_count + 2, "El número de fotos en la BD no aumentó en 2.")


    def test_upload_photos_with_portada_owner(self):
        """POST upload_photos marcando una como portada."""
        self.client.force_authenticate(user=self.anfitrion_user)
        # Contamos fotos y portadas ANTES de la subida
        initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
        initial_portada_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count() # Debería ser 1

        # Preparamos datos: foto1 no portada, foto2 sí portada
        foto1 = create_test_image('multi_np_owner.jpg') # Esta NO será portada
        foto2 = create_test_image('multi_p_owner.jpg')  # Esta SÍ será portada
        data = {
            'propiedadId': self.propiedad.id,
            'fotos': [foto1, foto2],
            # El orden en 'es_portada' DEBE coincidir con el orden en 'fotos'
            'es_portada': ['false', 'True'] # Marcamos la segunda como portada
        }

        # Hacemos la petición
        resp = self.client.post(self.upload_url, data, format='multipart')

        # 1. Verificamos la respuesta HTTP y que el contador total aumentó en 2
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FotoPropiedad.objects.filter(propiedad=self.propiedad).count(), initial_count + 2)

        # --- NUEVA VERIFICACIÓN DE PORTADA ---
        # Recuperamos las 2 fotos más recientes para esta propiedad
        nuevas_fotos = FotoPropiedad.objects.filter(propiedad=self.propiedad).order_by('-id')[:2]
        self.assertEqual(len(nuevas_fotos), 2, "No se recuperaron las 2 nuevas fotos esperadas.")

        # Buscamos y verificamos las propiedades de las fotos nuevas
        foto_portada_encontrada = None
        foto_no_portada_encontrada = None
        for foto in nuevas_fotos:
            # Usamos 'in' para verificar si el nombre original está en el nombre guardado (más flexible)
            if 'multi_p_owner' in foto.foto.name: # La que debería ser portada
                self.assertTrue(foto.es_portada, f"La foto {foto.foto.name} debería ser portada pero no lo es.")
                foto_portada_encontrada = foto
            elif 'multi_np_owner' in foto.foto.name: # La que NO debería ser portada
                self.assertFalse(foto.es_portada, f"La foto {foto.foto.name} NO debería ser portada pero lo es.")
                foto_no_portada_encontrada = foto

        # Nos aseguramos de haber encontrado ambas fotos basándonos en sus nombres parciales
        self.assertIsNotNone(foto_portada_encontrada, "No se encontró la foto que debía ser marcada como portada (buscando 'multi_p_owner').")
        self.assertIsNotNone(foto_no_portada_encontrada, "No se encontró la foto que no debía ser marcada como portada (buscando 'multi_np_owner').")


        # Finalmente, verificamos que el número TOTAL de portadas aumentó en 1
        # (porque tu viewset actualmente permite crear una segunda portada).
        final_portada_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count()
        self.assertEqual(final_portada_count, initial_portada_count + 1, "El número total de portadas no es el esperado (inicial + 1).")


    def test_upload_photos_propiedad_not_found(self):
        """POST upload_photos para propiedad inexistente falla (404)."""
        self.client.force_authenticate(user=self.anfitrion_user)
        data = {
            'propiedadId': 9999,
            'fotos': [create_test_image('multi_notfound.jpg')],
            'es_portada': [False]
        }
        resp = self.client.post(self.upload_url, data, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data['error'], 'Propiedad no encontrada')