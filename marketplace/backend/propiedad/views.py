from rest_framework import viewsets
from .models.propiedad import Propiedad
from .serializers import ReservaSerializer
from .models.fotoPropiedad import FotoPropiedad
from .serializers import FotoPropiedadSerializer
from .serializers import PropiedadSerializer
from .models.valoracionPropiedad import ValoracionPropiedad
from .serializers import ValoracionPropiedadSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models.propiedad import FechaBloqueada
from .serializers import FechaBloqueadaSerializer
from .models.reserva import Reserva

class PropiedadViewSet(viewsets.ModelViewSet):
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer

class ValoracionPropiedadViewSet(viewsets.ModelViewSet):
    queryset = ValoracionPropiedad.objects.all()
    serializer_class = ValoracionPropiedadSerializer

class FotoPropiedadViewSet(viewsets.ModelViewSet):
    queryset = FotoPropiedad.objects.all()
    serializer_class = FotoPropiedadSerializer

    @action(detail=False, methods=['post'])
    def upload_photos(self, request):
        propiedad_id = request.data.get('propiedadId')
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        es_portada_list = request.data.getlist('es_portada')
        print(f"es_portada_list recibido: {es_portada_list}")


        for index, file in enumerate(request.FILES.getlist('fotos')):
            
            es_portada = es_portada_list[index].lower() == 'true' if index < len(es_portada_list) else False

            FotoPropiedad.objects.create(propiedad=propiedad, foto=file, es_portada=es_portada)
        return Response({'status': 'fotos subidas'}, status=status.HTTP_201_CREATED)
    
class FechaBloqueadaViewSet(viewsets.ModelViewSet):
    queryset = FechaBloqueada.objects.all()
    serializer_class = FechaBloqueadaSerializer

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    