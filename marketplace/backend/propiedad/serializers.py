from rest_framework import serializers
from .models.propiedad import Propiedad
from propiedad.models.valoracionPropiedad import ValoracionPropiedad


class PropiedadSerializer(serializers.ModelSerializer):
    valoracion_promedio = serializers.SerializerMethodField()
    class Meta:
        model = Propiedad
        fields = '__all__'

    def get_valoracion_promedio(self, obj):
        return obj.valoracion_promedio_propiedad()
        
class ValoracionPropiedadSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()
    propiedad = serializers.StringRelatedField()
    class Meta:
        model =  ValoracionPropiedad
        fields = '__all__'