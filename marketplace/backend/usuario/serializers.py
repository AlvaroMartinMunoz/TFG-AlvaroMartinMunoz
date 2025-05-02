from rest_framework import serializers
from .models.usuario import Usuario
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.forms import PasswordResetForm
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UsuarioSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    # valoracion_promedio_usuario = serializers.SerializerMethodField()
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {"usuario": {"required": False}} 

    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        user = User.objects.create_user(username=username,email=email,password=password)

        usuario = Usuario.objects.create(usuario=user,**validated_data)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        usuario_data = UsuarioSerializer(usuario).data
        usuario_data['access_token'] = access_token
        usuario_data['refresh_token'] = refresh_token

        print(usuario_data)
        return usuario_data 
    
    # def validate_username(self, value):
    #     """Comprueba si el username ya está en uso durante la validación."""
    #     if User.objects.filter(username=value).exists():
    #         raise serializers.ValidationError(_("Ya existe un usuario con ese nombre de usuario."))
    #     return value

    # def validate_email(self, value):
    #     """Comprueba si el email ya está en uso durante la validación."""
    #     # Nota: Esta validación simple asume creación. Si permitieras actualizar
    #     # email vía este serializer, necesitarías lógica más compleja aquí.
    #     if User.objects.filter(email=value).exists():
    #         raise serializers.ValidationError(_("Esta dirección de correo electrónico ya está en uso."))
    #     return value

    # def get_valoracion_promedio_usuario(self, obj):
    #     return obj.valoracion_promedio_usuario()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    # def validate_email(self, value):
    #     self.reset_password = PasswordResetForm(data=self.initial_data)
    #     if not self.reset_password.is_valid():
    #         raise serializers.ValidationError(self.reset_password.errors)
    #     return value
    
    def validate_email(self, value):
        # El EmailField ya valida el formato.
        # Ahora validamos explícitamente la existencia del usuario activo.
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError(_("No existe un usuario activo con esa dirección de correo."))
        # Si existe, el email es válido para iniciar el reseteo.
        return value

    
# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     def validate(self, attrs):
#         data = super().validate(attrs)
#         data['usuarioId'] = self.user.id  
#         return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        try:
           
            usuario_relacionado = self.user.usuario
            data['usuarioId'] = usuario_relacionado.id
        except AttributeError:
            
            print(f"Error: No se encontró el perfil Usuario para el User con ID {self.user.id}")
           
            raise serializers.ValidationError("No se encontró el perfil de usuario asociado.")
         

        return data