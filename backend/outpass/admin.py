"""
Admin configuration for outpass app.
"""
from django.contrib import admin
from .models import Outpass


@admin.register(Outpass)
class OutpassAdmin(admin.ModelAdmin):
    """Admin interface for Outpass model."""
    list_display = ['__str__', 'hosteler', 'out_date', 'return_date', 'status', 'approved_by', 'issued_on']
    list_filter = ['status', 'out_date', 'issued_on']
    search_fields = ['hosteler__name', 'hosteler__hosteler_id', 'reason']
    readonly_fields = ['issued_on', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Student Information', {
            'fields': ('hosteler',)
        }),
        ('Outpass Details', {
            'fields': ('out_date', 'return_date', 'reason', 'details')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approved_on', 'warden_reply')
        }),
        ('Timestamps', {
            'fields': ('issued_on', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
