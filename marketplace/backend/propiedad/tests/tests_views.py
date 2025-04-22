from usuario.models.usuario import Usuario
from ..models.propiedad import Propiedad
from django.contrib.auth.models import User
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from ..models.clickPropiedad import ClickPropiedad
from rest_framework.test import APITestCase


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

from django.urls import reverse
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone

from propiedad.models.propiedad import Propiedad
from propiedad.models.valoracionPropiedad import ValoracionPropiedad
from usuario.models.usuario import Usuario

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