"""
Admin configuration for outpass app.
Updated to show WhatsApp parent approval status for wardens.
"""
from django.contrib import admin
from .models import Outpass


@admin.register(Outpass)
class OutpassAdmin(admin.ModelAdmin):
    """Admin interface for Outpass model with parent approval info."""

    # ── List view columns ──────────────────────────────────────────
    list_display = [
        '__str__', 'hosteler',
        'out_date', 'return_date',
        'parent_status',            # NEW: shows parent's WhatsApp reply
        'status',                   # Warden's decision
        'approved_by', 'issued_on',
    ]

    # ── Sidebar filters ────────────────────────────────────────────
    list_filter = [
        'status',
        'parent_status',            # NEW: filter by parent approval
        'out_date', 'issued_on',
    ]

    # ── Search bar ─────────────────────────────────────────────────
    search_fields = ['hosteler__name', 'hosteler__hosteler_id', 'reason', 'parent_phone']

    # ── Read-only fields (auto-set, never manually edited) ─────────
    readonly_fields = [
        'issued_on', 'created_at', 'updated_at',
        'parent_response_time', 'whatsapp_message_id',
    ]

    # ── Detail page sections ───────────────────────────────────────
    fieldsets = (
        ('Student Information', {
            'fields': ('hosteler',)
        }),
        ('Outpass Details', {
            'fields': ('out_date', 'return_date', 'reason', 'details')
        }),
        # NEW: Parent WhatsApp Approval section
        ('Parent WhatsApp Approval', {
            'fields': (
                'parent_phone',
                'parent_status',
                'parent_response_time',
                'whatsapp_message_id',
            ),
            'description': (
                'Parent receives a WhatsApp message and replies YES or NO. '
                'Status updates automatically via webhook.'
            ),
        }),
        ('Warden Approval', {
            'fields': ('status', 'approved_by', 'approved_on', 'warden_reply')
        }),
        ('Timestamps', {
            'fields': ('issued_on', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
