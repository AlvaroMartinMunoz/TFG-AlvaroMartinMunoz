from django.contrib import admin
from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from usuario.views import CustomTokenObtainPairView

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
    path('', ApiRootView.as_view()),
    path('api/', ApiRootView.as_view()),
    path('api/propiedades/', include('propiedad.urls')),
    path('api/usuarios/', include('usuario.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/eventos/', include('evento.urls')),
    path('api/token/full', CustomTokenObtainPairView.as_view(), name='token_obtain_pair_full'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
