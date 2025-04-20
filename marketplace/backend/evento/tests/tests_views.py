from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from evento.models import Evento

class EventoViewSetTest(APITestCase):

    def setUp(self):
        self.evento = Evento.objects.create(
            nombre="Charla IA",
            fecha="2025-05-15",
            lugar="Auditorio Central",
            imagen="https://example.com/img.jpg",
            categoria="Tecnología",
            descripcion_principal="Una charla muy interesante",
            descripcion_secundaria="Detalles y agenda del evento"
        )
        self.list_url = reverse('evento-list') 
        self.detail_url = reverse('evento-detail', kwargs={'pk': self.evento.pk})  

    def test_list_eventos(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  

    def test_retrieve_evento(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK) 
        self.assertEqual(response.data['nombre'], self.evento.nombre)  

    def test_create_evento_not_allowed(self):
        data = {
            "nombre": "Nuevo Evento",
            "fecha": "2025-06-20",
            "lugar": "Centro Cultural",
            "imagen": "https://example.com/new.jpg",
            "categoria": "Arte",
            "descripcion_principal": "Una exposición imperdible",
            "descripcion_secundaria": "Con artistas internacionales"
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  

    def test_update_evento_not_allowed(self):
        data = {
            "nombre": "Charla IA Editada",
            "fecha": "2025-05-15",
            "lugar": "Auditorio Central",
            "imagen": "https://example.com/img.jpg",
            "categoria": "Tecnología",
            "descripcion_principal": "Una charla muy interesante",
            "descripcion_secundaria": "Detalles y agenda del evento"
        }
        response = self.client.put(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  

    def test_partial_update_evento_not_allowed(self):
        response = self.client.patch(self.detail_url, {"nombre": "Nuevo nombre"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  

    def test_destroy_evento_not_allowed(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  
