"""
Feedback model for student feedback and complaints.
"""
from django.db import models


class Feedback(models.Model):
    """
    Model for student feedback.
    Matches frontend mapFeedbackFromApi structure.
    """
    TYPE_CHOICES = [
        ('suggestion', 'Suggestion'),
        ('complaint', 'Complaint'),
        ('appreciation', 'Appreciation'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('replied', 'Replied'),
        ('resolved', 'Resolved'),
    ]
    
    # Student information
    student_name = models.CharField(max_length=200)
    student_email = models.EmailField()
    
    # Feedback details
    feedback_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    message = models.TextField()
    
    # Status and reply
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reply = models.TextField(blank=True)
    
    # Timestamps
    date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feedback'
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedback'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student_name} - {self.get_feedback_type_display()} - {self.date.strftime('%Y-%m-%d')}"
