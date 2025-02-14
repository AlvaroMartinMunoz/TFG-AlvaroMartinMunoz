from rest_framework import viewsets
from .models.usuario import Usuario
from .serializers import UsuarioSerializer, UserSerializer
from .models.valoracionUsuario import ValoracionUsuario
from .serializers import ValoracionUsuarioSerializer
from django.contrib.auth.models import User

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class ValoracionUsuarioViewSet(viewsets.ModelViewSet):
    queryset = ValoracionUsuario.objects.all()
    serializer_class = ValoracionUsuarioSerializer