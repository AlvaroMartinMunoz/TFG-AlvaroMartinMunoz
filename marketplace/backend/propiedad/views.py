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
from rest_framework.permissions import IsAuthenticated, AllowAny
from usuario.models.usuario import Usuario
from django.contrib.auth.models import User
from propiedad.tasks import cancelar_reservas_pendientes
from datetime import timedelta

cancelar_reservas_pendientes(repeat=86400)

class PropiedadViewSet(viewsets.ModelViewSet):
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def update(self, request, *args, **kwargs):
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 

        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 

        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):    
        propiedad = self.get_object()
        anfitrionId = propiedad.anfitrion.usuario_id
        usuarioId = request.user.id 
        if anfitrionId != usuarioId:
            return Response({'error': 'No tienes permiso para eliminar esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ValoracionPropiedadViewSet(viewsets.ModelViewSet):
    queryset = ValoracionPropiedad.objects.all()
    serializer_class = ValoracionPropiedadSerializer

class FotoPropiedadViewSet(viewsets.ModelViewSet):
    queryset = FotoPropiedad.objects.all()
    serializer_class = FotoPropiedadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedadId')
        print(f"propiedad_id recibido: {propiedad_id}")
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para subir fotos a esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        foto = request.data.get('foto')
        es_portada = request.data.get('es_portada', False)
        FotoPropiedad.objects.create(propiedad=propiedad, foto=foto, es_portada=es_portada)
        return Response({'status': 'foto subida'}, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        foto = self.get_object()
        propiedad = foto.propiedad
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para eliminar esta foto'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

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

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get("propiedad")
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
            print(f"propiedad1: {propiedad}")
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        anfitrion = propiedad.anfitrion.usuario_id
        print(anfitrion)
        print(request.user.id)
        if anfitrion != request.user.id:
            return Response({'error': 'No tienes permiso para bloquear fechas en esta propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        fecha = request.data.get("fecha")
        FechaBloqueada.objects.create(propiedad=propiedad, fecha=fecha)
        return Response({'status': 'fechas bloqueadas'}, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        fecha = self.get_object()
        print(fecha)
        propiedad = fecha.propiedad
        print(propiedad)
        print(propiedad.anfitrion.usuario_id)
        print(request.user)
        if propiedad.anfitrion.usuario_id != request.user.id:
            return Response({'error': 'No tienes permiso para desbloquear esta fecha'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    