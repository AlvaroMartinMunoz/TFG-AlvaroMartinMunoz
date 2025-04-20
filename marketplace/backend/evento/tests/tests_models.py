from django.test import TestCase
from evento.models import Evento
class EventoModelTest(TestCase):

    def test_evento_str(self):
        evento = Evento.objects.create(
            nombre="Charla IA",
            fecha="2025-05-15",
            lugar="Auditorio Central",
            imagen="https://example.com/img.jpg",
            categoria="Tecnología",
            descripcion_principal="Una charla muy interesante",
            descripcion_secundaria="Detalles y agenda del evento"
        )
        self.assertEqual(str(evento), "Charla IA")

    def test_unique_together(self):
        evento1 = Evento.objects.create(
            nombre="Charla IA",
            fecha="2025-05-15",
            lugar="Auditorio Central",
            imagen="https://example.com/img1.jpg",
            categoria="Tecnología",
            descripcion_principal="Una charla interesante",
            descripcion_secundaria="Detalles"
        )

        with self.assertRaises(Exception):
            Evento.objects.create(
                nombre="Charla IA",
                fecha="2025-05-15",
                lugar="Auditorio Central",
                imagen="https://example.com/img2.jpg",
                categoria="Tecnología",
                descripcion_principal="Otra charla",
                descripcion_secundaria="Detalles"
            )
