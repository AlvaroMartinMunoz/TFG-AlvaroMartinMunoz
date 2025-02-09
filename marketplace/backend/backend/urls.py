from django.contrib import admin
from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response

class ApiRootView(APIView):
      def get(self, request, *args, **kwargs):
        return Response({
            "propiedades": "http://127.0.0.1:8000/api/propiedades/propiedades/",
            "valoraciones-propiedades": "http://127.0.0.1:8000/api/propiedades/valoraciones-propiedades/",
            "usuarios": "http://127.0.0.1:8000/api/usuarios/usuarios/",
            "valoraciones-usuarios": "http://127.0.0.1:8000/api/usuarios/valoraciones-usuarios/"
        })
      
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', ApiRootView.as_view()),
    path('api/propiedades/', include('propiedad.urls')),
    path('api/usuarios/', include('usuario.urls')),
]
