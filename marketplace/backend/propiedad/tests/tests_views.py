from usuario.models.usuario import Usuario
from ..models.propiedad import Propiedad
from django.contrib.auth.models import User
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from ..models.clickPropiedad import ClickPropiedad
from rest_framework.test import APITestCase, APIClient
from ..models.fotoPropiedad import FotoPropiedad
from datetime import date, timedelta
from decimal import Decimal
from ..models.valoracionPropiedad import ValoracionPropiedad
from ..models.propiedad import FechaBloqueada
from ..models.reserva import Reserva
from ..models.favorito import Favorito
from ..models.precioEspecial import PrecioEspecial
from dateutil.relativedelta import relativedelta
import unittest
from unittest.mock import patch, MagicMock, call, ANY
import numpy as np
import os
from collections import defaultdict, Counter
from copy import deepcopy
from ..recommendations import ContentRecommender 







# class PropiedadViewSetTest(APITestCase):
#     def setUp(self):
#         # Crear usuarios de Django
#         self.host_user = User.objects.create_user('host', 'host@test.com', 'pass')
#         self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

#         # Crear perfiles de Usuario con todos los campos requeridos
#         self.host = Usuario.objects.create(
#             usuario=self.host_user,
#             dni='12345678A',
#             telefono='612345678',
#             direccion='Calle del Host 1',
#             fecha_de_nacimiento='1990-05-15'
#         )
#         self.other = Usuario.objects.create(
#             usuario=self.other_user,
#             dni='87654321B',
#             telefono='698765432',
#             direccion='Calle del Otro 2',
#             fecha_de_nacimiento='1992-07-20'
#         )

#         # Crear una propiedad con todos los campos obligatorios
#         self.prop = Propiedad.objects.create(
#             anfitrion=self.host,
#             nombre='MiCasa',
#             descripcion='Descripción de prueba',
#             direccion='Calle Falsa 123',
#             ciudad='Madrid',
#             pais='España',
#             codigo_postal='28080',
#             tipo_de_propiedad='Casa',
#             precio_por_noche=100.00,
#             maximo_huespedes=4,
#             numero_de_habitaciones=2,
#             numero_de_banos=1,
#             numero_de_camas=2,
#             tamano=50,
#             wifi=True,
#             aire_acondicionado=False,
#             calefaccion=True,
#             parking=False,
#             mascotas=False,
#             permitido_fumar=False,
#             politica_de_cancelacion='Flexible'
#         )

#         # URLs de la API
#         self.list_url = reverse('propiedad-list')
#         self.detail_url = lambda pk: reverse('propiedad-detail', args=[pk])

#     def test_retrieve_unauthenticated_no_click(self):
#         """GET /propiedades/{id}/ sin auth no crea ClickPropiedad"""
#         resp = self.client.get(self.detail_url(self.prop.pk))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(ClickPropiedad.objects.count(), 0)

#     def test_retrieve_host_no_click(self):
#         """El anfitrión ve su propia propiedad y no se registra click"""
#         self.client.force_authenticate(self.host_user)
#         resp = self.client.get(self.detail_url(self.prop.pk))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(ClickPropiedad.objects.count(), 0)

#     def test_retrieve_non_owner_creates_click(self):
#         """Un usuario distinto crea un ClickPropiedad la primera vez"""
#         self.client.force_authenticate(self.other_user)
#         resp = self.client.get(self.detail_url(self.prop.pk))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(ClickPropiedad.objects.count(), 1)
#         click = ClickPropiedad.objects.first()
#         self.assertEqual(click.usuario, self.other)
#         self.assertEqual(click.propiedad, self.prop)

#     def test_retrieve_non_owner_no_duplicate_within_5s(self):
#         """Si ya existe un click en los últimos 5s, no se duplica"""
#         # Crear un click reciente manualmente
#         reciente = ClickPropiedad.objects.create(usuario=self.other, propiedad=self.prop)
#         reciente.timestamp = timezone.now()
#         reciente.save()

#         self.client.force_authenticate(self.other_user)
#         resp = self.client.get(self.detail_url(self.prop.pk))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(ClickPropiedad.objects.count(), 1)

#     def test_create_requires_authentication(self):
#         """POST /propiedades/ requiere autenticarse"""
#         data = {
#             'anfitrion': self.host.pk,
#             'nombre': 'NuevaCasa',
#             'descripcion': 'Desc',
#             'direccion': 'Av. Siempre Viva 456',
#             'ciudad': 'Barcelona',
#             'pais': 'España',
#             'codigo_postal': '08001',
#             'tipo_de_propiedad': 'Apartamento',
#             'precio_por_noche': '75.00',
#             'maximo_huespedes': 2,
#             'numero_de_habitaciones': 1,
#             'numero_de_banos': 1,
#             'numero_de_camas': 1,
#             'tamano': 30,
#             'wifi': False,
#             'aire_acondicionado': True,
#             'calefaccion': False,
#             'parking': True,
#             'mascotas': True,
#             'permitido_fumar': False,
#             'politica_de_cancelacion': 'Moderada'
#         }
#         # Sin autenticar
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#         # Con autenticación
#         self.client.force_authenticate(self.host_user)
#         resp2 = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
#         self.assertTrue(Propiedad.objects.filter(nombre='NuevaCasa').exists())

#     def test_update_and_partial_update_permission(self):
#         """Sólo el anfitrión puede (partial_)update"""
#         url = self.detail_url(self.prop.pk)
#         payload = {'nombre': 'CasaCambiada'}

#         # Otro usuario intenta editar completamente
#         self.client.force_authenticate(self.other_user)
#         resp_put = self.client.put(url, payload, format='json')
#         self.assertEqual(resp_put.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertIn('error', resp_put.data)

#         # Otro usuario intenta patch
#         resp_patch_other = self.client.patch(url, payload, format='json')
#         self.assertEqual(resp_patch_other.status_code, status.HTTP_403_FORBIDDEN)

#         # Anfitrión edita parcialmente
#         self.client.force_authenticate(self.host_user)
#         resp_patch = self.client.patch(url, payload, format='json')
#         self.assertEqual(resp_patch.status_code, status.HTTP_200_OK)
#         self.prop.refresh_from_db()
#         self.assertEqual(self.prop.nombre, 'CasaCambiada')

#     def test_destroy_permission(self):
#         """Sólo el anfitrión puede eliminar la propiedad"""
#         url = self.detail_url(self.prop.pk)

#         # Otro usuario intenta eliminar
#         self.client.force_authenticate(self.other_user)
#         resp = self.client.delete(url)
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

#         # Anfitrión elimina exitosamente
#         self.client.force_authenticate(self.host_user)
#         resp2 = self.client.delete(url)
#         self.assertEqual(resp2.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertFalse(Propiedad.objects.filter(pk=self.prop.pk).exists())



# class ValoracionPropiedadViewSetTest(APITestCase):
#     def setUp(self):
#         # Usuarios
#         self.host_user = User.objects.create_user('host', 'host@test.com', 'pass')
#         self.reviewer_user = User.objects.create_user('reviewer', 'rev@test.com', 'pass')
#         self.other_user = User.objects.create_user('other', 'other@test.com', 'pass')

#         # Perfiles
#         self.host = Usuario.objects.create(
#             usuario=self.host_user,
#             dni='12345678A', telefono='600111222', direccion='C/ Host 1', fecha_de_nacimiento='1990-01-01'
#         )
#         self.reviewer = Usuario.objects.create(
#             usuario=self.reviewer_user,
#             dni='87654321B', telefono='600333444', direccion='C/ Rev 2', fecha_de_nacimiento='1992-02-02'
#         )
#         self.other = Usuario.objects.create(
#             usuario=self.other_user,
#             dni='11223344C', telefono='600555666', direccion='C/ Other 3', fecha_de_nacimiento='1994-03-03'
#         )

#         # Propiedad
#         self.prop = Propiedad.objects.create(
#             anfitrion=self.host,
#             nombre='CasaTest', descripcion='Desc', direccion='Dir', ciudad='Ciudad', pais='Pais',
#             codigo_postal='12345', tipo_de_propiedad='Casa', precio_por_noche=50.0,
#             maximo_huespedes=2, numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1,
#             tamano=30, wifi=False, aire_acondicionado=False, calefaccion=False,
#             parking=False, mascotas=False, permitido_fumar=False, politica_de_cancelacion='Flexible'
#         )

#         self.list_url = reverse('valoracionpropiedad-list')
#         self.detail_url = lambda pk: reverse('valoracionpropiedad-detail', args=[pk])
#         self.media_url = lambda pk: reverse('valoracionpropiedad-media-valoraciones', args=[pk])



#     def test_create_unauthenticated(self):
#         """POST crea valoración requiere auth"""
#         data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 4, 'comentario': 'Good'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#     def test_create_missing_fields(self):
#         """Falta campo => 400"""
#         self.client.force_authenticate(self.reviewer_user)
#         data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 5}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertIn('error', resp.data)

#     def test_create_invalid_propiedad(self):
#         """Propiedad no existe => 404"""
#         self.client.force_authenticate(self.reviewer_user)
#         data = {'propiedad': 9999, 'usuario': self.reviewer.id, 'valoracion': 3, 'comentario': 'Ok'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     def test_create_out_of_range_valoracion(self):
#         """Valoracion fuera de rango => 400"""
#         self.client.force_authenticate(self.reviewer_user)
#         data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 6, 'comentario': 'Bad'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

#     def test_create_own_property(self):
#         """Host no puede valorar propia propiedad => 403"""
#         self.client.force_authenticate(self.host_user)
#         data = {'propiedad': self.prop.id, 'usuario': self.host.id, 'valoracion': 4, 'comentario': 'Nice'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

#     def test_create_success(self):
#         """Crea valoración correctamente"""
#         self.client.force_authenticate(self.reviewer_user)
#         data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 5, 'comentario': 'Excelente'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         self.assertTrue(ValoracionPropiedad.objects.filter(propiedad=self.prop, usuario=self.reviewer).exists())

#     def test_create_duplicate(self):
#         """Duplicado provoca 400"""
#         self.client.force_authenticate(self.reviewer_user)
#         ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=5, comentario='X')
#         data = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion': 3, 'comentario': 'Y'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

#     def test_partial_update_permission(self):
#         """Solo autor puede editar parcial"""
#         v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
#         url = self.detail_url(v.id)
#         # otro usuario
#         self.client.force_authenticate(self.other_user)
#         resp = self.client.patch(url, {'comentario': 'B'}, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         # autor
#         self.client.force_authenticate(self.reviewer_user)
#         resp2 = self.client.patch(url, {'comentario': 'B'}, format='json')
#         self.assertEqual(resp2.status_code, status.HTTP_200_OK)

#     def test_update_permission(self):
#         v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
#         url = self.detail_url(v.id)
#         # host intenta editar review
#         self.client.force_authenticate(self.host_user)
#         resp_host = self.client.put(url, {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':2, 'comentario':'C'}, format='json')
#         self.assertEqual(resp_host.status_code, status.HTTP_403_FORBIDDEN)
#         # otro usuario
#         self.client.force_authenticate(self.other_user)
#         resp_other = self.client.put(url, {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':2, 'comentario':'C'}, format='json')
#         self.assertEqual(resp_other.status_code, status.HTTP_403_FORBIDDEN)
#         # autor realiza put con todos los campos
#         self.client.force_authenticate(self.reviewer_user)
#         data_full = {'propiedad': self.prop.id, 'usuario': self.reviewer.id, 'valoracion':3, 'comentario':'D'}
#         resp_author = self.client.put(url, data_full, format='json')
#         self.assertEqual(resp_author.status_code, status.HTTP_200_OK)
#         # Verificar cambio
#         v.refresh_from_db()
#         self.assertEqual(v.valoracion, 3)
#         self.assertEqual(v.comentario, 'D')

#     def test_destroy_permission(self):
#         """Validar permisos destroy"""
#         v = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
#         url = self.detail_url(v.id)
#         # host intenta
#         self.client.force_authenticate(self.host_user)
#         resp_host = self.client.delete(url)
#         self.assertEqual(resp_host.status_code, status.HTTP_403_FORBIDDEN)
#         # otro usuario
#         self.client.force_authenticate(self.other_user)
#         resp_other = self.client.delete(url)
#         self.assertEqual(resp_other.status_code, status.HTTP_403_FORBIDDEN)
#         # autor
#         self.client.force_authenticate(self.reviewer_user)
#         resp_auth = self.client.delete(url)
#         self.assertEqual(resp_auth.status_code, status.HTTP_204_NO_CONTENT)

#     def test_media_valoraciones_no_property(self):
#         url = self.media_url(9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     def test_media_valoraciones_none(self):
#         """Propiedad sin valoraciones => mensaje"""
#         url = reverse('valoracionpropiedad-media-valoraciones', args=[self.prop.id])
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIn('mensaje', resp.data)

#     def test_media_valoraciones_with_reviews(self):
#         """Calcula media y count"""
#         # Crear dos valoraciones
#         t1 = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.reviewer, valoracion=4, comentario='A')
#         t2 = ValoracionPropiedad.objects.create(propiedad=self.prop, usuario=self.other, valoracion=2, comentario='B')
#         url = reverse('valoracionpropiedad-media-valoraciones', args=[self.prop.id])
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data['reseñas'], 2)
#         self.assertAlmostEqual(resp.data['media'], 3.0)

# def create_test_image(name='test_image.jpg', content_type='image/jpeg', size=1024):
#         """Crea un SimpleUploadedFile simulando una imagen para tests."""
#         return SimpleUploadedFile(name, b'0' * size, content_type=content_type)
    

# class FotoPropiedadViewSetTestsEstilo(APITestCase): # Renombrado para evitar conflictos si mantienes ambos
    


