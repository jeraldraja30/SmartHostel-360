"""
Admin configuration for feedback app.
"""
from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """Admin interface for Feedback model."""
    list_display = ['student_name', 'feedback_type', 'status', 'date']
    list_filter = ['feedback_type', 'status', 'date']
    search_fields = ['student_name', 'student_email', 'message']
    readonly_fields = ['date', 'updated_at']
    
    fieldsets = (
        ('Student Information', {
            'fields': ('student_name', 'student_email')
        }),
        ('Feedback', {
            'fields': ('feedback_type', 'message', 'status', 'reply')
        }),
        ('Timestamps', {
            'fields': ('date', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
