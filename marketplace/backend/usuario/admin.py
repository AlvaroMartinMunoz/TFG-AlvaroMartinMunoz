from django.contrib import admin
from .models.usuario import Usuario
from .models.valoracionUsuario import ValoracionUsuario

admin.site.register(Usuario)
admin.site.register(ValoracionUsuario)