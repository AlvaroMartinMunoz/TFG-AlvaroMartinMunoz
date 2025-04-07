from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet
from .views import ValoracionPropiedadViewSet
from .views import FotoPropiedadViewSet
from .views import FechaBloqueadaViewSet
from .views import ReservaViewSet
from .views import create_checkout_session
from .views import confirmar_pago
from .views import confirmar_pago_paypal
from .views import create_payment
from .views import FavoritoViewSet
from .views import RecommendationAPI
from .views import PrecioEspecialViewSet
from .views import propiedades_por_usuario
from .views import valoraciones_por_propiedad
from .views import reservas_por_propiedad
from .views import precios_especiales_por_propiedad


router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'valoraciones-propiedades', ValoracionPropiedadViewSet)
router.register(r'fotos-propiedades', FotoPropiedadViewSet)
router.register(r'fechas-bloqueadas', FechaBloqueadaViewSet)
router.register(r'reservas', ReservaViewSet)
router.register(r'favoritos', FavoritoViewSet)
router.register(r'precios-especiales', PrecioEspecialViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('fotos-propiedades/upload_photos/', FotoPropiedadViewSet.as_view({'post': 'upload_photos'})),
    path('create-checkout-session/', create_checkout_session),
    path('confirmar-pago/<str:session_id>', confirmar_pago),
    path('create-checkout-paypal/', create_payment),
    path('confirmar-pago-paypal/', confirmar_pago_paypal),
    path('recomendaciones/', RecommendationAPI.as_view()),
    path('propiedades-por-usuario/<int:usuario_id>/', propiedades_por_usuario),
    path('valoraciones-por-propiedad/<int:propiedad_id>/', valoraciones_por_propiedad),
    path('reservas-por-propiedad/<int:propiedad_id>/', reservas_por_propiedad),
    path('precios-especiales-por-propiedad/<int:propiedad_id>/', precios_especiales_por_propiedad),
]