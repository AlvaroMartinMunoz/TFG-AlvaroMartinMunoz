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
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
    



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [AllowAny()]

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', ]:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        if 'usuario' in request.data:
            usuario = Usuario.objects.filter(usuario=request.data['usuario'])
            if usuario.exists():
                return Response({'error': 'Ya existe un usuario asociado a este usuario'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'No se puede actualizar un usuario'}, status=status.HTTP_400_BAD_REQUEST)
    
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
    
class PasswordResetView(viewsets.ViewSet):
   permission_classes = [AllowAny]

   def post(self,request):
        email = request.data.get('email')
        if not email:
              return Response({'error': 'Email es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f'http://localhost:3000/reset-password/{uid}/{token}'
        mail_subject = 'Restablecimiento de contraseña'
        message = f'Haz clic en el siguiente enlace para restablecer tu contraseña: {reset_link}'
        send_mail(mail_subject, message, settings.EMAIL_HOST_USER, [email])
        return Response({'status': 'Correo enviado'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def post(self,request,uidb64,token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Enlace inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'Nueva contraseña es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user = user)
        except ValidationError as e:
            return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'status': 'Contraseña restablecida'}, status=status.HTTP_200_OK)
