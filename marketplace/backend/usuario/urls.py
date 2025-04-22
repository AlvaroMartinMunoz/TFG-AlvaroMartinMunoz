from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet
from .views import UsuarioPerfilAPIView
from .views import PasswordResetView
from .views import PasswordResetConfirmView

router = DefaultRouter()
router.register(r'', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:userId>/', UsuarioPerfilAPIView.as_view()),
    path('password/reset/', PasswordResetView.as_view({'post': 'post'}), name='password-reset'),
    path('password-reset-confirm/<uidb64>/<token>/',PasswordResetConfirmView.as_view({'post': 'post'}), name='password-reset-confirm'),
]