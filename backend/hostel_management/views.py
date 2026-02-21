"""
Aggregate view for frontend hostel-data endpoint.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from hostel.models import Hosteler
from rooms.models import Room
from outpass.models import Outpass
from payments.models import Payment
from feedback.models import Feedback

from hostel.serializers import HostelerSerializer
from rooms.serializers import RoomSerializer
from outpass.serializers import OutpassSerializer
from payments.serializers import PaymentSerializer
from feedback.serializers import FeedbackSerializer


class HostelDataView(APIView):
    """
    Aggregate endpoint that returns all hostel data for the dashboard.
    Matches frontend expectation: GET /api/hostel-data/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all data
        hostelers = Hosteler.objects.all()
        rooms = Room.objects.all()
        outpasses = Outpass.objects.all().select_related('hosteler')
        payments = Payment.objects.all().select_related('hosteler')
        feedback = Feedback.objects.all()
        
        # Serialize
        data = {
            'hostelers': HostelerSerializer(hostelers, many=True).data,
            'rooms': RoomSerializer(rooms, many=True).data,
            'outpasses': OutpassSerializer(outpasses, many=True).data,
            'bookings': [],  # Not implemented yet, frontend has bookings separate from room alloc
            'payments': PaymentSerializer(payments, many=True).data,
            'maintenance': [],  # Placeholder for future feature
            'inventory': [],  # Placeholder for future feature
            'feedback': FeedbackSerializer(feedback, many=True).data,
        }
        
        return Response(data)
