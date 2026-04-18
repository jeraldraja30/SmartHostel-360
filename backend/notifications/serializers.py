"""
Serializers for Notification model with camelCase transformation.
"""
from core.serializers import CamelCaseModelSerializer
from .models import Notification


class NotificationSerializer(CamelCaseModelSerializer):
    """
    Serializer for Notification model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message', 'is_read',
            'related_id', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at']
