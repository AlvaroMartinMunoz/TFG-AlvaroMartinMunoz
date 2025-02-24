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

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

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