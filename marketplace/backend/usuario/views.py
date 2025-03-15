from rest_framework import viewsets
from .models.usuario import Usuario
from .serializers import UsuarioSerializer, UserSerializer
from .models.valoracionUsuario import ValoracionUsuario
from .serializers import ValoracionUsuarioSerializer
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated, AllowAny

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def update(self, request, *args, **kwargs):
        usuario = self.get_object()
        usuarioId = usuario.usuario.id
        userId = request.user.id 

        if usuarioId != userId:
            return Response({'error': 'No tienes permiso para editar este usuario'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):    
        usuario = self.get_object()
        usuarioId = usuario.usuario.id
        userId = request.user.id 
        if usuarioId != userId:
            return Response({'error': 'No tienes permiso para eliminar este usuario'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class ValoracionUsuarioViewSet(viewsets.ModelViewSet):
    queryset = ValoracionUsuario.objects.all()
    serializer_class = ValoracionUsuarioSerializer

class UsuarioPerfilAPIView(APIView):
    def get(self, request, id_usuario=None):
        try:
            usuario = Usuario.objects.get(id=id_usuario)
        except Usuario.DoesNotExist:
            raise NotFound(detail="Usuario no encontrado")
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)