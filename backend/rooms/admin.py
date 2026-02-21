"""
Admin configuration for rooms app.
"""
from django.contrib import admin
from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """Admin interface for Room model."""
    list_display = ['room_number', 'block', 'floor', 'room_type', 'bed_type', 
                    'total_beds', 'available_beds', 'is_available', 'room_rate']
    list_filter = ['block', 'floor', 'room_type', 'bed_type', 'is_available']
    search_fields = ['room_number']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Room Information', {
            'fields': ('room_number', 'block', 'floor', 'room_type', 'bed_type', 'image')
        }),
        ('Capacity', {
            'fields': ('total_beds', 'available_beds', 'is_available')
        }),
        ('Pricing', {
            'fields': ('room_rate',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
