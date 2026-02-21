"""
Admin configuration for payments app.
"""
from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model."""
    list_display = ['invoice_no', 'hosteler', 'amount', 'payment_type', 'status', 'paid_on', 'due_date']
    list_filter = ['status', 'payment_type', 'paid_on', 'due_date']
    search_fields = ['invoice_no', 'hosteler__name', 'hosteler__hosteler_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('invoice_no', 'hosteler', 'amount', 'payment_type', 'status')
        }),
        ('Dates', {
            'fields': ('paid_on', 'due_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
