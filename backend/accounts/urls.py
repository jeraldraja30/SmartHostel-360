"""
URL configuration for accounts app.
"""
from django.urls import path
from .views import LoginView, UserProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
