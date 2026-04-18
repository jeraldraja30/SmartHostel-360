"""
Views for Payment management.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment CRUD operations.
    
    Endpoints:
    - GET /api/payments/ - List all payments
    - POST /api/payments/ - Create new payment
    - GET /api/payments/{id}/ - Retrieve payment
    - PUT /api/payments/{id}/ - Update payment
    - DELETE /api/payments/{id}/ - Delete payment
    """
    queryset = Payment.objects.all().select_related('hosteler')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments based on user role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see their own payments
        if user.is_student and user.hosteler_id:
            from hostel.models import Hosteler
            try:
                hosteler = Hosteler.objects.get(hosteler_id=user.hosteler_id)
                queryset = queryset.filter(hosteler=hosteler)
            except Hosteler.DoesNotExist:
                queryset = queryset.none()
        
        return queryset
