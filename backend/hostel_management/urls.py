"""
URL configuration for hostel_management project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HostelDataView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Aggregate data endpoint
    path('api/hostel-data/', HostelDataView.as_view(), name='hostel-data'),
    
    # App endpoints
    path('api/', include('hostel.urls')),
    path('api/', include('rooms.urls')),
    path('api/', include('outpass.urls')),
    path('api/', include('payments.urls')),
    path('api/', include('feedback.urls')),
    path('api/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
