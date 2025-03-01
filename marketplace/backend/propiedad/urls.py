from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet
from .views import ValoracionPropiedadViewSet
from .views import FotoPropiedadViewSet

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'valoraciones-propiedades', ValoracionPropiedadViewSet)
router.register(r'fotos-propiedades', FotoPropiedadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('fotos-propiedades/upload_photos/', FotoPropiedadViewSet.as_view({'post': 'upload_photos'})),
]