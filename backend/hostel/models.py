"""
Hosteler model - matches frontend data structure exactly.
"""
from django.db import models


class Hosteler(models.Model):
    """
    Model for hostel residents (students).
    Matches frontend mapHostelerFromApi structure.
    """
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    # Core fields
    hosteler_id = models.CharField(max_length=20, unique=True, help_text='H2024001 format')
    name = models.CharField(max_length=200)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    age = models.IntegerField()
    mobile = models.CharField(max_length=15)
    email = models.EmailField()
    occupation = models.CharField(max_length=50, default='student')
    registration_date = models.DateField(auto_now_add=True)
    
    # Room allocation
    room = models. ForeignKey('rooms.Room', null=True, blank=True, on_delete=models.SET_NULL, related_name='hostelers')
    bed = models.CharField(max_length=10, blank=True)
    checkin_date = models.DateField(null=True, blank=True)
    
    # Academic details
    college = models.CharField(max_length=200, blank=True)
    course = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    year = models.CharField(max_length=10, blank=True)
    roll_no = models.CharField(max_length=50, blank=True)
    student_id = models.CharField(max_length=50, blank=True)
    
    # Photo
    photo = models.ImageField(upload_to='hostelers/', null=True, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Parent/Guardian details
    father_name = models.CharField(max_length=200, blank=True)
    parent_phone = models.CharField(max_length=15, blank=True)
    parent_address = models.TextField(blank=True)
    
    # Emergency contact
    emergency_name = models.CharField(max_length=200, blank=True)
    emergency_phone = models.CharField(max_length=15, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hostelers'
        verbose_name = 'Hosteler'
        verbose_name_plural = 'Hostelers'
        ordering = ['-registration_date']
    
    def __str__(self):
        return f"{self.hosteler_id} - {self.name}"
    
    @property
    def room_number(self):
        """Get room number for serializer."""
        return self.room.room_number if self.room else ''
