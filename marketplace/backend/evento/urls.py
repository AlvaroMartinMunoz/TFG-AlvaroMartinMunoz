from rest_framework.routers import DefaultRouter
from .views import EventoViewSet
from django.urls import path, include


router = DefaultRouter()
router.register(r'eventos', EventoViewSet)

urlpatterns =[
    path('', include(router.urls)),
]
