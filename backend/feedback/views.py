"""
Views for Feedback management.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsWardenOrReadOnly
from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Feedback CRUD operations.
    
    Endpoints:
    - GET /api/feedback/ - List all feedback
    - POST /api/feedback/ - Create new feedback
    - GET /api/feedback/{id}/ - Retrieve feedback
    - PATCH /api/feedback/{id}/ - Update feedback (Warden can reply)
    - DELETE /api/feedback/{id}/ - Delete feedback
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated, IsWardenOrReadOnly]
    
    def perform_update(self, serializer):
        """Allow warden to update reply and status."""
        serializer.save()
