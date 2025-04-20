from django.test import TestCase
from django.contrib.auth.models import User
from datetime import date, timedelta
from ..models.usuario import Usuario
from django.core.exceptions import ValidationError

class UsuarioModelTest(TestCase):

    def setUp(self):
        # Crear un usuario de prueba
        self.user = User.objects.create_user(username='testuser', password='password')

    def test_create_usuario(self):
        # Crear un objeto Usuario válido
        usuario = Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1)  
        )

        # Verificar que el objeto se ha creado correctamente
        self.assertEqual(usuario.usuario.username, 'testuser')
        self.assertEqual(usuario.dni, '12345678A')
        self.assertEqual(usuario.telefono, '612345678')
        self.assertEqual(usuario.direccion, 'Calle Falsa 123')
        self.assertEqual(usuario.biografia, 'Soy un usuario de prueba.')
        self.assertEqual(usuario.fecha_de_nacimiento, date(2000, 1, 1)) 

    def test_dni_unique(self):
        # Crear un primer usuario
        Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1) 
        )

        # Verificar que el DNI debe ser único
        with self.assertRaises(ValidationError):
            usuario2 = Usuario(
                usuario=self.user,
                dni='12345678A',
                telefono='612345679',
                direccion='Calle Falsa 124',
                biografia='Otro usuario de prueba.',
                fecha_de_nacimiento=date(2000, 2, 1) 
            )
            usuario2.full_clean()  # Forzamos la validación

    def test_telefono_unique(self):
        # Crear un primer usuario
        Usuario.objects.create(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1)  
        )

        # Verificar que el teléfono debe ser único
        with self.assertRaises(ValidationError):
            usuario2 = Usuario(
                usuario=self.user,
                dni='87654321B',
                telefono='612345678',  # El mismo teléfono
                direccion='Calle Falsa 124',
                biografia='Otro usuario de prueba.',
                fecha_de_nacimiento=date(2000, 2, 1)  
            )
            usuario2.full_clean()  # Forzamos la validación

    def test_fecha_nacimiento_valida(self):
        # Fecha de nacimiento menor de 18 años
        with self.assertRaises(ValidationError):
            usuario = Usuario(
                usuario=self.user,
                dni='12345678A',
                telefono='612345678',
                direccion='Calle Falsa 123',
                biografia='Soy un usuario de prueba.',
                fecha_de_nacimiento=date.today() - timedelta(days=365*16)  # Menos de 18 años
            )
            usuario.full_clean()  # Forzamos la validación

        # Fecha de nacimiento mayor de 18 años
        usuario = Usuario(
            usuario=self.user,
            dni='12345678B',
            telefono='612345679',
            direccion='Calle Falsa 124',
            biografia='Soy un usuario adulto.',
            fecha_de_nacimiento=date.today() - timedelta(days=365*20)  # Mayor de 18 años
        )
        usuario.full_clean()  # No debería levantar ninguna excepción

    def test_dni_format(self):
        # Formato incorrecto del DNI
        with self.assertRaises(ValidationError):
            usuario = Usuario(
                usuario=self.user,
                dni='12345A678',  # Formato incorrecto
                telefono='612345678',
                direccion='Calle Falsa 123',
                biografia='Soy un usuario de prueba.',
                fecha_de_nacimiento=date(2000, 1, 1)  
            )
            usuario.full_clean()  # Forzamos la validación

        # Formato correcto del DNI
        usuario = Usuario(
            usuario=self.user,
            dni='12345678A',  # Formato correcto
            telefono='612345678',
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1) 
        )
        usuario.full_clean()  # No debería levantar ninguna excepción

    def test_telefono_format(self):
        # Teléfono con formato incorrecto
        with self.assertRaises(ValidationError):
            usuario = Usuario(
                usuario=self.user,
                dni='12345678A',
                telefono='61234',  # Formato incorrecto
                direccion='Calle Falsa 123',
                biografia='Soy un usuario de prueba.',
                fecha_de_nacimiento=date(2000, 1, 1) 
            )
            usuario.full_clean()  # Forzamos la validación

        # Teléfono con formato correcto
        usuario = Usuario(
            usuario=self.user,
            dni='12345678A',
            telefono='612345678',  # Formato correcto
            direccion='Calle Falsa 123',
            biografia='Soy un usuario de prueba.',
            fecha_de_nacimiento=date(2000, 1, 1)  
        )
        usuario.full_clean()  # No debería levantar ninguna excepción
