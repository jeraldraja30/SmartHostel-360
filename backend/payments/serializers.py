"""
Serializers for Payment model with camelCase transformation.
"""
from rest_framework import serializers
from core.serializers import CamelCaseModelSerializer
from .models import Payment
from django.utils import timezone


class PaymentSerializer(CamelCaseModelSerializer):
    """
    Serializer for Payment model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    # Computed fields for frontend compatibility
    id = serializers.CharField(source='invoice_no', read_only=True)
    hosteler_code = serializers.CharField(source='hosteler_code', read_only=True)
    hosteler_name = serializers.CharField(source='hosteler_name', read_only=True)
    
    # Write field for hosteler (accepts hosteler_id string)
    hosteler_id = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice_no', 'hosteler', 'hosteler_id', 'hosteler_code', 'hosteler_name',
            'amount', 'payment_type', 'status', 'paid_on', 'due_date'
        ]
        read_only_fields = ['id', 'invoice_no', 'hosteler_code', 'hosteler_name']
    
    def create(self, validated_data):
        """Create payment with auto-generated invoice number."""
        hosteler_id = validated_data.pop('hosteler_id', None)
        
        # Get hosteler from hosteler_id if provided
        if hosteler_id:
            from hostel.models import Hosteler
            try:
                hosteler = Hosteler.objects.get(hosteler_id=hosteler_id)
                validated_data['hosteler'] = hosteler
            except Hosteler.DoesNotExist:
                raise serializers.ValidationError({'hosteler_id': f'Hosteler {hosteler_id} not found'})
        
        # Auto-generate invoice number if not provided
        if 'invoice_no' not in validated_data or not validated_data['invoice_no']:
            last_payment = Payment.objects.order_by('-id').first()
            if last_payment:
                last_num = int(last_payment.invoice_no.replace('P', ''))
                new_num = last_num + 1
            else:
                new_num = 2024001
            validated_data['invoice_no'] = f'P{new_num}'
        
        # Set paid_on to now if status is completed and paid_on is not set
        if validated_data.get('status') == 'completed' and not validated_data.get('paid_on'):
            validated_data['paid_on'] = timezone.now()
        
        return super().create(validated_data)