#     def setUp(self):
#         """Configura los datos necesarios antes de cada test."""
#         # Usuarios de Django
#         self.anfitrion_user = User.objects.create_user('anfitriontest', 'anfitrion@test.com', 'password123')
#         self.normal_user = User.objects.create_user('normaltest', 'normal@test.com', 'password123')
#         self.other_user = User.objects.create_user('othertest', 'other@test.com', 'password123') # Otro usuario por si acaso

#         # Perfiles de Usuario (modelo personalizado)
#         fecha_nacimiento_valida = date.today() - timedelta(days=365*20) # Ejemplo: 20 años
#         self.anfitrion = Usuario.objects.create(
#         usuario=self.anfitrion_user,
#         dni='12345678A', telefono='600111222', direccion='C/ Anfitrion 1', fecha_de_nacimiento=fecha_nacimiento_valida
#         )
#         self.normal = Usuario.objects.create(
#         usuario=self.normal_user,
#         dni='87654321B', telefono='600333444', direccion='C/ Normal 2', fecha_de_nacimiento=fecha_nacimiento_valida
#             )
#         # Creamos también el perfil para other_user si fuera necesario
#         self.other = Usuario.objects.create(
#              usuario=self.other_user,
#              dni='11223344C', telefono='600555666', direccion='C/ Other 3', fecha_de_nacimiento=fecha_nacimiento_valida
#         )


#         # Propiedad asociada al anfitrión
#         self.propiedad = Propiedad.objects.create(
#                 anfitrion=self.anfitrion,
#                 nombre='Villa Test setUp', # Nombre diferente para asegurar que es de setUp
#                 descripcion='Una villa para tests desde setUp',
#                 direccion='Av Test setUp 123', ciudad='Testville', pais='Testlandia', codigo_postal='12345',
#                 tipo_de_propiedad='Villa', precio_por_noche=150.00, maximo_huespedes=4,
#                 numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=3, tamano=100,
#                 politica_de_cancelacion='Flexible'
#             )

#             # FotoPropiedad inicial para la propiedad del anfitrión
#         self.foto = FotoPropiedad.objects.create(
#                 propiedad=self.propiedad,
#                 foto=create_test_image(name='inicial_setup.jpg'),
#                 es_portada=True # Marcamos esta como portada inicial
#             )

#             # URLs (usando basename 'fotopropiedad' como en el ejemplo)
#         self.list_url = reverse('fotopropiedad-list')
#         self.detail_url = lambda pk: reverse('fotopropiedad-detail', args=[pk])
#         self.upload_url = reverse('fotopropiedad-upload-photos')

#             # Cliente API (se crea automáticamente en APITestCase como self.client)


#     # --- Tests de Permisos (No Autenticado) ---

#     def test_list_fotos_unauthenticated(self):
#         """GET lista fotos no requiere auth (AllowAny)."""
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         # Verificamos que al menos nuestra foto inicial está en la lista
#         self.assertTrue(any(item['id'] == self.foto.id for item in resp.data))

#     def test_retrieve_foto_unauthenticated(self):
#         """GET detalle foto no requiere auth (AllowAny)."""
#         resp = self.client.get(self.detail_url(self.foto.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data['id'], self.foto.id)

#     def test_create_foto_unauthenticated(self):
#         """POST crear foto requiere auth (IsAuthenticated)."""
#         data = {
#             'propiedadId': self.propiedad.id,
#             'foto': create_test_image('unauth_create.jpg'),
#             'es_portada': False
#         }
#         resp = self.client.post(self.list_url, data, format='multipart')
#         # Esperamos 401 o 403 dependiendo de la config global de autenticación/permisos
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_update_foto_unauthenticated(self):
#         """PUT actualizar foto requiere auth."""
#         data = {'propiedadId': self.propiedad.id, 'es_portada': False}
#         resp = self.client.put(self.detail_url(self.foto.id), data, format='json')
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_partial_update_foto_unauthenticated(self):
#         """PATCH actualizar foto requiere auth."""
#         data = {'propiedadId': self.propiedad.id, 'es_portada': False}
#         resp = self.client.patch(self.detail_url(self.foto.id), data, format='json')
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_destroy_foto_unauthenticated(self):
#         """DELETE eliminar foto requiere auth."""
#         resp = self.client.delete(self.detail_url(self.foto.id))
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_upload_photos_unauthenticated(self):
#         """POST upload_photos requiere auth."""
#         data = {
#             'propiedadId': self.propiedad.id,
#             'fotos': [create_test_image('multi1_noauth.jpg')],
#             'es_portada': [False]
#         }
#         resp = self.client.post(self.upload_url, data, format='multipart')
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


#     # --- Tests de Permisos (Autenticado - No Anfitrión) ---

#     def test_create_foto_authenticated_not_owner(self):
#         """POST crear foto como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         data = {
#             'propiedadId': self.propiedad.id,
#             'foto': create_test_image('not_owner_create.jpg'),
#             'es_portada': False
#         }
#         resp = self.client.post(self.list_url, data, format='multipart')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data['error'], 'No tienes permiso para subir fotos a esta propiedad')

#     def test_update_foto_authenticated_not_owner(self):
#         """PUT actualizar foto como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         data = {'propiedadId': self.propiedad.id, 'es_portada': False}
#         resp = self.client.put(self.detail_url(self.foto.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data['error'], 'No tienes permiso para actualizar fotos de esta propiedad')

#     def test_partial_update_foto_authenticated_not_owner(self):
#         """PATCH actualizar foto como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         data = {'propiedadId': self.propiedad.id, 'es_portada': False}
#         resp = self.client.patch(self.detail_url(self.foto.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data['error'], 'No tienes permiso para actualizar fotos de esta propiedad')

#     def test_destroy_foto_authenticated_not_owner(self):
#         """DELETE eliminar foto como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         resp = self.client.delete(self.detail_url(self.foto.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data['error'], 'No tienes permiso para eliminar esta foto')

#     def test_upload_photos_authenticated_not_owner(self):
#         """POST upload_photos como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         data = {
#             'propiedadId': self.propiedad.id,
#             'fotos': [create_test_image('multi1_notowner.jpg')],
#             'es_portada': [False]
#         }
#         resp = self.client.post(self.upload_url, data, format='multipart')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data['error'], 'No tienes permiso para subir fotos a esta propiedad')


#     # --- Tests de Funcionalidad (Autenticado - Anfitrión) ---


#     def test_create_foto_owner_success(self):
#         """POST crear foto como anfitrión funciona (201)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Contamos fotos ANTES
#         initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()

#         # Preparamos datos para crear una foto, no portada
#         foto_nueva = create_test_image('owner_create.jpg')
#         data = {
#             'propiedadId': self.propiedad.id,
#             'foto': foto_nueva,
#             'es_portada': 'false' # Enviamos 'false' como string
#         }

#         # Hacemos la petición POST
#         resp = self.client.post(self.list_url, data, format='multipart')

#         # 1. Verificamos respuesta HTTP y mensaje JSON
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(resp.data['status'], 'foto subida')

#         # 2. Verificamos que el contador de fotos aumentó en 1
#         final_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
#         self.assertEqual(final_count, initial_count + 1, "El número de fotos no aumentó en 1.")

#         # 3. (Opcional pero recomendado) Recuperamos la última foto y verificamos sus datos
#         try:
#             # Buscamos la foto más reciente añadida a esta propiedad
#             foto_creada = FotoPropiedad.objects.filter(propiedad=self.propiedad).latest('id')
#             # Verificamos que NO es portada (porque enviamos 'false')
#             self.assertFalse(foto_creada.es_portada, "La foto creada debería tener es_portada=False.")
#             # Verificamos (opcionalmente) que el nombre guardado contiene la base original
#             self.assertTrue('owner_create' in foto_creada.foto.name,
#                             f"El nombre de la foto guardada ({foto_creada.foto.name}) no contiene 'owner_create'.")
#         except FotoPropiedad.DoesNotExist:
#             # Si no podemos recuperarla, el test falla explícitamente
#             self.fail("No se pudo recuperar la foto recién creada para verificar sus atributos.")

       
#     def test_create_foto_propiedad_not_found(self):
#         """POST crear foto para propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {
#             'propiedadId': 9999,
#             'foto': create_test_image('notfound_create.jpg'),
#             'es_portada': False
#         }
#         resp = self.client.post(self.list_url, data, format='multipart')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data['error'], 'Propiedad no encontrada')

#     # Mantengo el test que expone la falta de validación de portada única en el create del viewset actual
#     def test_create_segunda_portada_owner(self):
#         """POST crear segunda foto como portada (actualmente permitido por el viewset.create)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         self.assertTrue(self.foto.es_portada) # La inicial es portada
#         foto_nueva = create_test_image('segunda_portada_owner.jpg')
#         data = {
#             'propiedadId': self.propiedad.id,
#             'foto': foto_nueva,
#             'es_portada': 'true'
#         }
#         resp = self.client.post(self.list_url, data, format='multipart')
#         # Esperamos 201 porque tu viewset.create no valida esto
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         # Verificamos que ahora hay dos portadas
#         portadas_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count()
#         self.assertEqual(portadas_count, 2)

#     def test_partial_update_foto_owner_success(self):
#         """PATCH actualizar 'es_portada' como anfitrión funciona (200)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Creamos una segunda foto para el test
#         otra_foto = FotoPropiedad.objects.create(
#             propiedad=self.propiedad,
#             foto=create_test_image('otra_foto_update.jpg'),
#             es_portada=False
#         )
#         self.assertFalse(otra_foto.es_portada) # Aseguramos estado inicial

#         # Actualizamos la 'otra_foto' para que sea portada
#         data = {'propiedadId': self.propiedad.id, 'es_portada': True}
#         resp = self.client.patch(self.detail_url(otra_foto.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)

#         # Verificamos el cambio en la BD
#         otra_foto.refresh_from_db()
#         self.assertTrue(otra_foto.es_portada)

#         # Verificamos si la validación 'clean' se aplicó y desmarcó la inicial
#         self.foto.refresh_from_db()
#         # Si falla la siguiente línea, significa que clean() no se ejecutó/propagó correctamente en PATCH
#         # self.assertFalse(self.foto.es_portada, "La portada inicial debería haberse desmarcado")

#     def test_partial_update_to_portada_with_existing_fails(self):
#         """PATCH marcar como portada cuando ya existe otra falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         self.assertTrue(self.foto.es_portada) # La inicial es portada
#         # Creamos una segunda foto
#         otra_foto = FotoPropiedad.objects.create(
#             propiedad=self.propiedad,
#             foto=create_test_image('otra_foto_fail_update.jpg'),
#             es_portada=False
#         )
#         # Intentamos marcar la segunda como portada
#         data = {'propiedadId': self.propiedad.id, 'es_portada': True}
#         resp = self.client.patch(self.detail_url(otra_foto.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count(), 2, "Se permitió incorrectamente una segunda portada.")


#     def test_destroy_foto_owner_success(self):
#         """DELETE eliminar foto como anfitrión funciona (204)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Creamos una foto específica para eliminar en este test
#         foto_a_eliminar = FotoPropiedad.objects.create(
#             propiedad=self.propiedad,
#             foto=create_test_image('eliminar_owner.jpg'),
#             es_portada=False
#         )
#         foto_id = foto_a_eliminar.id
#         initial_count = FotoPropiedad.objects.count()

#         resp = self.client.delete(self.detail_url(foto_id))
#         self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

#         # Verificamos que se eliminó de la BD
#         self.assertEqual(FotoPropiedad.objects.count(), initial_count - 1)
#         with self.assertRaises(FotoPropiedad.DoesNotExist):
#             FotoPropiedad.objects.get(id=foto_id)

#     def test_destroy_foto_not_found(self):
#         """DELETE eliminar foto inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp = self.client.delete(self.detail_url(9999))
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


#     def test_upload_photos_owner_success(self):
#         """POST upload_photos como anfitrión funciona (201)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Contamos cuántas fotos tiene la propiedad ANTES de la subida
#         initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()

#         # Preparamos los datos para subir 2 fotos
#         foto1 = create_test_image('multi_owner1.jpg')
#         foto2 = create_test_image('multi_owner2.png', 'image/png')
#         data = {
#             'propiedadId': self.propiedad.id,
#             'fotos': [foto1, foto2],
#             'es_portada': ['false', 'false'] # Lista de strings
#         }

#         # Hacemos la petición POST a la URL de subida múltiple
#         resp = self.client.post(self.upload_url, data, format='multipart')

#         # 1. Verificamos que la respuesta HTTP fue exitosa (201 Created)
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         # 2. Verificamos el mensaje de estado en la respuesta JSON
#         self.assertEqual(resp.data['status'], 'fotos subidas')

#         # 3. Verificamos que el número de fotos AHORA es el inicial + 2
#         final_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
#         self.assertEqual(final_count, initial_count + 2, "El número de fotos en la BD no aumentó en 2.")


#     def test_upload_photos_with_portada_owner(self):
#         """POST upload_photos marcando una como portada."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Contamos fotos y portadas ANTES de la subida
#         initial_count = FotoPropiedad.objects.filter(propiedad=self.propiedad).count()
#         initial_portada_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count() # Debería ser 1

#         # Preparamos datos: foto1 no portada, foto2 sí portada
#         foto1 = create_test_image('multi_np_owner.jpg') # Esta NO será portada
#         foto2 = create_test_image('multi_p_owner.jpg')  # Esta SÍ será portada
#         data = {
#             'propiedadId': self.propiedad.id,
#             'fotos': [foto1, foto2],
#             # El orden en 'es_portada' DEBE coincidir con el orden en 'fotos'
#             'es_portada': ['false', 'True'] # Marcamos la segunda como portada
#         }

#         # Hacemos la petición
#         resp = self.client.post(self.upload_url, data, format='multipart')

