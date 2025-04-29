from django.test import TestCase
from django.contrib.auth.models import User
from usuario.models.usuario import Usuario # Ajusta la ruta si es necesario
from usuario.serializers import ( # Ajusta la ruta si es necesario
    UserSerializer,
    UsuarioSerializer,
    PasswordResetSerializer
)
from rest_framework.exceptions import ValidationError
from datetime import date
from decimal import Decimal # Por si acaso algún campo lo necesita indirectamente

# Necesitamos crear datos base
class SerializerBaseTestCase(TestCase):
    """Clase base con datos comunes para tests de serializers de usuario."""
    @classmethod
    def setUpTestData(cls):
        cls.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
        cls.user = User.objects.create_user(**cls.user_data)

        cls.usuario_profile_data = {
            'dni': '12345678Z',
            'telefono': '600123456',
            'direccion': 'Calle Test 123',
            'fecha_de_nacimiento': date(1995, 5, 15)
            # 'biografia' es opcional
        }
        cls.usuario = Usuario.objects.create(usuario=cls.user, **cls.usuario_profile_data)


# --- Tests para UserSerializer ---

class UserSerializerTests(SerializerBaseTestCase):

    def test_user_serialization(self):
        """Verifica que UserSerializer serializa los campos correctos."""
        serializer = UserSerializer(instance=self.user)
        expected_data = {
            'id': self.user.id,
            'username': self.user_data['username'],
            'email': self.user_data['email'],
        }
        self.assertEqual(serializer.data, expected_data)

# --- Tests para UsuarioSerializer ---

