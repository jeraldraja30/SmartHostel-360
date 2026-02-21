"""
Views for authentication.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import LoginSerializer, TokenResponseSerializer, UserSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate user and return JWT tokens.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token_data = TokenResponseSerializer.get_token_for_user(user)
            return Response(token_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    GET /api/auth/profile/
    Get current authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
