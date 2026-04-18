"""
URL configuration for hostel app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostelerViewSet

router = DefaultRouter()
router.register(r'hostelers', HostelerViewSet, basename='hosteler')

urlpatterns = [
    path('', include(router.urls)),
]
