from rest_framework import viewsets
from .models.usuario import Usuario
from .serializers import UsuarioSerializer
from .models.valoracionUsuario import ValoracionUsuario
from .serializers import ValoracionUsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class ValoracionUsuarioViewSet(viewsets.ModelViewSet):
    queryset = ValoracionUsuario.objects.all()
    serializer_class = ValoracionUsuarioSerializer