from rest_framework import viewsets
from .models.propiedad import Propiedad
from .models.fotoPropiedad import FotoPropiedad
from .serializers import FotoPropiedadSerializer
from .serializers import PropiedadSerializer
from .models.valoracionPropiedad import ValoracionPropiedad
from .serializers import ValoracionPropiedadSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

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

        for file in request.FILES.getlist('fotos'):
            FotoPropiedad.objects.create(propiedad=propiedad, foto=file)
        return Response({'status': 'fotos subidas'}, status=status.HTTP_201_CREATED)