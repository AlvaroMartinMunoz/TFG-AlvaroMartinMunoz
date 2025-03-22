from rest_framework import serializers
from .models.propiedad import Propiedad, FechaBloqueada
from propiedad.models.valoracionPropiedad import ValoracionPropiedad
from .models.fotoPropiedad import FotoPropiedad
from .models.reserva import Reserva
from .models.favorito import Favorito

class PropiedadSerializer(serializers.ModelSerializer):
    valoracion_promedio = serializers.SerializerMethodField()
    class Meta:
        model = Propiedad
        fields = '__all__'

    def get_valoracion_promedio(self, obj):
        return obj.valoracion_promedio_propiedad()
        
class ValoracionPropiedadSerializer(serializers.ModelSerializer):
    class Meta:
        model =  ValoracionPropiedad
        fields = '__all__'

class FotoPropiedadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoPropiedad
        fields = '__all__'

class FechaBloqueadaSerializer(serializers.ModelSerializer):
   class Meta:
       model = FechaBloqueada
       fields = '__all__'

class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = '__all__'

class FavoritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorito
        fields = '__all__'