class UsuarioSerializerTests(SerializerBaseTestCase):

    def test_usuario_serialization(self):
        """Verifica que UsuarioSerializer serializa campos propios y anida User."""
        serializer = UsuarioSerializer(instance=self.usuario)
        data = serializer.data

        # Verifica campos del perfil Usuario
        self.assertEqual(data['id'], self.usuario.id)
        self.assertEqual(data['dni'], self.usuario_profile_data['dni'])
        self.assertEqual(data['telefono'], self.usuario_profile_data['telefono'])
        self.assertEqual(data['direccion'], self.usuario_profile_data['direccion'])
        self.assertEqual(data['fecha_de_nacimiento'], str(self.usuario_profile_data['fecha_de_nacimiento']))
        self.assertIsNone(data['biografia']) # Era opcional y no se puso en setUp

        # Verifica el campo 'usuario' anidado (viene de UserSerializer)
        self.assertIn('usuario', data)
        self.assertIsInstance(data['usuario'], dict)
        self.assertEqual(data['usuario']['id'], self.user.id)
        self.assertEqual(data['usuario']['username'], self.user_data['username'])
        self.assertEqual(data['usuario']['email'], self.user_data['email'])

        # Verifica que campos write_only NO están en la salida
        self.assertNotIn('username', data)
        self.assertNotIn('email', data)
        self.assertNotIn('password', data)

    def test_usuario_create_success(self):
        """Verifica la creación exitosa de User, Usuario y la devolución de tokens."""
        create_data = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@example.com',
            'password': 'new_password123',
            'dni': '87654321B',
            'telefono': '600654321',
            'direccion': 'Calle Nueva 1',
            'fecha_de_nacimiento': '1992-10-20',
            'biografia': 'Soy nuevo'
        }
        serializer = UsuarioSerializer(data=create_data)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        # save() llama al método create() personalizado
        response_data = serializer.save()

        # Verificar la estructura de la respuesta devuelta por create()
        self.assertIsInstance(response_data, dict)
        self.assertIn('id', response_data) # ID del perfil Usuario
        self.assertIn('dni', response_data)
        self.assertIn('usuario', response_data) # Datos del User anidados
        self.assertIn('access_token', response_data)
        self.assertIn('refresh_token', response_data)
        self.assertEqual(response_data['dni'], create_data['dni'])
        self.assertEqual(response_data['usuario']['username'], create_data['username'])
        self.assertEqual(response_data['usuario']['email'], create_data['email'])

        # Verificar creación en base de datos
        self.assertTrue(User.objects.filter(username=create_data['username']).exists())
        new_user = User.objects.get(username=create_data['username'])
        self.assertTrue(Usuario.objects.filter(usuario=new_user, dni=create_data['dni']).exists())

    def test_usuario_create_missing_fields(self):
        """Verifica errores si faltan campos requeridos."""
        invalid_data = { # Falta username, email, password, dni, telefono, direccion, fecha_nacimiento
        }
        serializer = UsuarioSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
        self.assertIn('email', serializer.errors)
        # Password no es estrictamente requerido en el serializer, pero sí por create_user
        # self.assertIn('password', serializer.errors)
        self.assertIn('dni', serializer.errors)
        self.assertIn('telefono', serializer.errors)
        self.assertIn('direccion', serializer.errors)
        self.assertIn('fecha_de_nacimiento', serializer.errors)

    def test_usuario_create_password_too_short(self):
        """Verifica error si la contraseña es muy corta."""
        invalid_data = {
            'username': 'corto_pass', 'email': 'corto@example.com', 'password': '123', # < 8
            'dni': '11122233C', 'telefono': '611222333', 'direccion': 'Dir Corta', 'fecha_de_nacimiento': '1999-01-01'
        }
        serializer = UsuarioSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
        self.assertEqual(serializer.errors['password'][0].code, 'min_length')

    # def test_usuario_create_duplicate_username(self):
    #     """Verifica error si el username ya existe."""
    #     invalid_data = {
    #         'username': self.user_data['username'], # Username existente
    #         'email': 'unico@example.com', 'password': 'password123',
    #         'dni': '22233344D', 'telefono': '622333444', 'direccion': 'Dir Dup', 'fecha_de_nacimiento': '1998-01-01'
    #     }
    #     serializer = UsuarioSerializer(data=invalid_data)
    #     # La validación puede ocurrir en is_valid o al llamar a save/create
    #     # Probamos is_valid primero, pero podría pasar y fallar en save
    #     # DRF ModelSerializer debería validar unicidad de User si username/email son unique
    #     self.assertFalse(serializer.is_valid())
    #     # Esperaríamos un error en 'username' o 'non_field_errors'
    #     self.assertTrue('username' in serializer.errors or 'non_field_errors' in serializer.errors)


    # Añadir tests similares para email duplicado, dni duplicado, telefono duplicado (si son unique en Usuario)


# --- Tests para PasswordResetSerializer ---

class PasswordResetSerializerTests(SerializerBaseTestCase):

    def test_password_reset_valid_email(self):
        """Verifica que un email existente y válido pasa la validación."""
        data = {'email': self.user_data['email']} # Email creado en setUpTestData
        serializer = PasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_reset_invalid_format_email(self):
        """Verifica que un email con formato inválido falla."""
        data = {'email': 'esto-no-es-un-email'}
        serializer = PasswordResetSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        # El error viene de la validación del campo EmailField de DRF
        self.assertTrue('Enter a valid email address.' in serializer.errors['email'][0])

    def test_password_reset_non_existent_email(self):
        """Verifica que un email válido pero no existente falla."""
        data = {'email': 'noexiste@example.com'}
        serializer = PasswordResetSerializer(data=data)
        # Comprobamos que falla la validación (esto ahora debería pasar)
        self.assertFalse(serializer.is_valid())
        # Comprobamos que el error está en el campo 'email'
        self.assertIn('email', serializer.errors)
        # Buscamos el mensaje específico que definimos en validate_email
        expected_error_msg = "No existe un usuario activo con esa dirección de correo."
        # Comprobamos si el mensaje está presente en la lista de errores para 'email'
        self.assertTrue(any(expected_error_msg in str(e) for e in serializer.errors['email']),
                        f"El mensaje de error esperado no se encontró. Errores: {serializer.errors}")
