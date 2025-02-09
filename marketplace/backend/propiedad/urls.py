from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet
from .views import ValoracionPropiedadViewSet

router = DefaultRouter()
router.register(r'', PropiedadViewSet)
router.register(r'valoraciones-propiedades', ValoracionPropiedadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]