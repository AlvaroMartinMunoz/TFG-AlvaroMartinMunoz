from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.core import mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

from ..models.usuario import Usuario


class TestUsuarioViewSet(APITestCase):
    def setUp(self):
        # Crear usuarios y perfil de prueba
        self.user = User.objects.create_user(username='testuser', password='password')
        self.other = User.objects.create_user(username='otheruser', password='password')
        self.usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='600123456',
            direccion='Calle 1',
            biografia='Bio prueba',
            fecha_de_nacimiento='2000-01-01'
        )
        # Autenticar vía JWT
        token_url = reverse('token_obtain_pair')
        resp = self.client.post(token_url, {'username': 'testuser', 'password': 'password'}, format='json')
        access = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def authenticate(self, username, password):
        # Cambia credenciales JWT
        token_url = reverse('token_obtain_pair')
        resp = self.client.post(token_url, {'username': username, 'password': password}, format='json')
        access = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_list_usuarios(self):
        url = reverse('usuario-list')
        # List está permitido sin auth
        self.client.credentials()  # quitar header
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_usuario(self):
        url = reverse('usuario-detail', kwargs={'pk': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['dni'], '12345678A')

    def test_create_usuario(self):
        url = reverse('usuario-list')
        data = {
            'username': 'nuevo',
            'email': 'nuevo@example.com',
            'password': 'Newpass123!',
            'dni': '87654321B',
            'telefono': '600654321',
            'direccion': 'Calle 2',
            'biografia': 'Perfil nuevo',
            'fecha_de_nacimiento': '1990-05-05'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='nuevo').exists())

    def test_create_usuario_existente(self):
        url = reverse('usuario-list')
        data = {
            'usuario': self.user.id,
            'dni': '12345678A',
            'telefono': '600000000',
            'direccion': 'Calle 3',
            'biografia': 'Duplicado',
            'fecha_de_nacimiento': '1990-05-05'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_update_usuario_self(self):
        url = reverse('usuario-detail', kwargs={'pk': self.usuario.id})
        data = {'direccion': 'Calle Actualizada'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['direccion'], 'Calle Actualizada')

    def test_update_usuario_forbidden(self):
        url = reverse('usuario-detail', kwargs={'pk': self.usuario.id})
        self.authenticate('otheruser', 'password')
        response = self.client.patch(url, {'biografia': 'Intento editar ajeno'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)

    def test_delete_usuario_self(self):
        url = reverse('usuario-detail', kwargs={'pk': self.usuario.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Usuario.objects.filter(pk=self.usuario.id).exists())

    def test_delete_usuario_forbidden(self):
        url = reverse('usuario-detail', kwargs={'pk': self.usuario.id})
        self.authenticate('otheruser', 'password')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)

    def test_create_usuario_unauthenticated(self):
        self.client.credentials()  # quitar token
        url = reverse('usuario-list')
        data = {
            'usuario': self.user.id,
            'dni': '33333333C',
            'telefono': '600333333',
            'direccion': 'Calle 4',
            'biografia': 'Sin login',
            'fecha_de_nacimiento': '1990-05-05'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)



class TestPasswordResetViews(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reset', email='reset@example.com', password='pass')
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

    def test_password_reset_request(self):
        url = reverse('password-reset')
        # Sin email
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Email no existente
        response = self.client.post(url, {'email': 'noex@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Email válido
        response = self.client.post(url, {'email': 'reset@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

    def test_password_reset_confirm(self):
        base_url = reverse('password-reset-confirm', kwargs={'uidb64': self.uid, 'token': self.token})
        # Enlace inválido
        response = self.client.post(reverse('password-reset-confirm', kwargs={'uidb64': 'bad', 'token': 'bad'}),
                                    {'new_password': 'ComplexPwd123!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Sin new_password
        response = self.client.post(base_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Contraseña inválida
        response = self.client.post(base_url, {'new_password': '123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Reset exitoso
        response = self.client.post(base_url, {'new_password': 'ComplexPwd123!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('ComplexPwd123!'))
