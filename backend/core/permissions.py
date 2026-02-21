"""
Custom permissions for role-based access control.
"""
from rest_framework import permissions


class IsWarden(permissions.BasePermission):
    """
    Permission class that allows only wardens to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'warden'


class IsStudent(permissions.BasePermission):
    """
    Permission class that allows only students to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'


class IsWardenOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows wardens to modify, students can read.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read permissions for anyone authenticated
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for wardens
        return request.user.role == 'warden'
