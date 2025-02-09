from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet
from .views import ValoracionUsuarioViewSet

router = DefaultRouter()
router.register(r'', UsuarioViewSet)
router.register(r'valoraciones-usuarios', ValoracionUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]