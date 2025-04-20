from django.test import TestCase
from evento.models import Evento
from evento.serializers import EventoSerializer
from datetime import datetime

class EventoSerializerTestCase(TestCase):

    def setUp(self):
        self.evento_data = {
            'nombre': 'Concierto de Rock',
            'fecha': '2025-05-10',
            'lugar': 'Madison Square Garden',
            'imagen': 'https://example.com/image.jpg',
            'categoria': 'Música',
            'descripcion_principal': 'Gran concierto con bandas de renombre.',
            'descripcion_secundaria': 'Evento único en la ciudad.',
        }
        self.evento = Evento.objects.create(**self.evento_data)

    def test_evento_serializer_valid(self):
        serializer = EventoSerializer(self.evento)
        
        self.assertEqual(serializer.data['nombre'], self.evento.nombre)
        self.assertEqual(serializer.data['fecha'], self.evento.fecha)
        self.assertEqual(serializer.data['lugar'], self.evento.lugar)
        self.assertEqual(serializer.data['imagen'], self.evento.imagen)
        self.assertEqual(serializer.data['categoria'], self.evento.categoria)
        self.assertEqual(serializer.data['descripcion_principal'], self.evento.descripcion_principal)
        self.assertEqual(serializer.data['descripcion_secundaria'], self.evento.descripcion_secundaria)
    
    def test_evento_serializer_invalid(self):
        invalid_data = {
            'nombre': '',  
            'fecha': '2025-05-10',
            'lugar': 'Madison Square Garden',
            'imagen': 'https://example.com/image.jpg',
            'categoria': 'Música',
            'descripcion_principal': 'Gran concierto con bandas de renombre.',
            'descripcion_secundaria': 'Evento único en la ciudad.',
        }
        
        serializer = EventoSerializer(data=invalid_data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('nombre', serializer.errors) 
        self.assertEqual(serializer.errors['nombre'][0], 'This field may not be blank.')

    def test_evento_serializer_create(self):
        unique_suffix = datetime.now().strftime('%Y%m%d%H%M%S')
        evento_data_2 = {
            'nombre': f'Concierto de Jazz {unique_suffix}',  
            'fecha': '2025-06-15',
            'lugar': f'Auditorio Nacional {unique_suffix}', 
            'imagen': 'https://example.com/jazz_image.jpg',
            'categoria': 'Jazz',
            'descripcion_principal': 'Concierto íntimo con artistas internacionales.',
            'descripcion_secundaria': 'Un evento exclusivo para los amantes del jazz.',
        }
        
        serializer = EventoSerializer(data=evento_data_2)

        if not serializer.is_valid():
            print(serializer.errors)
        
        self.assertTrue(serializer.is_valid())  
        
        evento_created = serializer.save()  
        
        self.assertEqual(evento_created.nombre, evento_data_2['nombre'])
        self.assertEqual(evento_created.fecha, evento_data_2['fecha'])
        self.assertEqual(evento_created.lugar, evento_data_2['lugar'])
        self.assertEqual(evento_created.imagen, evento_data_2['imagen'])
        self.assertEqual(evento_created.categoria, evento_data_2['categoria'])
        self.assertEqual(evento_created.descripcion_principal, evento_data_2['descripcion_principal'])
        self.assertEqual(evento_created.descripcion_secundaria, evento_data_2['descripcion_secundaria'])
