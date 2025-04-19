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

    # def get_valoracion_promedio_usuario(self, obj):
    #     return obj.valoracion_promedio_usuario()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        self.reset_password = PasswordResetForm(data=self.initial_data)
        if not self.reset_password.is_valid():
            raise serializers.ValidationError(self.reset_password.errors)
        return value
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuarioId'] = self.user.id  
        return data