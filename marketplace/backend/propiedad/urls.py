from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet
from .views import ValoracionPropiedadViewSet
from .views import FotoPropiedadViewSet
from .views import FechaBloqueadaViewSet
from .views import ReservaViewSet

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'valoraciones-propiedades', ValoracionPropiedadViewSet)
router.register(r'fotos-propiedades', FotoPropiedadViewSet)
router.register(r'fechas-bloqueadas', FechaBloqueadaViewSet)
router.register(r'reservas', ReservaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('fotos-propiedades/upload_photos/', FotoPropiedadViewSet.as_view({'post': 'upload_photos'})),
]