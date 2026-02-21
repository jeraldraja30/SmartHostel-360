"""
Serializers for Outpass model with camelCase transformation.
"""
from rest_framework import serializers
from core.serializers import CamelCaseModelSerializer
from .models import Outpass


class OutpassSerializer(CamelCaseModelSerializer):
    """
    Serializer for Outpass model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    # Computed fields for frontend compatibility
    id = serializers.SerializerMethodField()
    backend_id = serializers.IntegerField(source='pk', read_only=True)
    student_id = serializers.CharField(source='student_id', read_only=True)
    student_name = serializers.CharField(source='student_name', read_only=True)
    submitted_date = serializers.DateTimeField(source='issued_on', read_only=True)
    approved_date = serializers.DateTimeField(source='approved_on', read_only=True, allow_null=True)
    
    # Write field for hosteler (accepts hosteler_id string)
    hosteler_id = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Outpass
        fields = [
            'id', 'backend_id', 'student_id', 'student_name', 'hosteler', 'hosteler_id',
            'out_date', 'return_date', 'reason', 'details', 'status',
            'submitted_date', 'approved_date', 'approved_by', 'warden_reply', 'issued_on', 'approved_on'
        ]
        read_only_fields = ['id', 'backend_id', 'student_id', 'student_name', 
                           'submitted_date', 'approved_date', 'issued_on', 'approved_on']
    
    def get_id(self, obj):
        """Return formatted ID (OP0001)."""
        return f"OP{str(obj.id).zfill(4)}"
    
    def create(self, validated_data):
        """Create outpass from hosteler_id if provided."""
        hosteler_id = validated_data.pop('hosteler_id', None)
        
        if hosteler_id:
            from hostel.models import Hosteler
            try:
                hosteler = Hosteler.objects.get(hosteler_id=hosteler_id)
                validated_data['hosteler'] = hosteler
            except Hosteler.DoesNotExist:
                raise serializers.ValidationError({'hosteler_id': f'Hosteler {hosteler_id} not found'})
        
        return super().create(validated_data)