#         # 1. Verificamos la respuesta HTTP y que el contador total aumentó en 2
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(FotoPropiedad.objects.filter(propiedad=self.propiedad).count(), initial_count + 2)

#         # --- NUEVA VERIFICACIÓN DE PORTADA ---
#         # Recuperamos las 2 fotos más recientes para esta propiedad
#         nuevas_fotos = FotoPropiedad.objects.filter(propiedad=self.propiedad).order_by('-id')[:2]
#         self.assertEqual(len(nuevas_fotos), 2, "No se recuperaron las 2 nuevas fotos esperadas.")

#         # Buscamos y verificamos las propiedades de las fotos nuevas
#         foto_portada_encontrada = None
#         foto_no_portada_encontrada = None
#         for foto in nuevas_fotos:
#             # Usamos 'in' para verificar si el nombre original está en el nombre guardado (más flexible)
#             if 'multi_p_owner' in foto.foto.name: # La que debería ser portada
#                 self.assertTrue(foto.es_portada, f"La foto {foto.foto.name} debería ser portada pero no lo es.")
#                 foto_portada_encontrada = foto
#             elif 'multi_np_owner' in foto.foto.name: # La que NO debería ser portada
#                 self.assertFalse(foto.es_portada, f"La foto {foto.foto.name} NO debería ser portada pero lo es.")
#                 foto_no_portada_encontrada = foto

#         # Nos aseguramos de haber encontrado ambas fotos basándonos en sus nombres parciales
#         self.assertIsNotNone(foto_portada_encontrada, "No se encontró la foto que debía ser marcada como portada (buscando 'multi_p_owner').")
#         self.assertIsNotNone(foto_no_portada_encontrada, "No se encontró la foto que no debía ser marcada como portada (buscando 'multi_np_owner').")


#         # Finalmente, verificamos que el número TOTAL de portadas aumentó en 1
#         # (porque tu viewset actualmente permite crear una segunda portada).
#         final_portada_count = FotoPropiedad.objects.filter(propiedad=self.propiedad, es_portada=True).count()
#         self.assertEqual(final_portada_count, initial_portada_count + 1, "El número total de portadas no es el esperado (inicial + 1).")


#     def test_upload_photos_propiedad_not_found(self):
#         """POST upload_photos para propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {
#             'propiedadId': 9999,
#             'fotos': [create_test_image('multi_notfound.jpg')],
#             'es_portada': [False]
#         }
#         resp = self.client.post(self.upload_url, data, format='multipart')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data['error'], 'Propiedad no encontrada')


# class FechaBloqueadaViewSetTests(APITestCase):

#     def setUp(self):
#         """Configura los datos necesarios antes de cada test."""
#         # Usuarios de Django
#         self.anfitrion_user = User.objects.create_user('anfitrionfecha', 'anfitrionf@test.com', 'password123')
#         self.normal_user = User.objects.create_user('normalfecha', 'normalf@test.com', 'password123')

#         # Perfiles de Usuario (modelo personalizado)
#         fecha_nacimiento_valida = timezone.now().date() - timedelta(days=365*20) # Usamos timezone
#         self.anfitrion = Usuario.objects.create(
#             usuario=self.anfitrion_user,
#             dni='12345678F', telefono='600111333', direccion='C/ Anfitrion Fecha 1', fecha_de_nacimiento=fecha_nacimiento_valida
#         )
#         self.normal = Usuario.objects.create(
#             usuario=self.normal_user,
#             dni='87654321G', telefono='600333555', direccion='C/ Normal Fecha 2', fecha_de_nacimiento=fecha_nacimiento_valida
#         )

#         # Propiedad asociada al anfitrión
#         self.propiedad = Propiedad.objects.create(
#             anfitrion=self.anfitrion,
#             nombre='Villa FechaTest', descripcion='Villa para testear fechas',
#             direccion='Av FechaTest 456', ciudad='Testville', pais='Testlandia', codigo_postal='54321',
#             tipo_de_propiedad='Villa', precio_por_noche=180.00, maximo_huespedes=5,
#             numero_de_habitaciones=3, numero_de_banos=2, numero_de_camas=4, tamano=120,
#             politica_de_cancelacion='Moderada'
#         )

#         # FechaBloqueada inicial (una semana en el futuro desde hoy)
#         self.fecha_futura = timezone.now().date() + timedelta(days=7)
#         self.fecha_bloqueada = FechaBloqueada.objects.create(
#             propiedad=self.propiedad,
#             fecha=self.fecha_futura
#         )


#         basename = 'fechabloqueada'
#         # --- FIN AJUSTE BASENAME ---

#         self.list_url = reverse(f'{basename}-list')
#         self.detail_url = lambda pk: reverse(f'{basename}-detail', args=[pk])

#     # --- Tests Públicos / Acciones Deshabilitadas ---

#     def test_list_fechas_unauthenticated(self):
#         """GET lista fechas no requiere auth (AllowAny)."""
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         # Verificamos si la fecha inicial está (considerando paginación)
#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)
#         self.assertTrue(any(item.get('id') == self.fecha_bloqueada.id for item in items_list),
#                         f"ID {self.fecha_bloqueada.id} no encontrado en {items_list}")

#     def test_retrieve_fecha_unauthenticated(self):
#         """GET detalle fecha no requiere auth (AllowAny)."""
#         resp = self.client.get(self.detail_url(self.fecha_bloqueada.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data.get('id'), self.fecha_bloqueada.id)
#         # Comparamos el string de fecha
#         self.assertEqual(resp.data.get('fecha'), self.fecha_futura.strftime('%Y-%m-%d'))

#     def test_update_fecha_forbidden(self):
#         """PUT actualizar fecha está prohibido (403)."""
#         data = {'fecha': timezone.now().date().strftime('%Y-%m-%d')}
#         # Probamos sin autenticar
#         resp_unauth = self.client.put(self.detail_url(self.fecha_bloqueada.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_unauth.data.get('error'), 'No puedes actualizar fechas bloqueadas')
#         # Probamos autenticados como anfitrión
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp_auth = self.client.put(self.detail_url(self.fecha_bloqueada.id), data, format='json')
#         self.assertEqual(resp_auth.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_auth.data.get('error'), 'No puedes actualizar fechas bloqueadas')

#     def test_partial_update_fecha_forbidden(self):
#         """PATCH actualizar fecha está prohibido (403)."""
#         data = {'fecha': timezone.now().date().strftime('%Y-%m-%d')}
#         # Probamos sin autenticar
#         resp_unauth = self.client.patch(self.detail_url(self.fecha_bloqueada.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_unauth.data.get('error'), 'No puedes actualizar fechas bloqueadas')
#         # Probamos autenticados como anfitrión
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp_auth = self.client.patch(self.detail_url(self.fecha_bloqueada.id), data, format='json')
#         self.assertEqual(resp_auth.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_auth.data.get('error'), 'No puedes actualizar fechas bloqueadas')


#     # --- Tests de Create ---

#     def test_create_fecha_unauthenticated(self):
#         """POST crear fecha requiere auth (IsAuthenticated)."""
#         fecha_nueva = (timezone.now().date() + timedelta(days=10)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha': fecha_nueva}
#         resp = self.client.post(self.list_url, data, format='json')
#         # Esperamos 401 si no hay credenciales, 403 si las hay pero fallan (depende de defaults)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_create_fecha_authenticated_not_owner(self):
#         """POST crear fecha como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         fecha_nueva = (timezone.now().date() + timedelta(days=10)).strftime('%Y-%m-%d')
#         # Intenta bloquear fecha en la propiedad del anfitrión
#         data = {'propiedad': self.propiedad.id, 'fecha': fecha_nueva}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para bloquear fechas en esta propiedad')

#     def test_create_fecha_owner_success(self):
#         """POST crear fecha como anfitrión funciona (201)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         initial_count = FechaBloqueada.objects.count()
#         # Bloqueamos una fecha diferente a la inicial
#         fecha_nueva = timezone.now().date() + timedelta(days=10)
#         data = {'propiedad': self.propiedad.id, 'fecha': fecha_nueva.strftime('%Y-%m-%d')}

#         resp = self.client.post(self.list_url, data, format='json')

#         # Verificamos respuesta y creación en BD
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(resp.data.get('status'), 'fechas bloqueadas')
#         self.assertEqual(FechaBloqueada.objects.count(), initial_count + 1)
#         self.assertTrue(FechaBloqueada.objects.filter(propiedad=self.propiedad, fecha=fecha_nueva).exists())

#     def test_create_fecha_propiedad_not_found(self):
#         """POST crear fecha para propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_nueva = (timezone.now().date() + timedelta(days=10)).strftime('%Y-%m-%d')
#         data = {'propiedad': 9999, 'fecha': fecha_nueva} # ID de propiedad inválido
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data.get('error'), 'Propiedad no encontrada')

#     def test_create_fecha_duplicada_fails(self):
#         """POST crear fecha duplicada (misma prop/fecha) causa IntegrityError."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Datos para la fecha que ya existe
#         data = {'propiedad': self.propiedad.id, 'fecha': self.fecha_futura.strftime('%Y-%m-%d')}

#         # Verificamos que la llamada a client.post Lanza la excepción IntegrityError
#         with self.assertRaises(IntegrityError):
#             self.client.post(self.list_url, data, format='json')

#     def test_create_fecha_pasada_owner(self):
#         """POST crear fecha pasada (actualmente permitido por el viewset.create)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         initial_count = FechaBloqueada.objects.count()
#         fecha_pasada = timezone.now().date() - timedelta(days=1)
#         data = {'propiedad': self.propiedad.id, 'fecha': fecha_pasada.strftime('%Y-%m-%d')}

#         resp = self.client.post(self.list_url, data, format='json')

#         # Verificamos el comportamiento ACTUAL: se permite (201) porque clean() no se llama
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f"Respuesta: {resp.data}")
#         self.assertEqual(resp.data.get('status'), 'fechas bloqueadas')
#         self.assertEqual(FechaBloqueada.objects.count(), initial_count + 1)
#         self.assertTrue(FechaBloqueada.objects.filter(propiedad=self.propiedad, fecha=fecha_pasada).exists())
#         # NOTA: Si corriges tu viewset.create para usar el serializer y validar,
#         # este test debería cambiarse para esperar status.HTTP_400_BAD_REQUEST


#     # --- Tests de Destroy ---

#     def test_destroy_fecha_unauthenticated(self):
#         """DELETE eliminar fecha requiere auth."""
#         resp = self.client.delete(self.detail_url(self.fecha_bloqueada.id))
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_destroy_fecha_authenticated_not_owner(self):
#         """DELETE eliminar fecha como usuario normal falla (403)."""
#         self.client.force_authenticate(user=self.normal_user)
#         resp = self.client.delete(self.detail_url(self.fecha_bloqueada.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para desbloquear esta fecha')

#     def test_destroy_fecha_owner_success(self):
#         """DELETE eliminar fecha como anfitrión funciona (204)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         initial_count = FechaBloqueada.objects.count()
#         fecha_id = self.fecha_bloqueada.id # Guardamos el ID antes de borrar

#         resp = self.client.delete(self.detail_url(fecha_id))

#         # Verificamos respuesta y eliminación de la BD
#         self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertEqual(FechaBloqueada.objects.count(), initial_count - 1)
#         with self.assertRaises(FechaBloqueada.DoesNotExist):
#             FechaBloqueada.objects.get(id=fecha_id)

#     def test_destroy_fecha_not_found(self):
#         """DELETE eliminar fecha inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp = self.client.delete(self.detail_url(9999)) # ID inválido
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)



# class ReservaViewSetTests(APITestCase):

#     def setUp(self):
#         """Configura los datos necesarios antes de cada test."""
#         # Usuarios de Django
#         self.anfitrion_user = User.objects.create_user('anfitrionres', 'anfitrionr@test.com', 'password123')
#         self.huesped1_user = User.objects.create_user('huesped1res', 'huesped1r@test.com', 'password123')
#         self.huesped2_user = User.objects.create_user('huesped2res', 'huesped2r@test.com', 'password123')

#         # Perfiles de Usuario
#         fecha_nacimiento_valida = timezone.now().date() - timedelta(days=365*25)
#         self.anfitrion = Usuario.objects.create(usuario=self.anfitrion_user, dni='11111111A', telefono='611111111', direccion='C/ Anfitrion Res 1', fecha_de_nacimiento=fecha_nacimiento_valida)
#         self.huesped1 = Usuario.objects.create(usuario=self.huesped1_user, dni='22222222B', telefono='622222222', direccion='C/ Huesped1 Res 2', fecha_de_nacimiento=fecha_nacimiento_valida)
#         self.huesped2 = Usuario.objects.create(usuario=self.huesped2_user, dni='33333333C', telefono='633333333', direccion='C/ Huesped2 Res 3', fecha_de_nacimiento=fecha_nacimiento_valida)

#         # Propiedad del anfitrión
#         self.propiedad = Propiedad.objects.create(
#             anfitrion=self.anfitrion, nombre='Casa ReservaTest', descripcion='Casa para testear reservas',
#             direccion='Av ReservaTest 789', ciudad='TestCity', pais='TestCountry', codigo_postal='13579',
#             tipo_de_propiedad='Casa', precio_por_noche=Decimal('100.00'), maximo_huespedes=4,
#             numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=3, tamano=90,
#             politica_de_cancelacion='Estricta'
#         )

#         # Fechas para reservas/bloqueos
#         self.hoy = timezone.now().date()
#         self.fecha_llegada_inicial = self.hoy + timedelta(days=10)
#         self.fecha_salida_inicial = self.hoy + timedelta(days=15) # Reserva de 5 noches
#         self.fecha_bloqueada_intermedia = self.hoy + timedelta(days=20)

