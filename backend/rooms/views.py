"""
Views for Room management.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsWardenOrReadOnly
from .models import Room
from .serializers import RoomSerializer


class RoomViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Room CRUD operations.
    
    Endpoints:
    - GET /api/rooms/ - List all rooms
    - POST /api/rooms/ - Create new room (Warden only)
    - GET /api/rooms/{id}/ - Retrieve room
    - PUT /api/rooms/{id}/ - Update room (Warden only)
    - PATCH /api/rooms/{id}/ - Partial update (Warden only)
    - DELETE /api/rooms/{id}/ - Delete room (Warden only)
    """
    queryset = Room.objects.all().prefetch_related('hostelers')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, IsWardenOrReadOnly]
    
    def perform_destroy(self, instance):
        """Prevent deletion of rooms with allocated beds."""
        if instance.available_beds < instance.total_beds:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'error': 'Cannot delete room with allocated beds. Please deallocate all students first.'
            })
        instance.delete()
