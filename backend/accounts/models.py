"""
Custom User model with role-based authentication.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Supports both Student and Warden roles.
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('warden', 'Warden'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    mobile = models.CharField(max_length=15, blank=True)
    
    # Link to hosteler profile if student
    hosteler_id = models.CharField(max_length=20, blank=True, help_text='H2024001 format')
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_warden(self):
        """Check if user is a warden."""
        return self.role == 'warden'
    
    @property
    def is_student(self):
        """Check if user is a student."""
        return self.role == 'student'
