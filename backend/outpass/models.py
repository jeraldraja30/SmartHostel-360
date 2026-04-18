"""
Outpass model with approval workflow.
"""
from django.db import models


class Outpass(models.Model):
    """
    Model for student outpass requests.
    Matches frontend mapOutpassFromApi structure.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    # Related hosteler
    hosteler = models.ForeignKey('hostel.Hosteler', on_delete=models.CASCADE, related_name='outpasses')
    
    # Outpass details
    out_date = models.DateField()
    return_date = models.DateField()
    reason = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    issued_on = models.DateTimeField(auto_now_add=True)
    approved_on = models.DateTimeField(null=True, blank=True)
    approved_by = models.CharField(max_length=200, blank=True)
    warden_reply = models.TextField(blank=True)
    
    # WhatsApp Parent Approval Tracking
    PARENT_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Parent Approved'),
        ('rejected', 'Parent Rejected'),
    ]
    parent_phone = models.CharField(max_length=20, blank=True, help_text="Phone number message was sent to")
    parent_status = models.CharField(max_length=20, choices=PARENT_STATUS_CHOICES, default='pending')
    parent_response_time = models.DateTimeField(null=True, blank=True)
    whatsapp_message_id = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'outpasses'
        verbose_name = 'Outpass'
        verbose_name_plural = 'Outpasses'
        ordering = ['-issued_on']
    
    def __str__(self):
        return f"OP{str(self.id).zfill(4)} - {self.hosteler.name}"
    
    @property
    def student_id(self):
        """Get student ID for serializer."""
        return self.hosteler.hosteler_id
    
    @property
    def student_name(self):
        """Get student name for serializer."""
        return self.hosteler.name
