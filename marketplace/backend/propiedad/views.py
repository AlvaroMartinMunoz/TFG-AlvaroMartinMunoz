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
from datetime import timedelta
from datetime import datetime
from django.db import IntegrityError
from django.db.models import Avg


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

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad_id = request.data.get('propiedad')
        usuario_id = request.data.get('usuario')
        valoracion = request.data.get('valoracion')
        comentario = request.data.get('comentario', None)
        usuario = Usuario.objects.filter(id=usuario_id).first()

        if not propiedad_id or not valoracion or not usuario_id or not comentario:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            propiedad = Propiedad.objects.get(id=propiedad_id)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if valoracion < 1 or valoracion > 5:
            return Response({'error': 'Valoración debe ser un número entre 1 y 5'}, status=status.HTTP_400_BAD_REQUEST)
        
        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes valorar tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            ValoracionPropiedad.objects.create(propiedad=propiedad, usuario=usuario, valoracion=valoracion, comentario=comentario)
        except IntegrityError:
            return Response({'error': 'Ya has valorado esta propiedad'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'status': 'valoración creada'}, status=status.HTTP_201_CREATED)
    
    
    def update(self, request, *args, **kwargs):
        valoracion = self.get_object()
        user = request.user.id
        usuarioId = Usuario.objects.filter(usuario=user).first().id
        propiedad = valoracion.propiedad

        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes editar valoraciones de tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)
        if valoracion.usuario.id != usuarioId:
            return Response({'error': 'No tienes permiso para editar esta valoración'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def media_valoraciones(self, request, pk=None):
        try:
            propiedad = Propiedad.objects.get(id=pk)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        media = ValoracionPropiedad.objects.filter(propiedad=propiedad).aggregate(Avg('valoracion'))['valoracion__avg']
        reseñas = ValoracionPropiedad.objects.filter(propiedad=propiedad).count()
        if media is None:
            return Response({'mensaje': 'Esta propiedad no tiene valoraciones todavía'}, status=status.HTTP_200_OK)
        return Response({'media': media, 'reseñas':reseñas}, status=status.HTTP_200_OK)

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
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'No puedes actualizar fechas bloqueadas'}, status=status.HTTP_403_FORBIDDEN)
    
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

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        propiedad = request.data.get('propiedad')
        fecha_inicio_str = request.data.get('fecha_llegada')
        fecha_fin_str = request.data.get('fecha_salida')
        cantidad_personas = request.data.get('numero_personas')

        if not propiedad or not fecha_inicio_str or not fecha_fin_str or not cantidad_personas:
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido (debe ser YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cantidad_personas = int(cantidad_personas)
            if cantidad_personas <= 0:
                return Response({'error': 'La cantidad de personas debe ser mayor a 0'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Número de personas inválido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            propiedad = Propiedad.objects.get(id=propiedad)
        except Propiedad.DoesNotExist:
            return Response({'error': 'Propiedad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if propiedad.anfitrion.usuario_id == request.user.id:
            return Response({'error': 'No puedes reservar tu propia propiedad'}, status=status.HTTP_403_FORBIDDEN)

        if fecha_inicio >= fecha_fin:
            return Response({'error': 'Fecha de llegada debe ser anterior a fecha de salida'}, status=status.HTTP_400_BAD_REQUEST)

        if fecha_inicio < datetime.now().date():
            return Response({'error': 'Fecha de llegada debe ser posterior a la fecha actual'}, status=status.HTTP_400_BAD_REQUEST)

        fechas_bloqueadas = FechaBloqueada.objects.filter(propiedad=propiedad, fecha__range=[fecha_inicio, fecha_fin])
        if fechas_bloqueadas.exists():
            return Response({'error': 'Fechas bloqueadas'}, status=status.HTTP_400_BAD_REQUEST)

        reservas_existentes = Reserva.objects.filter(
            propiedad=propiedad, 
            fecha_llegada__lt=fecha_fin,  
            fecha_salida__gt=fecha_inicio  
        )
        if reservas_existentes.exists():
            return Response({'error': 'Propiedad ocupada en esas fechas'}, status=status.HTTP_400_BAD_REQUEST)

        if cantidad_personas > propiedad.maximo_huespedes:
            return Response({'error': 'Cantidad de personas excede el límite'}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        reserva = Reserva.objects.get(id=kwargs['pk'])
        propiedad = reserva.propiedad
        estado = request.data.get('estado')
        usuario = Usuario.objects.filter(usuario=request.user).first()
        usuarioId = usuario.id
       

        if not estado:
            return Response({'error': 'Estado es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        if estado not in ['Aceptada', 'Cancelada']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        
        if propiedad.anfitrion.usuario_id == request.user.id:
            reserva.estado = estado
            reserva.fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1)

        elif reserva.usuario.id == usuarioId and estado == 'Cancelada':
            reserva.estado = estado
            reserva.fecha_aceptacion_rechazo = datetime.now() - timedelta(hours=1)
        else:
            return Response({'error': 'No tienes permiso para cambiar el estado de esta reserva'}, status=status.HTTP_403_FORBIDDEN)
        
        reserva.save()
        return Response({'status': 'estado actualizado'}, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        return Response({'error': 'No puedes eliminar reservas'}, status=status.HTTP_403_FORBIDDEN)
    
    