#         # Reserva Inicial (Huesped1 reserva propiedad de Anfitrion)
#         # Asumiendo que perform_create asigna estado, precios, anfitrion, usuario
#         self.reserva_inicial = Reserva.objects.create(
#             propiedad=self.propiedad,
#             anfitrion=self.anfitrion, # Asignamos explícitamente basado en el modelo
#             usuario=self.huesped1,    # Asignamos explícitamente basado en el modelo
#             fecha_llegada=self.fecha_llegada_inicial,
#             fecha_salida=self.fecha_salida_inicial,
#             numero_personas=2,
#             estado='Pendiente', # Estado inicial asumido
#             precio_por_noche=self.propiedad.precio_por_noche, # Precio base
#             precio_total=self.propiedad.precio_por_noche * 5, # Cálculo simple
#             metodo_pago='Tarjeta de crédito' # Valor de ejemplo
#         )

#         # Fecha Bloqueada para tests de conflicto
#         self.fecha_bloqueada = FechaBloqueada.objects.create(
#             propiedad=self.propiedad,
#             fecha=self.fecha_bloqueada_intermedia
#         )

#         basename = 'reserva' 
#         self.list_url = reverse(f'{basename}-list')
#         self.detail_url = lambda pk: reverse(f'{basename}-detail', args=[pk])
    
#     # En views.py, DENTRO de la clase ReservaViewSet

#     # --- Tests de Permisos Generales ---

#     def test_acciones_reserva_requieren_autenticacion(self):
#         """Verifica que todas las acciones de Reserva requieren autenticación."""
#         urls_metodos = [
#             ('GET', self.list_url),
#             ('POST', self.list_url),
#             ('GET', self.detail_url(self.reserva_inicial.id)),
#             ('PUT', self.detail_url(self.reserva_inicial.id)),
#             ('PATCH', self.detail_url(self.reserva_inicial.id)),
#             ('DELETE', self.detail_url(self.reserva_inicial.id)),
#         ]
#         for method, url in urls_metodos:
#             response = self.client.generic(method, url)
#             self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
#                           f"Fallo en {method} {url}")

#     # --- Tests de List --- (Actualmente sin filtro por usuario)

#     def test_list_reservas_huesped_ve_todas(self):
#         """GET lista reservas devuelve resultados al huésped (actualmente ve todas)."""
#         self.client.force_authenticate(user=self.huesped1_user)
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)
#         # Verifica que la reserva inicial está presente
#         self.assertTrue(any(item.get('id') == self.reserva_inicial.id for item in items_list))

#     def test_list_reservas_anfitrion_ve_todas(self):
#         """GET lista reservas devuelve resultados al anfitrión (actualmente ve todas)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)
#         self.assertTrue(any(item.get('id') == self.reserva_inicial.id for item in items_list))

#     # --- Tests de Retrieve ---

#     def test_retrieve_reserva_huesped_owner_success(self):
#         """GET detalle reserva por el huésped que la hizo funciona (200)."""
#         self.client.force_authenticate(user=self.huesped1_user)
#         resp = self.client.get(self.detail_url(self.reserva_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data['id'], self.reserva_inicial.id)

#     def test_retrieve_reserva_anfitrion_owner_success(self):
#         """GET detalle reserva por el anfitrión de la propiedad funciona (200)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp = self.client.get(self.detail_url(self.reserva_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data['id'], self.reserva_inicial.id)

#     def test_retrieve_reserva_other_user_forbidden(self):
#         """GET detalle reserva por otro usuario falla (403)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         resp = self.client.get(self.detail_url(self.reserva_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para ver esta reserva')

#     # --- Tests de Create ---

#     def test_create_reserva_success(self):
#         """POST crear reserva con datos válidos por otro huésped funciona (201)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         initial_count = Reserva.objects.count()
#         # Fechas que no solapan con la inicial ni con la bloqueada
#         fecha_llegada = self.hoy + timedelta(days=25)
#         fecha_salida = self.hoy + timedelta(days=30)
#         data = {
#             "propiedad": self.propiedad.id,
#             "fecha_llegada": fecha_llegada.strftime('%Y-%m-%d'),
#             "fecha_salida": fecha_salida.strftime('%Y-%m-%d'),
#             "numero_personas": 3,
#             "metodo_pago": "PayPal",
#             "anfitrion": self.anfitrion.id, # Asignamos explícitamente el anfitrión
#             "precio_por_noche": Decimal('100.00'), # Precio base
#             "precio_total": Decimal('500.00'), # Cálculo simple
#             "estado": "Pendiente", # Estado inicial asumido
#             "usuario": self.huesped2.id # Asignamos explícitamente el huésped

#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f"Error: {resp.data}")
#         self.assertEqual(Reserva.objects.count(), initial_count + 1)
#         # Verificamos algunos datos de la reserva creada
#         reserva_creada = Reserva.objects.latest('id')
#         self.assertEqual(reserva_creada.propiedad, self.propiedad)
#         self.assertEqual(reserva_creada.usuario, self.huesped2) 
#         self.assertEqual(reserva_creada.anfitrion, self.anfitrion)
#         self.assertEqual(reserva_creada.fecha_llegada, fecha_llegada)
#         self.assertEqual(reserva_creada.fecha_salida, fecha_salida)
#         self.assertEqual(reserva_creada.numero_personas, 3)
#         self.assertEqual(reserva_creada.estado, 'Pendiente') 

#     def test_create_reserva_campos_faltantes(self):
#         """POST crear reserva faltando campos obligatorios falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = { # Falta numero_personas y metodo_pago
#             "propiedad": self.propiedad.id,
#             "fecha_llegada": (self.hoy + timedelta(days=25)).strftime('%Y-%m-%d'),
#             "fecha_salida": (self.hoy + timedelta(days=30)).strftime('%Y-%m-%d'),
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         # La validación puede venir del serializer (si faltan campos) o de la vista
#         self.assertTrue('error' in resp.data or 'numero_personas' in resp.data or 'metodo_pago' in resp.data)

#     def test_create_reserva_formato_fecha_invalido(self):
#         """POST crear reserva con formato fecha inválido falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": "25-12-2025", "fecha_salida": "30-12-2025",
#             "numero_personas": 2, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Formato de fecha inválido (debe ser YYYY-MM-DD)') # Error de la vista

#     def test_create_reserva_cantidad_personas_cero(self):
#         """POST crear reserva con 0 personas falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         fecha_llegada = self.hoy + timedelta(days=25)
#         fecha_salida = self.hoy + timedelta(days=30)
#         data = {
#             "propiedad": self.propiedad.id,
#             "fecha_llegada": fecha_llegada.strftime('%Y-%m-%d'),
#             "fecha_salida": fecha_salida.strftime('%Y-%m-%d'),
#             "numero_personas": 0,
#             "metodo_pago": "PayPal",
#             "anfitrion": self.anfitrion.id, # Asignamos explícitamente el anfitrión
#             "precio_por_noche": Decimal('100.00'), # Precio base
#             "precio_total": Decimal('500.00'), # Cálculo simple
#             "estado": "Pendiente", # Estado inicial asumido
#             "usuario": self.huesped2.id # Asignamos explícitamente el huésped

#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         print(resp.data) # Para depurar el error
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

#         self.assertEqual(resp.data.get('error'), 'La cantidad de personas debe ser mayor a 0') # Error de la vista

#     def test_create_reserva_propiedad_inexistente(self):
#         """POST crear reserva para propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = {
#             "propiedad": 9999, "fecha_llegada": (self.hoy + timedelta(days=25)).strftime('%Y-%m-%d'),
#             "fecha_salida": (self.hoy + timedelta(days=30)).strftime('%Y-%m-%d'), "numero_personas": 2, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data.get('error'), 'Propiedad no encontrada') # Error de la vista

#     def test_create_reserva_propia_propiedad_forbidden(self):
#         """POST crear reserva en propiedad propia falla (403)."""
#         self.client.force_authenticate(user=self.anfitrion_user) # Anfitrión intenta reservar
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": (self.hoy + timedelta(days=25)).strftime('%Y-%m-%d'),
#             "fecha_salida": (self.hoy + timedelta(days=30)).strftime('%Y-%m-%d'), "numero_personas": 1, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No puedes reservar tu propia propiedad') # Error de la vista

#     def test_create_reserva_fecha_salida_antes_llegada(self):
#         """POST crear reserva con fecha salida <= llegada falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         fecha_llegada = self.hoy + timedelta(days=25)
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": fecha_llegada.strftime('%Y-%m-%d'),
#             "fecha_salida": fecha_llegada.strftime('%Y-%m-%d'), "numero_personas": 1, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fecha de llegada debe ser anterior a fecha de salida') # Error de la vista

#     def test_create_reserva_fecha_llegada_pasada(self):
#         """POST crear reserva con fecha llegada en el pasado falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         fecha_pasada = self.hoy - timedelta(days=1)
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": fecha_pasada.strftime('%Y-%m-%d'),
#             "fecha_salida": (fecha_pasada + timedelta(days=5)).strftime('%Y-%m-%d'), "numero_personas": 1, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fecha de llegada debe ser posterior a la fecha actual') # Error de la vista

#     def test_create_reserva_conflicto_fecha_bloqueada(self):
#         """POST crear reserva en fecha bloqueada falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         # Intentamos reservar incluyendo self.fecha_bloqueada_intermedia
#         fecha_llegada = self.fecha_bloqueada_intermedia - timedelta(days=2)
#         fecha_salida = self.fecha_bloqueada_intermedia + timedelta(days=2)
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": fecha_llegada.strftime('%Y-%m-%d'),
#             "fecha_salida": fecha_salida.strftime('%Y-%m-%d'), "numero_personas": 1, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fechas bloqueadas') # Error de la vista

#     def test_create_reserva_conflicto_reserva_existente(self):
#         """POST crear reserva que solapa con existente falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         # Intentamos reservar solapando con self.reserva_inicial
#         fecha_llegada = self.fecha_llegada_inicial + timedelta(days=1) # Dentro del rango inicial
#         fecha_salida = self.fecha_salida_inicial + timedelta(days=1) # Fuera del rango inicial
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": fecha_llegada.strftime('%Y-%m-%d'),
#             "fecha_salida": fecha_salida.strftime('%Y-%m-%d'), "numero_personas": 1, "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Propiedad ocupada en esas fechas') # Error de la vista

#     def test_create_reserva_excede_max_huespedes(self):
#         """POST crear reserva excediendo max_huespedes falla (400)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = {
#             "propiedad": self.propiedad.id, "fecha_llegada": (self.hoy + timedelta(days=25)).strftime('%Y-%m-%d'),
#             "fecha_salida": (self.hoy + timedelta(days=30)).strftime('%Y-%m-%d'),
#             "numero_personas": self.propiedad.maximo_huespedes + 1, # Una persona más del límite
#              "metodo_pago": "PayPal"
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Cantidad de personas excede el límite') # Error de la vista

#     # --- Tests de Update (Estado) ---

#     def test_update_estado_anfitrion_acepta_success(self):
#         """PUT anfitrión acepta reserva pendiente funciona (200)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         self.assertEqual(self.reserva_inicial.estado, 'Pendiente')
#         data = {'estado': 'Aceptada'}
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data.get('status'), 'estado actualizado')
#         self.reserva_inicial.refresh_from_db()
#         self.assertEqual(self.reserva_inicial.estado, 'Aceptada')
#         self.assertIsNotNone(self.reserva_inicial.fecha_aceptacion_rechazo)

#     def test_update_estado_anfitrion_cancela_success(self):
#         """PUT anfitrión cancela reserva pendiente funciona (200)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {'estado': 'Cancelada'}
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.reserva_inicial.refresh_from_db()
#         self.assertEqual(self.reserva_inicial.estado, 'Cancelada')
#         self.assertIsNotNone(self.reserva_inicial.fecha_aceptacion_rechazo)

#     def test_update_estado_huesped_cancela_success(self):
#         """PUT huésped cancela su reserva pendiente funciona (200)."""
#         self.client.force_authenticate(user=self.huesped1_user) # El que hizo la reserva
#         data = {'estado': 'Cancelada'}
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.reserva_inicial.refresh_from_db()
#         self.assertEqual(self.reserva_inicial.estado, 'Cancelada')
#         self.assertIsNotNone(self.reserva_inicial.fecha_aceptacion_rechazo)

#     def test_update_estado_huesped_acepta_forbidden(self):
#         """PUT huésped intenta aceptar su reserva falla (403)."""
#         self.client.force_authenticate(user=self.huesped1_user)
#         data = {'estado': 'Aceptada'}
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para cambiar el estado de esta reserva')

#     def test_update_estado_other_user_forbidden(self):
#         """PUT otro usuario intenta cambiar estado falla (403)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = {'estado': 'Cancelada'}
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para cambiar el estado de esta reserva')

#     def test_update_estado_invalido(self):
#         """PUT anfitrión intenta poner estado inválido falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {'estado': 'Confirmada'} # Estado no en choices
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Estado inválido')

#     def test_update_estado_faltante(self):
#         """PUT sin enviar estado falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {} # Sin campo estado
#         resp = self.client.put(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Estado es requerido')

#     # --- Tests de Partial Update ---

#     def test_partial_update_other_user_forbidden(self):
#         """PATCH otro usuario intenta modificar falla (403)."""
#         self.client.force_authenticate(user=self.huesped2_user)
#         data = {'comentarios_usuario': 'Intento fallido'}
#         resp = self.client.patch(self.detail_url(self.reserva_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para editar esta reserva')

