"""
Serializers for Hosteler model with camelCase transformation.
"""
from rest_framework import serializers
from core.serializers import CamelCaseModelSerializer
from .models import Hosteler


class HostelerSerializer(CamelCaseModelSerializer):
    """
    Serializer for Hosteler model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    # Computed fields for frontend compatibility
    id = serializers.CharField(source='hosteler_id', read_only=True)
    record_id = serializers.IntegerField(source='pk', read_only=True)
    room_number = serializers.CharField(source='room_number', read_only=True)
    room_id = serializers.IntegerField(source='room.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Hosteler
        fields = [
            'id', 'record_id', 'hosteler_id', 'name', 'gender', 'age', 'mobile', 'email',
            'occupation', 'registration_date', 'room', 'room_number', 'room_id', 'bed',
            'checkin_date', 'college', 'course', 'department', 'year', 'roll_no',
            'student_id', 'photo', 'address', 'city', 'pincode', 'father_name',
            'parent_phone', 'parent_address', 'emergency_name', 'emergency_phone'
        ]
        read_only_fields = ['id', 'record_id', 'registration_date', 'room_number', 'room_id']
    
    def create(self, validated_data):
        """Create a new hosteler with auto-generated ID if not provided."""
        if 'hosteler_id' not in validated_data or not validated_data['hosteler_id']:
            # Auto-generate hosteler_id
            last_hosteler = Hosteler.objects.order_by('-id').first()
            if last_hosteler:
                last_num = int(last_hosteler.hosteler_id[1:])
                new_num = last_num + 1
            else:
                new_num = 2024001
            validated_data['hosteler_id'] = f'H{new_num}'
        
        return super().create(validated_data)
