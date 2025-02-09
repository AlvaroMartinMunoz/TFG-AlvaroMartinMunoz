from django.contrib import admin
from .models.propiedad import Propiedad
from .models.valoracionPropiedad import ValoracionPropiedad


admin.site.register(Propiedad)
admin.site.register(ValoracionPropiedad)