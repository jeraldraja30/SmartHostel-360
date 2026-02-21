"""
Core serializers with camelCase transformation for frontend compatibility.
"""
from rest_framework import serializers


class CamelCaseSerializerMixin:
    """
    Mixin to convert snake_case model fields to camelCase for API responses.
    Frontend expects camelCase format.
    """
    
    def to_representation(self, instance):
        """Convert the response data to camelCase."""
        data = super().to_representation(instance)
        return {self._camelize(key): value for key, value in data.items()}
    
    def to_internal_value(self, data):
        """Convert incoming camelCase data to snake_case for Django models."""
        snake_case_data = {self._snake_case(key): value for key, value in data.items()}
        return super().to_internal_value(snake_case_data)
    
    @staticmethod
    def _camelize(snake_str):
        """Convert snake_case to camelCase."""
        if not snake_str or '_' not in snake_str:
            return snake_str
        components = snake_str.split('_')
        return components[0] + ''.join(x.title() for x in components[1:])
    
    @staticmethod
    def _snake_case(camel_str):
        """Convert camelCase to snake_case."""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camel_str)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


class CamelCaseModelSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    """
    Base serializer that automatically converts to/from camelCase.
    All model serializers should inherit from this.
    """
    pass
