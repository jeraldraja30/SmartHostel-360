"""
Views for Notification management.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification operations.
    
    Endpoints:
    - GET /api/notifications/ - List user's notifications
    - POST /api/notifications/ - Create notification (for system use)
    - POST /api/notifications/{id}/mark_read/ - Mark notification as read
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only notifications for current user."""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
