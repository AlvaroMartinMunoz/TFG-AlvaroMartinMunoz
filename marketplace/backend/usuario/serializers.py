from rest_framework import serializers
from .models.usuario import Usuario
from .models.valoracionUsuario import ValoracionUsuario

class UsuarioSerializer(serializers.ModelSerializer):
    valoracion_promedio_usuario = serializers.SerializerMethodField()
    class Meta:
        model = Usuario
        fields = '__all__'

    def get_valoracion_promedio_usuario(self, obj):
        return obj.valoracion_promedio_usuario()
    
class ValoracionUsuarioSerializer(serializers.ModelSerializer):
    usuario_valorador = serializers.StringRelatedField()
    usuario_valorado = serializers.StringRelatedField()
    class Meta:
        model = ValoracionUsuario
        fields = '__all__'