#     def test_partial_update_cambiar_estado(self):
#         """PATCH permite cambiar estado (posible inconsistencia con PUT?)."""
#         # Probamos si el anfitrión puede cambiar estado via PATCH
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {'estado': 'Aceptada'}
#         resp = self.client.patch(self.detail_url(self.reserva_inicial.id), data, format='json')
#         # Si funciona, puede ser intencional o no. El código actual lo permite.
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.reserva_inicial.refresh_from_db()
#         self.assertEqual(self.reserva_inicial.estado, 'Aceptada')
#         # ¡OJO! No se actualiza fecha_aceptacion_rechazo vía PATCH con el código actual


#     # --- Tests de Destroy ---

#     def test_destroy_reserva_forbidden(self):
#         """DELETE eliminar reserva está prohibido (403)."""
#         # Probamos con huésped
#         self.client.force_authenticate(user=self.huesped1_user)
#         resp_huesped = self.client.delete(self.detail_url(self.reserva_inicial.id))
#         self.assertEqual(resp_huesped.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_huesped.data.get('error'), 'No puedes eliminar reservas')
#         # Probamos con anfitrión
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp_anfitrion = self.client.delete(self.detail_url(self.reserva_inicial.id))
#         self.assertEqual(resp_anfitrion.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp_anfitrion.data.get('error'), 'No puedes eliminar reservas')


# class FavoritoViewSetTests(APITestCase):

#     def setUp(self):
#         """Configura los datos necesarios antes de cada test."""
#         # Usuarios de Django
#         self.user1 = User.objects.create_user('user1fav', 'user1f@test.com', 'password123')
#         self.user2 = User.objects.create_user('user2fav', 'user2f@test.com', 'password123')
#         # Necesitamos un anfitrión para crear propiedades
#         self.anfitrion_user = User.objects.create_user('anfitrionfav', 'anfitrionfav@test.com', 'password123')

#         # Perfiles de Usuario
#         fecha_nacimiento_valida = timezone.now().date() - timedelta(days=365*30)
#         self.usuario1 = Usuario.objects.create(usuario=self.user1, dni='11122233A', telefono='611222333', direccion='C/ Fav 1', fecha_de_nacimiento=fecha_nacimiento_valida)
#         self.usuario2 = Usuario.objects.create(usuario=self.user2, dni='44455566B', telefono='644555666', direccion='C/ Fav 2', fecha_de_nacimiento=fecha_nacimiento_valida)
#         self.anfitrion = Usuario.objects.create(usuario=self.anfitrion_user, dni='77788899C', telefono='677888999', direccion='C/ Anfitrion Fav 3', fecha_de_nacimiento=fecha_nacimiento_valida)

#         # Propiedades creadas por el anfitrión
#         self.propiedad1 = Propiedad.objects.create(
#             anfitrion=self.anfitrion, nombre='Casa Favorita 1', descripcion='Desc Fav 1',
#             direccion='Dir Fav 1', ciudad='FavCity', pais='FavCountry', codigo_postal='11111',
#             tipo_de_propiedad='Casa', precio_por_noche=50.00, maximo_huespedes=2,
#             numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=40,
#             politica_de_cancelacion='Flexible'
#         )
#         self.propiedad2 = Propiedad.objects.create(
#             anfitrion=self.anfitrion, nombre='Apartamento Favorito 2', descripcion='Desc Fav 2',
#             direccion='Dir Fav 2', ciudad='FavCity', pais='FavCountry', codigo_postal='22222',
#             tipo_de_propiedad='Apartamento', precio_por_noche=75.00, maximo_huespedes=3,
#             numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=2, tamano=60,
#             politica_de_cancelacion='Moderada'
#         )

#         # Favorito Inicial: usuario1 marca propiedad1 como favorita
#         self.favorito_inicial = Favorito.objects.create(
#             usuario=self.usuario1,
#             propiedad=self.propiedad1
#         )

#         # URLs (usando basename='favorito' derivado del modelo)
#         basename = 'favorito'
#         self.list_url = reverse(f'{basename}-list')
#         self.detail_url = lambda pk: reverse(f'{basename}-detail', args=[pk])

#     # --- Tests de Permisos ---

#     def test_acciones_favorito_requieren_autenticacion(self):
#         """Verifica que todas las acciones de Favorito requieren autenticación."""
#         urls_metodos = [
#             ('GET', self.list_url),
#             ('POST', self.list_url),
#             ('GET', self.detail_url(self.favorito_inicial.id)),
#             ('PUT', self.detail_url(self.favorito_inicial.id)),
#             ('PATCH', self.detail_url(self.favorito_inicial.id)),
#             ('DELETE', self.detail_url(self.favorito_inicial.id)),
#         ]
#         for method, url in urls_metodos:
#             response = self.client.generic(method, url)
#             # Como todas requieren IsAuthenticated, esperamos 401 o 403
#             self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
#                           f"Fallo en {method} {url}")

#     def test_update_favorito_forbidden(self):
#         """PUT actualizar favorito está prohibido (403)."""
#         self.client.force_authenticate(user=self.user1)
#         data = {'propiedad': self.propiedad2.id} # Dato de ejemplo
#         resp = self.client.put(self.detail_url(self.favorito_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No puedes actualizar favoritos')

#     def test_partial_update_favorito_forbidden(self):
#         """PATCH actualizar favorito está prohibido (403)."""
#         self.client.force_authenticate(user=self.user1)
#         data = {'propiedad': self.propiedad2.id} # Dato de ejemplo
#         resp = self.client.patch(self.detail_url(self.favorito_inicial.id), data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No puedes actualizar favoritos')

#     # --- Tests de List ---

#     def test_list_favoritos_success(self):
#         """GET lista favoritos devuelve solo los del usuario autenticado."""
#         self.client.force_authenticate(user=self.user1)
#         # Creamos otro favorito para otro usuario para asegurar el filtro
#         Favorito.objects.create(usuario=self.usuario2, propiedad=self.propiedad1)

#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)

#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)

#         # Verificamos que solo hay 1 favorito (el inicial de usuario1)
#         self.assertEqual(len(items_list), 1)
#         # Verificamos que el ID es el correcto
#         self.assertEqual(items_list[0].get('id'), self.favorito_inicial.id)
#         # Verificamos que el usuario es el correcto (comparando IDs)
#         self.assertEqual(items_list[0].get('usuario'), self.usuario1.id)

#     def test_list_favoritos_otro_usuario_vacio(self):
#         """GET lista favoritos para un usuario sin favoritos está vacía."""
#         self.client.force_authenticate(user=self.user2) # user2 no tiene favoritos aún
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)

#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)
#         # La lista debe estar vacía
#         self.assertEqual(len(items_list), 0)

#     # --- Tests de Retrieve ---

#     def test_retrieve_favorito_owner_success(self):
#         """GET detalle favorito por su dueño funciona (200)."""
#         self.client.force_authenticate(user=self.user1)
#         resp = self.client.get(self.detail_url(self.favorito_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data.get('id'), self.favorito_inicial.id)
#         self.assertEqual(resp.data.get('usuario'), self.usuario1.id) # Verifica el dueño

#     def test_retrieve_favorito_other_user_forbidden(self):
#         """GET detalle favorito por otro usuario falla (403)."""
#         self.client.force_authenticate(user=self.user2) # user2 intenta ver favorito de user1
#         resp = self.client.get(self.detail_url(self.favorito_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para ver este favorito')

#     # --- Tests de Create ---

#     def test_create_favorito_success(self):
#         """POST crear favorito para el usuario autenticado funciona (201)."""
#         self.client.force_authenticate(user=self.user1)
#         initial_count = Favorito.objects.count()
#         # user1 marca propiedad2 como favorita
#         data = {
#             "propiedad": self.propiedad2.id,
#             # Enviamos el ID del usuario autenticado (aunque la vista podría ignorarlo)
#             "usuario": self.usuario1.id
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f"Error: {resp.data}")
#         self.assertEqual(resp.data.get('status'), 'favorito creado')
#         self.assertEqual(Favorito.objects.count(), initial_count + 1)
#         # Verificamos que se creó correctamente
#         self.assertTrue(Favorito.objects.filter(usuario=self.usuario1, propiedad=self.propiedad2).exists())

#     def test_create_favorito_campos_faltantes(self):
#         """POST crear favorito faltando propiedad o usuario falla (400)."""
#         self.client.force_authenticate(user=self.user1)
#         # Faltando propiedad
#         data_no_prop = {"usuario": self.usuario1.id}
#         resp_no_prop = self.client.post(self.list_url, data_no_prop, format='json')
#         self.assertEqual(resp_no_prop.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp_no_prop.data.get('error'), 'Propiedad es requerida')
       

#     def test_create_favorito_propiedad_inexistente(self):
#         """POST crear favorito con propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.user1)
#         data = {"propiedad": 9999, "usuario": self.usuario1.id}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data.get('error'), 'Propiedad no encontrada')

#     def test_create_favorito_duplicado(self):
#         """POST crear favorito duplicado falla (400)."""
#         self.client.force_authenticate(user=self.user1)
#         # usuario1 ya tiene propiedad1 como favorita (self.favorito_inicial)
#         data = {"propiedad": self.propiedad1.id, "usuario": self.usuario1.id}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         # Verificamos el mensaje específico del bloque except IntegrityError
#         self.assertEqual(resp.data.get('error'), 'Ya has marcado esta propiedad como favorita')

#     def test_create_favorito_para_otro_usuario(self):
#         """POST crear favorito ignora el usuario_id enviado y usa el request.user."""
#         self.client.force_authenticate(user=self.user1) # user1 está autenticado
#         initial_count = Favorito.objects.count()
#         initial_count_user1 = Favorito.objects.filter(usuario=self.usuario1).count()
#         initial_count_user2 = Favorito.objects.filter(usuario=self.usuario2).count()

#         # user1 intenta crear un favorito para user2, enviando el ID de user2
#         # La vista modificada debería ignorar "usuario": self.usuario2.id
#         data = {"propiedad": self.propiedad2.id, "usuario": self.usuario2.id}
#         resp = self.client.post(self.list_url, data, format='json')

#         # Verificamos que la creación fue exitosa (201)
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f"Error: {resp.data}")
#         self.assertEqual(Favorito.objects.count(), initial_count + 1)

#         # VERIFICAMOS QUE SE CREÓ PARA USER1 (el autenticado), NO PARA USER2
#         self.assertTrue(Favorito.objects.filter(usuario=self.usuario1, propiedad=self.propiedad2).exists(),
#                         "El favorito no se creó para el usuario autenticado (user1).")
#         self.assertFalse(Favorito.objects.filter(usuario=self.usuario2, propiedad=self.propiedad2).exists(),
#                         "El favorito se creó incorrectamente para user2.")
#         # Verificamos contadores
#         self.assertEqual(Favorito.objects.filter(usuario=self.usuario1).count(), initial_count_user1 + 1)
#         self.assertEqual(Favorito.objects.filter(usuario=self.usuario2).count(), initial_count_user2) # No debe aumentar
       
#      # --- Tests de Destroy ---

#     def test_destroy_favorito_owner_success(self):
#         """DELETE eliminar favorito por su dueño funciona (204)."""
#         self.client.force_authenticate(user=self.user1)
#         initial_count = Favorito.objects.count()
#         favorito_id = self.favorito_inicial.id # Guardamos ID antes de borrar

#         resp = self.client.delete(self.detail_url(favorito_id))

#         self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertEqual(Favorito.objects.count(), initial_count - 1)
#         with self.assertRaises(Favorito.DoesNotExist):
#             Favorito.objects.get(id=favorito_id)

#     def test_destroy_favorito_other_user_forbidden(self):
#         """DELETE eliminar favorito por otro usuario falla (403)."""
#         self.client.force_authenticate(user=self.user2) # user2 intenta borrar favorito de user1
#         initial_count = Favorito.objects.count()
#         resp = self.client.delete(self.detail_url(self.favorito_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para eliminar este favorito')
#         self.assertEqual(Favorito.objects.count(), initial_count) # No se borró nada

#     def test_destroy_favorito_not_found(self):
#         """DELETE eliminar favorito inexistente falla (404)."""
#         self.client.force_authenticate(user=self.user1)
#         resp = self.client.delete(self.detail_url(9999)) # ID inválido
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# class PrecioEspecialViewSetTests(APITestCase):

#     def setUp(self):
#         """Configura los datos necesarios antes de cada test."""
#         # Usuarios de Django
#         self.anfitrion_user = User.objects.create_user('anfitrionprecio', 'anfitrionp@test.com', 'password123')
#         self.otro_user = User.objects.create_user('otroprecio', 'otrop@test.com', 'password123')

#         # Perfiles de Usuario
#         fecha_nacimiento_valida = timezone.now().date() - timedelta(days=365*30)
#         self.anfitrion = Usuario.objects.create(usuario=self.anfitrion_user, dni='11133355A', telefono='611333555', direccion='C/ Anfitrion Precio 1', fecha_de_nacimiento=fecha_nacimiento_valida)
#         self.otro = Usuario.objects.create(usuario=self.otro_user, dni='22244466B', telefono='622444666', direccion='C/ Otro Precio 2', fecha_de_nacimiento=fecha_nacimiento_valida)

#         # Propiedad del anfitrión
#         self.propiedad = Propiedad.objects.create(
#             anfitrion=self.anfitrion, nombre='Apartamento Precios', descripcion='Apto para testear precios',
#             direccion='Av Precios 123', ciudad='TestPriceCity', pais='TestPriceCountry', codigo_postal='98765',
#             tipo_de_propiedad='Apartamento', precio_por_noche=Decimal('80.00'), maximo_huespedes=3,
#             numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=2, tamano=55,
#             politica_de_cancelacion='Moderada'
#         )

#         # Precio Especial Inicial (próximo mes)
#         self.hoy = timezone.now().date()
#         self.fecha_inicio_inicial = self.hoy + timedelta(days=30)
#         self.fecha_fin_inicial = self.hoy + timedelta(days=40) # Periodo de 10 días
#         self.precio_inicial_valor = Decimal('70.00')

