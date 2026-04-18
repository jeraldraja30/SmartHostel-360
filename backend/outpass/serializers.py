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
    student_id = serializers.CharField(read_only=True)
    student_name = serializers.CharField(read_only=True)
    submitted_date = serializers.DateTimeField(source='issued_on', read_only=True)
    approved_date = serializers.DateTimeField(source='approved_on', read_only=True, allow_null=True)

    # Warden dashboard helper — True if parent has approved, False otherwise
    parent_approved = serializers.SerializerMethodField()
    
    # Write field for hosteler (accepts hosteler_id string)
    hosteler_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Outpass
        fields = [
            # Core fields
            'id', 'backend_id', 'student_id', 'student_name', 'hosteler', 'hosteler_id',
            'out_date', 'return_date', 'reason', 'details', 'status',
            'submitted_date', 'approved_date', 'approved_by', 'warden_reply',
            'issued_on', 'approved_on',
            # WhatsApp parent approval fields
            'parent_phone', 'parent_status', 'parent_response_time', 'whatsapp_message_id',
            # Warden helper
            'parent_approved',
        ]
        read_only_fields = [
            'id', 'backend_id', 'student_id', 'student_name',
            'submitted_date', 'approved_date', 'issued_on', 'approved_on',
            # Set automatically — frontend must NOT send these
            'parent_status', 'parent_response_time', 'whatsapp_message_id', 'parent_approved',
            'hosteler' # Automatically assigned
        ]
    
    def get_id(self, obj):
        """Return formatted ID e.g. OP0001."""
        return f"OP{str(obj.id).zfill(4)}"

    def get_parent_approved(self, obj):
        """Return True if parent has approved — makes frontend logic simpler."""
        return obj.parent_status == 'approved'
    
    def create(self, validated_data):
        """Create outpass from hosteler_id if provided or from requesting user."""
        hosteler_id = validated_data.pop('hosteler_id', None)
        request = self.context.get('request')
        
        from hostel.models import Hosteler
        
        if hosteler_id:
            try:
                hosteler = Hosteler.objects.get(hosteler_id=hosteler_id)
                validated_data['hosteler'] = hosteler
            except Hosteler.DoesNotExist:
                raise serializers.ValidationError({'hosteler_id': f'Hosteler {hosteler_id} not found'})
        elif request and request.user and getattr(request.user, 'is_student', False):
            # They are a student, check if they have a mapped profile
            user_hosteler_id = getattr(request.user, 'hosteler_id', '')
            if user_hosteler_id:
                try:
                    hosteler = Hosteler.objects.get(hosteler_id=user_hosteler_id)
                    validated_data['hosteler'] = hosteler
                except Hosteler.DoesNotExist:
                    raise serializers.ValidationError({'error': f'Your student profile ({user_hosteler_id}) was not found in the database.'})
            else:
                raise serializers.ValidationError({'error': 'Your user account is a student but is missing a linked hosteler_id.'})
                
        if 'hosteler' not in validated_data:
            raise serializers.ValidationError({
                'hosteler_id': 'Hosteler ID is required. If you are a Warden/Admin creating this outpass, please ensure you selected a student.'
            })
        
        return super().create(validated_data)
