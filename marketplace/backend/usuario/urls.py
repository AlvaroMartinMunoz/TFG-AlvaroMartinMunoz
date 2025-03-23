from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet
from .views import ValoracionUsuarioViewSet
from .views import UsuarioPerfilAPIView
from .views import PasswordResetView
from .views import PasswordResetConfirmView

router = DefaultRouter()
router.register(r'', UsuarioViewSet)
router.register(r'valoraciones-usuarios', ValoracionUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<int:userId>/', UsuarioPerfilAPIView.as_view()),
    path('password/reset/', PasswordResetView.as_view({'post': 'post'})),
    path('password-reset-confirm/<uidb64>/<token>/',PasswordResetConfirmView.as_view({'post': 'post'})),
]