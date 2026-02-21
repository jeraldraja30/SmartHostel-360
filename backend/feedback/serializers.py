"""
Serializers for Feedback model with camelCase transformation.
"""
from core.serializers import CamelCaseModelSerializer
from .models import Feedback


class FeedbackSerializer(CamelCaseModelSerializer):
    """
    Serializer for Feedback model.
    Converts snake_case DB fields to camelCase for frontend.
    """
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'student_name', 'student_email', 'feedback_type', 'message',
            'status', 'reply', 'date'
        ]
        read_only_fields = ['id', 'date']
