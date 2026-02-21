"""
URL configuration for outpass app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OutpassViewSet

router = DefaultRouter()
router.register(r'outpasses', OutpassViewSet, basename='outpass')

urlpatterns = [
    path('', include(router.urls)),
]
