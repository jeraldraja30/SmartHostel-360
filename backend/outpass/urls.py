"""
URL configuration for outpass app.
Includes test endpoint for WhatsApp sandbox testing.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OutpassViewSet, test_whatsapp_view

router = DefaultRouter()
router.register(r'outpasses', OutpassViewSet, basename='outpass')

urlpatterns = [
    path('', include(router.urls)),

    # ── TEST ENDPOINT ──────────────────────────────────────────
    # GET  /api/test-whatsapp/?phone=919876543210
    # POST /api/test-whatsapp/  {"phone": "919876543210"}
    path('test-whatsapp/', test_whatsapp_view, name='test-whatsapp'),
]