#         self.precio_especial_inicial = PrecioEspecial.objects.create(
#             propiedad=self.propiedad,
#             fecha_inicio=self.fecha_inicio_inicial,
#             fecha_fin=self.fecha_fin_inicial,
#             precio_especial=self.precio_inicial_valor
#         )

#         # URLs (usando basename='precioespecial' derivado del modelo)
#         basename = 'precioespecial'
#         self.list_url = reverse(f'{basename}-list')
#         self.detail_url = lambda pk: reverse(f'{basename}-detail', args=[pk])

#     # --- Tests Públicos / Acciones Deshabilitadas ---

#     def test_list_precios_unauthenticated(self):
#         """GET lista precios no requiere auth (AllowAny)."""
#         resp = self.client.get(self.list_url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         # Verificamos si el precio inicial está (considerando paginación)
#         items_list = resp.data.get('results') if isinstance(resp.data, dict) and 'results' in resp.data else resp.data
#         self.assertIsInstance(items_list, list)
#         self.assertTrue(any(item.get('id') == self.precio_especial_inicial.id for item in items_list),
#                         f"ID {self.precio_especial_inicial.id} no encontrado en {items_list}")

#     def test_retrieve_precio_unauthenticated(self):
#         """GET detalle precio no requiere auth (AllowAny)."""
#         resp = self.client.get(self.detail_url(self.precio_especial_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertEqual(resp.data.get('id'), self.precio_especial_inicial.id)
#         # DRF serializa Decimal como string por defecto
#         self.assertEqual(resp.data.get('precio_especial'), f"{self.precio_inicial_valor:.2f}")

#     def test_update_precio_forbidden(self):
#         """PUT actualizar precio está prohibido (403)."""
#         data = {'precio_especial': '60.00'}
#         # Probamos sin autenticar
#         resp_unauth = self.client.put(self.detail_url(self.precio_especial_inicial.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_401_UNAUTHORIZED)
#         # Probamos autenticados como anfitrión
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp_auth = self.client.put(self.detail_url(self.precio_especial_inicial.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertEqual(resp_auth.data.get('error'), 'No puedes actualizar precios especiales')

#     def test_partial_update_precio_forbidden(self):
#         """PATCH actualizar precio está prohibido (403)."""
#         data = {'precio_especial': '60.00'}
#          # Probamos sin autenticar
#         resp_unauth = self.client.patch(self.detail_url(self.precio_especial_inicial.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_401_UNAUTHORIZED)
#         # Probamos autenticados como anfitrión
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp_auth = self.client.patch(self.detail_url(self.precio_especial_inicial.id), data, format='json')
#         self.assertEqual(resp_unauth.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertEqual(resp_auth.data.get('error'), 'No puedes actualizar precios especiales')

#     # --- Tests de Create ---

#     def test_create_precio_unauthenticated(self):
#         """POST crear precio requiere auth (IsAuthenticated)."""
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': '50.00'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_create_precio_not_owner(self):
#         """POST crear precio como usuario no anfitrión falla (403)."""
#         self.client.force_authenticate(user=self.otro_user) # Autenticado como otro usuario
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': '50.00'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para establecer precios especiales en esta propiedad')

#     def test_create_precio_owner_success(self):
#         """POST crear precio como anfitrión funciona (201)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         initial_count = PrecioEspecial.objects.count()
#         fecha_inicio = self.hoy + timedelta(days=50)
#         fecha_fin = self.hoy + timedelta(days=60)
#         precio_nuevo = Decimal('55.50')
#         data = {
#             'propiedad': self.propiedad.id,
#             'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
#             'fecha_fin': fecha_fin.strftime('%Y-%m-%d'),
#             'precio_especial': f"{precio_nuevo:.2f}" # Enviar como string
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f"Error: {resp.data}")
#         self.assertEqual(resp.data.get('status'), 'precio especial creado')
#         self.assertEqual(PrecioEspecial.objects.count(), initial_count + 1)
#         # Verificamos creación
#         self.assertTrue(PrecioEspecial.objects.filter(
#             propiedad=self.propiedad, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, precio_especial=precio_nuevo
#         ).exists())

#     def test_create_precio_campos_faltantes(self):
#         """POST crear precio faltando campos falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         # Faltando precio_especial
#         data_no_precio = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin}
#         resp_no_precio = self.client.post(self.list_url, data_no_precio, format='json')
#         self.assertEqual(resp_no_precio.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp_no_precio.data.get('error'), 'Todos los campos son obligatorios')

#     def test_create_precio_formato_fecha_invalido(self):
#         """POST crear precio con formato fecha inválido falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': '50-12-2025', 'fecha_fin': '60-12-2025', 'precio_especial': '50.00'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Formato de fecha inválido (debe ser YYYY-MM-DD)')

#     def test_create_precio_valor_invalido_cero(self):
#         """POST crear precio con valor 0 falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': '0'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'El precio especial debe ser mayor a 0')

#     def test_create_precio_valor_invalido_negativo(self):
#         """POST crear precio con valor negativo falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': '-10.00'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'El precio especial debe ser mayor a 0')

#     def test_create_precio_valor_invalido_no_numerico(self):
#         """POST crear precio con valor no numérico falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': 'abc'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Precio especial inválido')

#     def test_create_precio_propiedad_inexistente(self):
#         """POST crear precio para propiedad inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = (self.hoy + timedelta(days=50)).strftime('%Y-%m-%d')
#         fecha_fin = (self.hoy + timedelta(days=60)).strftime('%Y-%m-%d')
#         data = {'propiedad': 9999, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'precio_especial': '50.00'}
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertEqual(resp.data.get('error'), 'Propiedad no encontrada')

#     def test_create_precio_fecha_fin_igual_inicio(self):
#         """POST crear precio con fecha fin == fecha inicio falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = self.hoy + timedelta(days=50)
#         data = {
#             'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
#             'fecha_fin': fecha_inicio.strftime('%Y-%m-%d'), 'precio_especial': '50.00'
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fecha de inicio debe ser anterior a fecha de fin')

#     def test_create_precio_fecha_fin_antes_inicio(self):
#         """POST crear precio con fecha fin < fecha inicio falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = self.hoy + timedelta(days=50)
#         fecha_fin = fecha_inicio - timedelta(days=1) # Fecha fin anterior a inicio
#         data = {
#             'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
#             'fecha_fin': fecha_fin.strftime('%Y-%m-%d'), 'precio_especial': '50.00'
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fecha de inicio debe ser anterior a fecha de fin')

#     def test_create_precio_fecha_inicio_pasada(self):
#         """POST crear precio con fecha inicio en el pasado falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         fecha_inicio = self.hoy - timedelta(days=1)
#         fecha_fin = fecha_inicio + timedelta(days=5)
#         data = {
#             'propiedad': self.propiedad.id, 'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
#             'fecha_fin': fecha_fin.strftime('%Y-%m-%d'), 'precio_especial': '50.00'
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Fecha de inicio debe ser posterior a la fecha actual')

#     def test_create_precio_duplicado_exacto(self):
#         """POST crear precio duplicado exacto falla (400)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         # Usamos las fechas y propiedad del precio_especial_inicial creado en setUp
#         data = {
#             'propiedad': self.propiedad.id,
#             'fecha_inicio': self.fecha_inicio_inicial.strftime('%Y-%m-%d'),
#             'fecha_fin': self.fecha_fin_inicial.strftime('%Y-%m-%d'),
#             'precio_especial': '60.00' # Precio diferente, pero mismo rango/propiedad
#         }
#         resp = self.client.post(self.list_url, data, format='json')
#         # Esperamos 400 por el bloque except IntegrityError de la vista
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(resp.data.get('error'), 'Ya existe un precio especial para estas fechas')


#     # --- Tests de Destroy ---

#     def test_destroy_precio_unauthenticated(self):
#         """DELETE eliminar precio requiere auth."""
#         resp = self.client.delete(self.detail_url(self.precio_especial_inicial.id))
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_destroy_precio_not_owner(self):
#         """DELETE eliminar precio como usuario no anfitrión falla (403)."""
#         self.client.force_authenticate(user=self.otro_user) # Autenticado como otro
#         resp = self.client.delete(self.detail_url(self.precio_especial_inicial.id))
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para eliminar este precio especial')

#     def test_destroy_precio_owner_success(self):
#         """DELETE eliminar precio como anfitrión funciona (204)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         initial_count = PrecioEspecial.objects.count()
#         precio_id = self.precio_especial_inicial.id # Guardamos ID

#         resp = self.client.delete(self.detail_url(precio_id))

#         self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertEqual(PrecioEspecial.objects.count(), initial_count - 1)
#         with self.assertRaises(PrecioEspecial.DoesNotExist):
#             PrecioEspecial.objects.get(id=precio_id)

#     def test_destroy_precio_not_found(self):
#         """DELETE eliminar precio inexistente falla (404)."""
#         self.client.force_authenticate(user=self.anfitrion_user)
#         resp = self.client.delete(self.detail_url(9999)) # ID inválido
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)



# # Asumiendo que esta función auxiliar existe o la defines aquí
# def create_test_image(name='test_image.jpg', content_type='image/jpeg', size=1024):
#     """Crea un SimpleUploadedFile simulando una imagen para tests."""
#     return SimpleUploadedFile(name, b'0' * size, content_type=content_type)

# class FunctionBasedViewTests(APITestCase):

#     @classmethod
#     def setUpTestData(cls):
#         """Usamos setUpTestData para crear datos una vez por clase."""
#         # Usuarios
#         cls.anfitrion1_user = User.objects.create_user('anfitrion_fbv', 'afbv@test.com', 'password123')
#         cls.huesped1_user = User.objects.create_user('huesped1_fbv', 'h1fbv@test.com', 'password123')
#         cls.huesped2_user = User.objects.create_user('huesped2_fbv', 'h2fbv@test.com', 'password123')

#         # Perfiles
#         # Usar una fecha válida que no cause problemas con MaxValueValidator
#         cls.fecha_nacimiento_valida = date(1990, 1, 1)
#         cls.anfitrion1 = Usuario.objects.create(usuario=cls.anfitrion1_user, dni='11122244A', telefono='611222444', direccion='C/ Func 1', fecha_de_nacimiento=cls.fecha_nacimiento_valida)
#         cls.huesped1 = Usuario.objects.create(usuario=cls.huesped1_user, dni='55566677B', telefono='655666777', direccion='C/ Func 2', fecha_de_nacimiento=cls.fecha_nacimiento_valida)
#         cls.huesped2 = Usuario.objects.create(usuario=cls.huesped2_user, dni='88899900C', telefono='688999000', direccion='C/ Func 3', fecha_de_nacimiento=cls.fecha_nacimiento_valida)

#         # Propiedades
#         cls.prop1 = Propiedad.objects.create(
#             anfitrion=cls.anfitrion1, nombre='Casa Func Test 1', descripcion='Desc Func 1',
#             direccion='Dir Func 1', ciudad='TestCityFunc', pais='TestCountryFunc', codigo_postal='11111',
#             tipo_de_propiedad='Casa', precio_por_noche=Decimal('100.00'), maximo_huespedes=4,
#             numero_de_habitaciones=2, numero_de_banos=1, numero_de_camas=3, tamano=90, politica_de_cancelacion='Flexible'
#         )
#         cls.prop2 = Propiedad.objects.create(
#             anfitrion=cls.anfitrion1, nombre='Apto Func Test 2', descripcion='Desc Func 2',
#             direccion='Dir Func 2', ciudad='OtherCityFunc', pais='TestCountryFunc', codigo_postal='22222',
#             tipo_de_propiedad='Apartamento', precio_por_noche=Decimal('80.00'), maximo_huespedes=2,
#             numero_de_habitaciones=1, numero_de_banos=1, numero_de_camas=1, tamano=50, politica_de_cancelacion='Estricta'
#         )

#         # Fechas
#         cls.hoy = timezone.now().date()

#         # Reservas (con estados y fechas variadas para tendencias)
#         cls.reserva_pasado = Reserva.objects.create(
#             propiedad=cls.prop1, anfitrion=cls.anfitrion1, usuario=cls.huesped1,
#             fecha_llegada=cls.hoy - relativedelta(months=2) + timedelta(days=5), # Mes -2
#             fecha_salida=cls.hoy - relativedelta(months=2) + timedelta(days=10),
#             numero_personas=2, precio_por_noche=cls.prop1.precio_por_noche, precio_total=cls.prop1.precio_por_noche*5,
#             estado='Aceptada', metodo_pago='Tarjeta de crédito'
#         )
#         cls.reserva_actual = Reserva.objects.create(
#             propiedad=cls.prop1, anfitrion=cls.anfitrion1, usuario=cls.huesped2,
#             fecha_llegada=cls.hoy + timedelta(days=5), fecha_salida=cls.hoy + timedelta(days=15), # 10 noches
#             numero_personas=1, precio_por_noche=cls.prop1.precio_por_noche, precio_total=cls.prop1.precio_por_noche*10,
#             estado='Aceptada', metodo_pago='PayPal'
#         )
#         cls.reserva_pendiente = Reserva.objects.create(
#             propiedad=cls.prop2, anfitrion=cls.anfitrion1, usuario=cls.huesped1,
#             fecha_llegada=cls.hoy + timedelta(days=20), fecha_salida=cls.hoy + timedelta(days=25),
#             numero_personas=1, precio_por_noche=cls.prop2.precio_por_noche, precio_total=cls.prop2.precio_por_noche*5,
#             estado='Pendiente', metodo_pago='Tarjeta de crédito'
#         )

