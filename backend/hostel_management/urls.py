"""
URL configuration for hostel_management project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HostelDataView
from outpass.webhook_views import WhatsAppWebhookView

# Import URL groups from accounts
from accounts.urls import admin_urlpatterns, student_urlpatterns, warden_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Authentication ──────────────────────────────────────────────────────
    path('api/auth/', include('accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ── Legacy aliases (keep frontend compat) ───────────────────────────────
    path('api/register/', include('accounts.urls')),   # POST /api/register/
    path('api/login/',    include('accounts.urls')),   # POST /api/login/

    # ── Admin-only endpoints ─────────────────────────────────────────────────
    #   POST   /api/admin/add-student/
    #   DELETE /api/admin/remove-student/
    #   PUT    /api/admin/update-room/
    path('api/admin/', include((admin_urlpatterns, 'admin_api'))),

    # ── Student self-service ─────────────────────────────────────────────────
    #   GET /api/student/me/
    #   GET /api/student/my-room/
    path('api/student/', include((student_urlpatterns, 'student_api'))),

    # ── Warden + Admin shared endpoints ─────────────────────────────────────
    #   GET /api/warden/students/
    path('api/warden/', include((warden_urlpatterns, 'warden_api'))),

    # ── Aggregate data endpoint ──────────────────────────────────────────────
    path('api/hostel-data/', HostelDataView.as_view(), name='hostel-data'),

    # ── App endpoints ────────────────────────────────────────────────────────
    path('api/', include('hostel.urls')),
    path('api/', include('rooms.urls')),
    path('api/', include('outpass.urls')),
    path('api/', include('payments.urls')),
    path('api/', include('feedback.urls')),
    path('api/', include('notifications.urls')),

    # ── Twilio WhatsApp Webhook ──────────────────────────────────────────────
    path('webhook/whatsapp/',     WhatsAppWebhookView.as_view(), name='twilio-whatsapp-webhook'),
    path('api/webhook/whatsapp/', WhatsAppWebhookView.as_view(), name='twilio-whatsapp-webhook-api'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
