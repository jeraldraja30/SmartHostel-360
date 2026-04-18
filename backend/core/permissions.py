"""
Custom permissions for Role-Based Access Control (RBAC).

Usage:
    from core.permissions import IsAdmin, IsWarden, IsAdminOrWarden, IsStudent

Roles:
    admin   → full access
    warden  → read-only access
    student → own data only
"""
from rest_framework import permissions


# ─────────────────────────────────────────────────────────────────────────────
# IsAdmin
# ─────────────────────────────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    """
    Full access — only users with role='admin' pass.
    """
    message = 'Only admins are allowed to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


# ─────────────────────────────────────────────────────────────────────────────
# IsWarden
# ─────────────────────────────────────────────────────────────────────────────

class IsWarden(permissions.BasePermission):
    """
    Read-only access — only users with role='warden' pass.
    Warden cannot write/delete.
    """
    message = 'Wardens can only view data — write access is not permitted.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role == 'warden'


# ─────────────────────────────────────────────────────────────────────────────
# IsAdminOrWarden
# ─────────────────────────────────────────────────────────────────────────────

class IsAdminOrWarden(permissions.BasePermission):
    """
    Admin → full access (read + write).
    Warden → read-only (safe methods only).
    """
    message = 'Only admins and wardens can access this resource.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        role = request.user.role

        if role == 'admin':
            return True

        if role == 'warden':
            # Wardens can only use GET, HEAD, OPTIONS
            return request.method in permissions.SAFE_METHODS

        return False


# ─────────────────────────────────────────────────────────────────────────────
# IsStudent
# ─────────────────────────────────────────────────────────────────────────────

class IsStudent(permissions.BasePermission):
    """
    Own-data-only access — only users with role='student' pass.
    """
    message = 'Only students can access this resource.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


# ─────────────────────────────────────────────────────────────────────────────
# IsWardenOrReadOnly  (kept for backward compat with hostel/views.py)
# ─────────────────────────────────────────────────────────────────────────────

class IsWardenOrReadOnly(permissions.BasePermission):
    """
    Backward-compatible permission:
    - Wardens can modify.
    - Any authenticated user can read.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.role in ('warden', 'admin')
