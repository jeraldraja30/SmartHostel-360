"""
Admin configuration for notifications app.
"""
from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model."""
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Recipient', {
            'fields': ('user',)
        }),
        ('Notification', {
            'fields': ('notification_type', 'title', 'message', 'related_id')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
