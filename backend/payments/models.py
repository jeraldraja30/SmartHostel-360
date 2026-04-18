"""
Payment model for hostel fee payments.
"""
from django.db import models


class Payment(models.Model):
    """
    Model for hostel fee payments.
    Matches frontend mapPaymentFromApi structure.
    """
    PAYMENT_TYPE_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('online', 'Online Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    # Core fields
    invoice_no = models.CharField(max_length=20, unique=True)
    hosteler = models.ForeignKey('hostel.Hosteler', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    paid_on = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.invoice_no} - {self.hosteler.name} - ₹{self.amount}"
    
    @property
    def hosteler_code(self):
        """Get hosteler code for serializer."""
        return self.hosteler.hosteler_id
    
    @property
    def hosteler_name(self):
        """Get hosteler name for serializer."""
        return self.hosteler.name