#         # Favoritos
#         cls.fav1 = Favorito.objects.create(usuario=cls.huesped1, propiedad=cls.prop1)
#         cls.fav2 = Favorito.objects.create(usuario=cls.huesped1, propiedad=cls.prop2)
#         cls.fav3 = Favorito.objects.create(usuario=cls.huesped2, propiedad=cls.prop1)

#         # Valoraciones
#         cls.val1 = ValoracionPropiedad.objects.create(propiedad=cls.prop1, usuario=cls.huesped1, valoracion=5, comentario='Excelente!')
#         cls.val2 = ValoracionPropiedad.objects.create(propiedad=cls.prop1, usuario=cls.huesped2, valoracion=4, comentario='Muy bueno')

#         # Fotos
#         cls.foto1_p1 = FotoPropiedad.objects.create(propiedad=cls.prop1, foto=create_test_image('f1p1.jpg', 'image/jpeg', 10), es_portada=True)
#         cls.foto2_p1 = FotoPropiedad.objects.create(propiedad=cls.prop1, foto=create_test_image('f2p1.jpg', 'image/jpeg', 10), es_portada=False)
#         cls.foto1_p2 = FotoPropiedad.objects.create(propiedad=cls.prop2, foto=create_test_image('f1p2.jpg', 'image/jpeg', 10), es_portada=True)

#         # Fechas Bloqueadas
#         cls.fb1 = FechaBloqueada.objects.create(propiedad=cls.prop1, fecha=cls.hoy + timedelta(days=50))
#         cls.fb2 = FechaBloqueada.objects.create(propiedad=cls.prop1, fecha=cls.hoy + timedelta(days=51))

#         # Precios Especiales
#         cls.pe_actual = PrecioEspecial.objects.create(propiedad=cls.prop1, fecha_inicio=cls.hoy+timedelta(days=6), fecha_fin=cls.hoy+timedelta(days=9), precio_especial=Decimal('90.00')) # Dentro reserva_actual
#         cls.pe_pasado = PrecioEspecial.objects.create(propiedad=cls.prop1, fecha_inicio=cls.hoy-relativedelta(months=2)+timedelta(days=6), fecha_fin=cls.hoy-relativedelta(months=2)+timedelta(days=9), precio_especial=Decimal('110.00')) # Dentro reserva_pasado

#         # Cliente API
#         cls.client = APIClient()

#     # --- Helper para construir URLs (asumiendo que no están bajo /api/) ---
#     def _get_url(self, path_template, **kwargs):
#         # !!! Prefijo confirmado desde tu urls.py principal !!!
#         URL_PREFIX = '/api/propiedades/' # <--- CORREGIDO

#         # Construye la ruta relativa
#         relative_path = path_template.format(**kwargs)
#         # Asegura que no empiece con '/' para evitar dobles barras
#         if relative_path.startswith('/'):
#             relative_path = relative_path[1:]

#         # Combina prefijo y ruta
#         # Asegura que el prefijo termine en '/' y no haya doble barra
#         prefix = URL_PREFIX.rstrip('/') + '/' if URL_PREFIX else ''
#         full_url = prefix + relative_path

#         # Asegura que la URL final empieza con '/' si no está vacía
#         if full_url and not full_url.startswith('/'):
#              full_url = '/' + full_url
#         elif not full_url:
#              full_url = '/' # Devolver al menos la raíz si todo está vacío

#         return full_url

#     # --- Tests para propiedades_por_usuario ---

#     def test_propiedades_por_usuario_unauthenticated(self):
#         url = self._get_url('propiedades-por-usuario/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_propiedades_por_usuario_owner_success(self):
#         self.client.force_authenticate(user=self.anfitrion1_user)
#         url = self._get_url('propiedades-por-usuario/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2)
#         ids_props = {p['id'] for p in resp.data}
#         self.assertIn(self.prop1.id, ids_props)
#         self.assertIn(self.prop2.id, ids_props)

#     def test_propiedades_por_usuario_other_user_forbidden(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('propiedades-por-usuario/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertEqual(resp.data.get('error'), 'No tienes permiso para ver estas propiedades')

#     def test_propiedades_por_usuario_owner_no_props_success(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('propiedades-por-usuario/{usuario_id}/', usuario_id=self.huesped1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 0)

#     # --- Tests para valoraciones_por_propiedad ---

#     def test_valoraciones_por_propiedad_success(self):
#         url = self._get_url('valoraciones-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2)
#         ids_vals = {v['id'] for v in resp.data}
#         self.assertIn(self.val1.id, ids_vals)
#         self.assertIn(self.val2.id, ids_vals)

#     def test_valoraciones_por_propiedad_not_found(self):
#         url = self._get_url('valoraciones-por-propiedad/{propiedad_id}/', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para reservas_por_propiedad ---

#     def test_reservas_por_propiedad_unauthenticated(self):
#         url = self._get_url('reservas-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_reservas_por_propiedad_authenticated_success(self):
#         self.client.force_authenticate(user=self.huesped1_user) # Cualquiera autenticado
#         url = self._get_url('reservas-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2) # reserva_pasado y reserva_actual
#         ids_reservas = {r['id'] for r in resp.data}
#         self.assertIn(self.reserva_pasado.id, ids_reservas)
#         self.assertIn(self.reserva_actual.id, ids_reservas)

#     def test_reservas_por_propiedad_not_found(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('reservas-por-propiedad/{propiedad_id}/', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para precios_especiales_por_propiedad ---

#     def test_precios_especiales_por_propiedad_success(self):
#         url = self._get_url('precios-especiales-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2) # pe_actual y pe_pasado
#         ids_precios = {p['id'] for p in resp.data}
#         self.assertIn(self.pe_actual.id, ids_precios)
#         self.assertIn(self.pe_pasado.id, ids_precios)

#     def test_precios_especiales_por_propiedad_not_found(self):
#         url = self._get_url('precios-especiales-por-propiedad/{propiedad_id}/', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para favoritos_por_usuario ---

#     def test_favoritos_por_usuario_unauthenticated(self):
#         url = self._get_url('favoritos-por-usuario/{usuario_id}/', usuario_id=self.huesped1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_favoritos_por_usuario_owner_success(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('favoritos-por-usuario/{usuario_id}/', usuario_id=self.huesped1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2) # fav1 y fav2
#         ids_favs = {f['id'] for f in resp.data}
#         self.assertIn(self.fav1.id, ids_favs)
#         self.assertIn(self.fav2.id, ids_favs)

#     def test_favoritos_por_usuario_other_user_forbidden(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('favoritos-por-usuario/{usuario_id}/', usuario_id=self.huesped2.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

#     # --- Tests para fotos_por_propiedad ---

#     def test_fotos_por_propiedad_success(self):
#         url = self._get_url('fotos-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2) # foto1_p1 y foto2_p1
#         ids_fotos = {f['id'] for f in resp.data}
#         self.assertIn(self.foto1_p1.id, ids_fotos)
#         self.assertIn(self.foto2_p1.id, ids_fotos)

#     def test_fotos_por_propiedad_not_found(self):
#         url = self._get_url('fotos-por-propiedad/{propiedad_id}/', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para solicitudes_de_reserva_anfitrion ---

#     def test_solicitudes_anfitrion_unauthenticated(self):
#         url = self._get_url('solicitudes-reserva-anfitrion/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_solicitudes_anfitrion_owner_success(self):
#         self.client.force_authenticate(user=self.anfitrion1_user)
#         url = self._get_url('solicitudes-reserva-anfitrion/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         # Anfitrion1 es anfitrión de reserva_pasado, reserva_actual, reserva_pendiente
#         self.assertEqual(len(resp.data), 3)
#         ids_reservas = {r['id'] for r in resp.data}
#         self.assertIn(self.reserva_pasado.id, ids_reservas)
#         self.assertIn(self.reserva_actual.id, ids_reservas)
#         self.assertIn(self.reserva_pendiente.id, ids_reservas)

#     def test_solicitudes_anfitrion_other_user_forbidden(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('solicitudes-reserva-anfitrion/{usuario_id}/', usuario_id=self.anfitrion1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

#     # --- Tests para solicitudes_de_reserva_usuario ---

#     def test_solicitudes_usuario_unauthenticated(self):
#         url = self._get_url('solicitudes-reserva-usuario/{usuario_id}/', usuario_id=self.huesped1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_solicitudes_usuario_owner_success(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('solicitudes-reserva-usuario/{usuario_id}/', usuario_id=self.huesped1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         # Huesped1 hizo reserva_pasado y reserva_pendiente
#         self.assertEqual(len(resp.data), 2)
#         ids_reservas = {r['id'] for r in resp.data}
#         self.assertIn(self.reserva_pasado.id, ids_reservas)
#         self.assertIn(self.reserva_pendiente.id, ids_reservas)

#     def test_solicitudes_usuario_other_user_forbidden(self):
#         self.client.force_authenticate(user=self.huesped1_user)
#         url = self._get_url('solicitudes-reserva-usuario/{usuario_id}/', usuario_id=self.huesped2.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

#     # --- Tests para fechas_bloqueadas_por_propiedad ---

#     def test_fechas_bloqueadas_por_propiedad_success(self):
#         url = self._get_url('fechas-bloqueadas-por-propiedad/{propiedad_id}/', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         self.assertEqual(len(resp.data), 2) # fb1 y fb2
#         ids_fb = {f['id'] for f in resp.data}
#         self.assertIn(self.fb1.id, ids_fb)
#         self.assertIn(self.fb2.id, ids_fb)

#     def test_fechas_bloqueadas_por_propiedad_not_found(self):
#         url = self._get_url('fechas-bloqueadas-por-propiedad/{propiedad_id}/', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para ocupacion_tendencia_por_propiedad ---

#     def test_ocupacion_tendencia_unauthenticated(self):
#         url = self._get_url('ocupacion-tendencias/{propiedad_id}', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_ocupacion_tendencia_success(self):
#         self.client.force_authenticate(user=self.anfitrion1_user) # O cualquier usuario autenticado
#         url = self._get_url('ocupacion-tendencias/{propiedad_id}', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         # Debería haber 12 meses en la respuesta
#         self.assertEqual(len(resp.data), 12)
#         # Verificamos estructura del primer elemento
#         self.assertIn('mes', resp.data[0])
#         self.assertIn('ocupacion', resp.data[0])
#         self.assertIsInstance(resp.data[0]['ocupacion'], float)
      

#     def test_ocupacion_tendencia_propiedad_not_found(self):
#         self.client.force_authenticate(user=self.anfitrion1_user)
#         url = self._get_url('ocupacion-tendencias/{propiedad_id}', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     # --- Tests para precio_tendencia_por_propiedad ---

#     def test_precio_tendencia_unauthenticated(self):
#         url = self._get_url('precio-tendencias/{propiedad_id}', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertIn(resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

#     def test_precio_tendencia_success(self):
#         self.client.force_authenticate(user=self.anfitrion1_user)
#         url = self._get_url('precio-tendencias/{propiedad_id}', propiedad_id=self.prop1.id)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertIsInstance(resp.data, list)
#         # Debería haber 12 meses
#         self.assertEqual(len(resp.data), 12)
#          # Verificamos estructura del primer elemento
#         self.assertIn('mes', resp.data[0])
#         self.assertIn('precio', resp.data[0])
#         # El precio debería ser un número (float o string representando Decimal)
#         try: float(resp.data[0]['precio'])
#         except (ValueError, TypeError): self.fail("El precio no es numérico")

    
#     def test_precio_tendencia_propiedad_not_found(self):
#         self.client.force_authenticate(user=self.anfitrion1_user)
#         url = self._get_url('precio-tendencias/{propiedad_id}', propiedad_id=9999)
#         resp = self.client.get(url)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

# --- Mock de datos de propiedades ---
MOCK_PROPERTIES_DATA = [
    {'id': 1, 'tipo_de_propiedad': 'Apartamento', 'wifi': True, 'precio_por_noche': 100, 'ciudad': 'Madrid', 'numero_de_habitaciones': 2, 'tamano': 60, 'numero_de_banos': 1, 'numero_de_camas': 2, 'politica_de_cancelacion': 'Estricta', 'calefaccion': True, 'aire_acondicionado': True, 'parking': False, 'mascotas': False, 'permitido_fumar': False},
    {'id': 2, 'tipo_de_propiedad': 'Casa', 'wifi': True, 'precio_por_noche': 150, 'ciudad': 'Barcelona', 'numero_de_habitaciones': 3, 'tamano': 100, 'numero_de_banos': 2, 'numero_de_camas': 4, 'politica_de_cancelacion': 'Flexible', 'calefaccion': True, 'aire_acondicionado': False, 'parking': True, 'mascotas': True, 'permitido_fumar': False},
    {'id': 3, 'tipo_de_propiedad': 'Apartamento', 'wifi': False, 'precio_por_noche': 80, 'ciudad': 'Madrid', 'numero_de_habitaciones': 1, 'tamano': 40, 'numero_de_banos': 1, 'numero_de_camas': 1, 'politica_de_cancelacion': 'Moderada', 'calefaccion': True, 'aire_acondicionado': False, 'parking': False, 'mascotas': False, 'permitido_fumar': True},
]

