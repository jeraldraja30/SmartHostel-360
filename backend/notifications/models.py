"""
Notification model for system notifications.
"""
from django.db import models


class Notification(models.Model):
    """
    Model for system notifications.
    Can be used for warden or student notifications.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('outpass', 'Outpass'),
        ('payment', 'Payment'),
        ('feedback', 'Feedback'),
        ('general', 'General'),
    ]
    
    # Recipient
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    
    # Notification details
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    # Optional link to related object
    related_id = models.IntegerField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
