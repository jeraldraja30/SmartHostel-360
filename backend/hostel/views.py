"""
Views for Hosteler management.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsWardenOrReadOnly
from .models import Hosteler
from .serializers import HostelerSerializer


class HostelerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Hosteler CRUD operations.
    
    Endpoints:
    - GET /api/hostelers/ - List all hostelers
    - POST /api/hostelers/ - Create new hosteler (Warden only)
    - GET /api/hostelers/{id}/ - Retrieve hosteler
    - PUT /api/hostelers/{id}/ - Update hosteler (Warden only)
    - PATCH /api/hostelers/{id}/ - Partial update (Warden only)
    - DELETE /api/hostelers/{id}/ - Delete hosteler (Warden only)
    """
    queryset = Hosteler.objects.all().select_related('room')
    serializer_class = HostelerSerializer
    permission_classes = [IsAuthenticated, IsWardenOrReadOnly]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter hostelers based on user role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see their own profile
        if user.is_student and user.hosteler_id:
            queryset = queryset.filter(hosteler_id=user.hosteler_id)
        
        return queryset
