"""
Views for Outpass management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsWarden
from django.utils import timezone
from .models import Outpass
from .serializers import OutpassSerializer


class OutpassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Outpass CRUD operations.
    
    Endpoints:
    - GET /api/outpasses/ - List all outpasses
    - POST /api/outpasses/ - Create new outpass
    - GET /api/outpasses/{id}/ - Retrieve outpass
    - PATCH /api/outpasses/{id}/ - Partial update
    - DELETE /api/outpasses/{id}/ - Delete outpass
    - POST /api/outpasses/{id}/set_status/ - Approve/Reject outpass (Warden only)
    """
    queryset = Outpass.objects.all().select_related('hosteler')
    serializer_class = OutpassSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter outpasses based on user role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see their own outpasses
        if user.is_student and user.hosteler_id:
            from hostel.models import Hosteler
            try:
                hosteler = Hosteler.objects.get(hosteler_id=user.hosteler_id)
                queryset = queryset.filter(hosteler=hosteler)
            except Hosteler.DoesNotExist:
                queryset = queryset.none()
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsWarden])
    def set_status(self, request, pk=None):
        """
        Custom action to approve/reject outpass.
        POST /api/outpasses/{id}/set_status/
        Body: {"status": "approved"/"rejected", "warden_reply": "optional message"}
        """
        outpass = self.get_object()
        new_status = request.data.get('status')
        warden_reply = request.data.get('warden_reply', '')
        
        if new_status not in ['approved', 'rejected']:
            return Response(
                {'error': 'Invalid status. Must be "approved" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        outpass.status = new_status
        outpass.approved_by = request.user.get_full_name() or request.user.username
        outpass.approved_on = timezone.now()
        outpass.warden_reply = warden_reply
        outpass.save()
        
        serializer = self.get_serializer(outpass)
        return Response(serializer.data)
