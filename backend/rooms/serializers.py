"""
Serializers for Room model with camelCase transformation.
"""
from rest_framework import serializers
from core.serializers import CamelCaseModelSerializer
from .models import Room


class RoomSerializer(CamelCaseModelSerializer):
    """
    Serializer for Room model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    # Include list of student IDs in this room
    students = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_number', 'block', 'floor', 'room_type', 'bed_type',
            'total_beds', 'available_beds', 'room_rate', 'is_available',
            'image', 'students'
        ]
        read_only_fields = ['id', 'available_beds', 'is_available', 'students']
    
    def get_students(self, obj):
        """Return list of hosteler IDs currently in this room."""
        return list(obj.hostelers.values_list('hosteler_id', flat=True))
    
    def validate(self, data):
        """Validate room data."""
        if 'total_beds' in data:
            total_beds = data['total_beds']
            if total_beds < 1 or total_beds > 10:
                raise serializers.ValidationError({'total_beds': 'Must be between 1 and 10'})
            
            # Set available_beds to total_beds for new rooms
            if not self.instance:
                data['available_beds'] = total_beds
        
        return data
