from datetime import date
from background_task import background
from django.utils.timezone import now
from propiedad.models.reserva import Reserva
@background(schedule=60)  
def cancelar_reservas_pendientes():
    """Cancela reservas con estado 'pendiente' y fecha de inicio igual a hoy."""
    hoy = date.today()
    reservas_pendientes = Reserva.objects.filter(estado='Pendiente', fecha_llegada=hoy)

    for reserva in reservas_pendientes:
        reserva.estado = 'Cancelada'
        reserva.save()

    print(f"✅ {reservas_pendientes.count()} reservas canceladas automáticamente.")
