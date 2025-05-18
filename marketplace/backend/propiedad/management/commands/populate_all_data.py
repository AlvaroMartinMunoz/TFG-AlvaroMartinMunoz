from django.core.management.base import BaseCommand
from propiedad.scritps import populateUsers, populateProperties, populateSpecialPrices, populateReservations, populatePastReservations, populateRatings, populateFavorites


class Command(BaseCommand):
    help = 'Puebla la base de datos con todos los datos iniciales necesarios.'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando la población de datos...')

        try:

            self.stdout.write('  Poblando usuarios...')
            populateUsers.poblar_usuarios() 
            self.stdout.write(self.style.SUCCESS('  Usuarios poblados.'))

            self.stdout.write('  Poblando propiedades...')
            populateProperties.poblar_propiedades()
            self.stdout.write(self.style.SUCCESS('  Propiedades pobladas.'))
            
            self.stdout.write('  Poblando precios especiales...')
            populateSpecialPrices.poblar_precios_especiales()
            self.stdout.write(self.style.SUCCESS('  Precios especiales poblados.'))

            self.stdout.write('  Poblando reservaciones...')
            populateReservations.poblar_reservas()
            self.stdout.write(self.style.SUCCESS('  Reservaciones pobladas.'))

            self.stdout.write('  Poblando reservaciones pasadas...')
            populatePastReservations.poblar_reservas()
            self.stdout.write(self.style.SUCCESS('  Reservaciones pasadas pobladas.'))

            self.stdout.write('  Poblando valoraciones (ratings)...')
            populateRatings.poblar_valoraciones()
            self.stdout.write(self.style.SUCCESS('  Valoraciones pobladas.'))

            self.stdout.write('  Poblando favoritos...')
            populateFavorites.poblar_favoritos()
            self.stdout.write(self.style.SUCCESS('  Favoritos poblados.'))

            self.stdout.write(self.style.SUCCESS('¡Población completa de datos finalizada exitosamente!'))

        except Exception as e:
            import traceback
            self.stderr.write(self.style.ERROR(f'Error durante la población de datos: {e}'))
            self.stderr.write(traceback.format_exc())
           