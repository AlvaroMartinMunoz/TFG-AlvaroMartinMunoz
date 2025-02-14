from rest_framework import serializers
from .models.usuario import Usuario
from .models.valoracionUsuario import ValoracionUsuario
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UsuarioSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True,min_length=8)
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
    
class ValoracionUsuarioSerializer(serializers.ModelSerializer):
    usuario_valorador = serializers.StringRelatedField()
    usuario_valorado = serializers.StringRelatedField()
    class Meta:
        model = ValoracionUsuario
        fields = '__all__'
