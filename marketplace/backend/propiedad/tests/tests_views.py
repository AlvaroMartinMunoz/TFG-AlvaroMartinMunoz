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
