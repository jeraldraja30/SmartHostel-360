"""
Serializers for authentication and user management.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'mobile', 'hosteler_id']
        read_only_fields = ['id']


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return data


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for token response."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
    
    @staticmethod
    def get_token_for_user(user):
        """Generate JWT tokens for user."""
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }
