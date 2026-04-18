"""
URL configuration for accounts app.
"""
from django.urls import path
from .views import (
    LoginView,
    UserProfileView,
    RegisterView,
    AdminAddStudentView,
    AdminRemoveStudentView,
    AdminUpdateRoomView,
    StudentMeView,
    StudentMyRoomView,
    WardenListStudentsView,
)

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────────
    path('login/',    LoginView.as_view(),       name='login'),
    path('register/', RegisterView.as_view(),    name='register'),
    path('profile/',  UserProfileView.as_view(), name='profile'),
]

# ── Admin-only endpoints ──────────────────────────────────────────────────────
admin_urlpatterns = [
    path('add-student/',    AdminAddStudentView.as_view(),    name='admin-add-student'),
    path('remove-student/', AdminRemoveStudentView.as_view(), name='admin-remove-student'),
    path('update-room/',    AdminUpdateRoomView.as_view(),    name='admin-update-room'),
]

# ── Student self-service endpoints ────────────────────────────────────────────
student_urlpatterns = [
    path('me/',      StudentMeView.as_view(),     name='student-me'),
    path('my-room/', StudentMyRoomView.as_view(), name='student-my-room'),
]

# ── Warden + Admin shared endpoints ──────────────────────────────────────────
warden_urlpatterns = [
    path('students/', WardenListStudentsView.as_view(), name='warden-list-students'),
]
