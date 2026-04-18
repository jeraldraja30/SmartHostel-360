"""
Admin configuration for hostel app.
"""
from django.contrib import admin
from .models import Hosteler


@admin.register(Hosteler)
class HostelerAdmin(admin.ModelAdmin):
    """Admin interface for Hosteler model."""
    list_display = ['hosteler_id', 'name', 'gender', 'age', 'mobile', 'room', 'registration_date']
    list_filter = ['gender', 'occupation', 'registration_date', 'college']
    search_fields = ['hosteler_id', 'name', 'email', 'mobile', 'student_id', 'roll_no']
    readonly_fields = ['registration_date', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('hosteler_id', 'name', 'gender', 'age', 'mobile', 'email', 'occupation', 'photo')
        }),
        ('Room Allocation', {
            'fields': ('room', 'bed', 'checkin_date')
        }),
        ('Academic Details', {
            'fields': ('college', 'course', 'department', 'year', 'roll_no', 'student_id')
        }),
        ('Address', {
            'fields': ('address', 'city', 'pincode')
        }),
        ('Parent/Guardian', {
            'fields': ('father_name', 'parent_phone', 'parent_address')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_name', 'emergency_phone')
        }),
        ('Timestamps', {
            'fields': ('registration_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