# --- Clase de Test ---
class ContentRecommenderTest(unittest.TestCase):

    @patch('propiedad.recommendations.Propiedad.objects')
    @patch('propiedad.recommendations.StandardScaler')
    @patch('propiedad.recommendations.DictVectorizer')
    @patch('propiedad.recommendations.cosine_similarity')
    @patch('propiedad.recommendations.joblib_dump')
    @patch('propiedad.recommendations.joblib_load')
    @patch('propiedad.recommendations.os.path.exists')   
    def setUp(self, mock_exists, mock_joblib_load, mock_joblib_dump, mock_cosine_similarity, MockDictVectorizer, MockStandardScaler, MockPropiedadObjects):
        # --- Configurar Mocks Generales ---
        self.MockPropiedadObjects = MockPropiedadObjects
        self.MockStandardScaler = MockStandardScaler
        self.MockDictVectorizer = MockDictVectorizer
        self.mock_cosine_similarity = mock_cosine_similarity
        self.mock_joblib_dump = mock_joblib_dump
        self.mock_joblib_load = mock_joblib_load
        self.mock_exists = mock_exists

        # Mock para Propiedad.objects.all().values()
        self.MockPropiedadObjects.all().values.return_value = deepcopy(MOCK_PROPERTIES_DATA)

        # Mocks para Scalers (simular fit_transform devolviendo valores normalizados)
        self.mock_scaler_precio_instance = MagicMock()
        self.mock_scaler_hab_instance = MagicMock()

        scaler_call_count = 0
        def scaler_side_effect(*args, **kwargs):
            nonlocal scaler_call_count
            scaler_call_count += 1
            if scaler_call_count == 1:
                # La primera vez que se llame StandardScaler() devuelve el mock de precio
                return self.mock_scaler_precio_instance
            elif scaler_call_count == 2:
                # La segunda vez devuelve el mock de habitaciones
                return self.mock_scaler_hab_instance
            else:
                # Las veces siguientes (p.ej., en test_init_loads_existing_vectorizer)
                # devuelve un mock genérico para evitar StopIteration.
                print(f"WARN: Llamada inesperada #{scaler_call_count} a StandardScaler mockeado.") # Opcional: para depurar
                return MagicMock()

        # Asigna la función como side_effect
        self.MockStandardScaler.side_effect = scaler_side_effect


        # Simular que la normalización devuelve valores entre -1 y 1
        self.mock_scaler_precio_instance.fit_transform.return_value = np.array([[-0.5], [1.0], [-1.0]])
        self.mock_scaler_hab_instance.fit_transform.return_value = np.array([[0.0], [1.0], [-1.0]])

        # Mock para DictVectorizer
        self.mock_vectorizer_instance = MagicMock()
        self.mock_vectorizer_instance.fit_transform.return_value = np.array([
            [1, 0, 1, 0, -0.5, 0.0], # Prop 1 (Madrid)
            [0, 1, 1, 1, 1.0, 1.0],  # Prop 2 (Barcelona)
            [1, 0, 0, 0, -1.0, -1.0] # Prop 3 (Madrid)
        ])
        self.mock_vectorizer_instance.get_feature_names_out.return_value = [
            'ciudad=Madrid', 'ciudad=Barcelona', 'wifi=True', 'tipo=Casa', 'precio_norm', 'hab_norm' # Ejemplo
        ]
        self.mock_vectorizer_instance.feature_names_ = ['feature1', 'feature2'] # Para la comprobación de joblib
        self.MockDictVectorizer.return_value = self.mock_vectorizer_instance

        # Mock para cosine_similarity (matriz identidad para simplificar)
        self.mock_cosine_similarity.return_value = np.identity(len(MOCK_PROPERTIES_DATA))

        # Mock para joblib y os.path (simular que no existe fichero previo)
        self.mock_exists.return_value = False

        self.recommender = ContentRecommender()


    def test_init_and_load_data_correctly_mocks_used(self):
        """Verifica que __init__ y _load_data usan los mocks correctamente."""
        # 1. Verificar llamada a BD
        self.MockPropiedadObjects.all().values.assert_called_once()

        # 2. Verificar Scalers
        self.assertEqual(self.MockStandardScaler.call_count, 2)
        self.mock_scaler_precio_instance.fit_transform.assert_called_once()
        self.mock_scaler_hab_instance.fit_transform.assert_called_once()
        # Verificar que los datos pasados a fit_transform son correctos
        np.testing.assert_array_equal(self.mock_scaler_precio_instance.fit_transform.call_args[0][0], np.array([[100],[150],[80]]))
        np.testing.assert_array_equal(self.mock_scaler_hab_instance.fit_transform.call_args[0][0], np.array([[2],[3],[1]]))

        # 3. Verificar Vectorizer
        self.MockDictVectorizer.assert_called_once()
        self.mock_vectorizer_instance.fit_transform.assert_called_once()
        # Comprobar que los features pasados al vectorizer tienen precios/hab normalizados
        features_passed_to_vectorizer = self.mock_vectorizer_instance.fit_transform.call_args[0][0]
        self.assertEqual(features_passed_to_vectorizer[0]['precio_por_noche'], -0.5)
        self.assertEqual(features_passed_to_vectorizer[1]['precio_por_noche'], 1.0)
        self.assertEqual(features_passed_to_vectorizer[2]['precio_por_noche'], -1.0)
        self.assertEqual(features_passed_to_vectorizer[0]['numero_de_habitaciones'], 0.0)
        self.assertEqual(features_passed_to_vectorizer[1]['numero_de_habitaciones'], 1.0)
        self.assertEqual(features_passed_to_vectorizer[2]['numero_de_habitaciones'], -1.0)

       
        self.mock_cosine_similarity.assert_called_once()
        vectors_passed_to_cosine = self.mock_cosine_similarity.call_args[0][0]
       

        madrid_col_idx = 0
        barcelona_col_idx = 1

      
        self.assertAlmostEqual(
            vectors_passed_to_cosine[0, madrid_col_idx],
            5.0, # <--- VALOR HARDCODEADO
            msg=f"Peso Madrid (Prop 1) incorrecto. Se esperaba 5.0 (hardcoded)"
        )

        self.assertAlmostEqual(
            vectors_passed_to_cosine[1, barcelona_col_idx],
            5.0, # <--- VALOR HARDCODEADO
            msg=f"Peso Barcelona (Prop 2) incorrecto. Se esperaba 5.0 (hardcoded)"
        )

      
        self.assertAlmostEqual(
            vectors_passed_to_cosine[2, madrid_col_idx],
            5.0, # <--- VALOR HARDCODEADO
            msg=f"Peso Madrid (Prop 3) incorrecto. Se esperaba 5.0 (hardcoded)"
        )

        # 5. Verificar guardado de Vectorizer
        self.mock_joblib_dump.assert_called_once_with(self.mock_vectorizer_instance, 'content_vectorizer.joblib')

        # 6. Verificar estado interno (estas aserciones están bien)
        self.assertEqual(len(self.recommender.features), len(MOCK_PROPERTIES_DATA))
        self.assertIsNotNone(self.recommender.vectors)
        self.assertIsNotNone(self.recommender.similarity_matrix)
        self.assertIn('ciudad=Madrid', self.recommender.feature_index)

    @patch('propiedad.recommendations.os.path.exists')
    @patch('propiedad.recommendations.joblib_load')
    def test_init_loads_existing_vectorizer(self, mock_joblib_load, mock_exists):
        """Prueba que si existe un vectorizer guardado y compatible, se carga."""
        # Simular que existe y tiene los mismos features
        mock_exists.return_value = True
        mock_old_vectorizer = MagicMock()
        mock_old_vectorizer.feature_names_ = self.mock_vectorizer_instance.feature_names_ # Compatible
        mock_joblib_load.return_value = mock_old_vectorizer

        
        with patch('propiedad.recommendations.Propiedad.objects', self.MockPropiedadObjects), \
             patch('propiedad.recommendations.StandardScaler', self.MockStandardScaler), \
             patch('propiedad.recommendations.DictVectorizer', self.MockDictVectorizer) as MockDictVectorizerAgain, \
             patch('propiedad.recommendations.cosine_similarity', self.mock_cosine_similarity), \
             patch('propiedad.recommendations.joblib_dump', self.mock_joblib_dump):

            recommender_load = ContentRecommender()

            mock_joblib_load.assert_called_once_with('content_vectorizer.joblib')
            
            self.assertEqual(self.mock_vectorizer_instance.fit_transform.call_count, 2) 
            self.assertEqual(recommender_load.vectorizer,self.mock_vectorizer_instance)


    def test_record_click(self):
        """Prueba que record_click actualiza user_clicks correctamente."""
        user_id = 123
        prop_id_madrid = 1
        prop_id_barcelona = 2
        prop_id_no_existe = 999

        # Clic en Madrid
        self.recommender.record_click(user_id, prop_id_madrid)
        self.assertEqual(self.recommender.user_clicks[user_id]['Madrid'], 1)

        # Otro clic en Madrid
        self.recommender.record_click(user_id, prop_id_madrid)
        self.assertEqual(self.recommender.user_clicks[user_id]['Madrid'], 2)

        # Clic en Barcelona
        self.recommender.record_click(user_id, prop_id_barcelona)
        self.assertEqual(self.recommender.user_clicks[user_id]['Barcelona'], 1)
        self.assertEqual(self.recommender.user_clicks[user_id]['Madrid'], 2) # Madrid no cambia

        # Clic en propiedad inexistente (no debe fallar ni cambiar nada)
        initial_clicks = deepcopy(self.recommender.user_clicks)
        self.recommender.record_click(user_id, prop_id_no_existe)
        self.assertEqual(self.recommender.user_clicks, initial_clicks)

    def test_get_similar_property_not_found(self):
        """Prueba get_similar cuando el property_id no existe."""
        result = self.recommender.get_similar(999)
        self.assertEqual(result, [])

    @patch('propiedad.recommendations.cosine_similarity') # Mockear dentro del método
    def test_get_similar_basic(self, mock_cosine_similarity_method):
        """Prueba get_similar sin clics de usuario."""
        target_prop_id = 1
        # Mockear la matriz de similitud devuelta DENTRO de get_similar
        # Similitudes de la propiedad 1 con [1, 2, 3]
        mock_similarities = np.array([1.0, 0.8, 0.7])
        mock_cosine_similarity_method.return_value = np.array([mock_similarities]) # Debe ser 2D

        results = self.recommender.get_similar(target_prop_id, top=2)

        # Verificar llamada a cosine_similarity con el vector base
        mock_cosine_similarity_method.assert_called_once()
        np.testing.assert_array_equal(mock_cosine_similarity_method.call_args[0][0], [self.recommender.vectors[0]]) # Vector de prop 1
        np.testing.assert_array_equal(mock_cosine_similarity_method.call_args[0][1], self.recommender.vectors)    # Todos los vectores

        # Verificar resultados
        self.assertEqual(len(results), 2) # top=2
        # Esperamos prop 2 (sim 0.8) y prop 3 (sim 0.7)
        self.assertEqual(results[0][0], 2) # ID propiedad 2
        self.assertAlmostEqual(results[0][1], 0.8) # Similitud
        self.assertAlmostEqual(results[0][2], 80.0) # %

        self.assertEqual(results[1][0], 3) # ID propiedad 3
        self.assertAlmostEqual(results[1][1], 0.7) # Similitud
        self.assertAlmostEqual(results[1][2], 70.0) # %

    @patch('propiedad.recommendations.cosine_similarity')
    @patch('propiedad.recommendations.deepcopy') # Mockear deepcopy para verificar el vector modificado
    def test_get_similar_with_user_clicks(self, mock_deepcopy, mock_cosine_similarity_method):
        """Prueba que get_similar modifica el vector base según los clics."""
        user_id = 123
        target_prop_id = 2 # Propiedad en Barcelona
        madrid_prop_id = 1

        # Registrar clics para el usuario (más clics en Madrid)
        self.recommender.record_click(user_id, madrid_prop_id)
        self.recommender.record_click(user_id, madrid_prop_id) # 2 clics en Madrid

        
        original_base_vector = self.recommender.vectors[1] # Índice 1 para prop_id 2
        #
        copied_vector = np.copy(original_base_vector)
        # --- Configurar el mock ANTES de ejecutar ---
        mock_deepcopy.return_value = copied_vector

        # Mockear similitudes
        mock_similarities = np.array([0.6, 1.0, 0.9]) # Similitudes de prop 2 con [1, 2, 3]
        mock_cosine_similarity_method.return_value = np.array([mock_similarities])

        # --- Ejecutar ---
        # La función get_similar llama a deepcopy internamente
        results = self.recommender.get_similar(target_prop_id, top=2, user_id=user_id)

      
        self.assertEqual(mock_deepcopy.call_count, 1, "Se esperaba que deepcopy fuera llamado una vez")
        call_args, call_kwargs = mock_deepcopy.call_args
        # 3. Comparar el primer argumento posicional (el vector) usando numpy
        np.testing.assert_array_equal(call_args[0], original_base_vector,
                                       err_msg="deepcopy no fue llamado con el vector base original correcto.")


        # Verificar que el vector pasado a cosine_similarity fue modificado
        vector_passed_to_cosine = mock_cosine_similarity_method.call_args[0][0][0]
        madrid_col_idx = self.recommender.feature_index['ciudad=Madrid']
        expected_madrid_val = original_base_vector[madrid_col_idx] * (1 + 2 * 0.3) # 2 clics * peso 0.3
        self.assertAlmostEqual(vector_passed_to_cosine[madrid_col_idx], expected_madrid_val)
        # Otras columnas no deberían cambiar (asumiendo que la prop 2 no es de Madrid)
        self.assertAlmostEqual(vector_passed_to_cosine[1], original_base_vector[1]) # Columna Barcelona
        self.assertAlmostEqual(vector_passed_to_cosine[2], original_base_vector[2]) # Columna Wifi etc.

        # Verificar resultados (ordenados por la similitud mockeada)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0][0], 3) # ID prop 3, sim 0.9
        self.assertEqual(results[1][0], 1) # ID prop 1, sim 0.6

    @patch.object(ContentRecommender, '_load_data') # Mockear el método _load_data de la instancia
    def test_refresh_data(self, mock_load_data):
        """Prueba que refresh_data llama a _load_data."""
        self.recommender.refresh_data()
        mock_load_data.assert_called_once()