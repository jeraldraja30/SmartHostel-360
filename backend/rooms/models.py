"""
Room model with bed availability tracking.
"""
from django.db import models


class Room(models.Model):
    """
    Model for hostel rooms.
    Matches frontend mapRoomFromApi structure.
    """
    BLOCK_CHOICES = [
        ('a-block', 'A Block (Boys)'),
        ('b-block', 'B Block (Girls)'),
    ]
    
    FLOOR_CHOICES = [
        ('ground', 'Ground Floor'),
        ('first', 'First Floor'),
        ('second', 'Second Floor'),
        ('third', 'Third Floor'),
    ]
    
    TYPE_CHOICES = [
        ('ac', 'AC'),
        ('non-ac', 'Non-AC'),
    ]
    
    BED_CHOICES = [
        ('single', 'Single'),
        ('double', 'Double'),
        ('triple', 'Triple'),
    ]
    
    # Core fields
    room_number = models.CharField(max_length=10, unique=True)
    block = models.CharField(max_length=20, choices=BLOCK_CHOICES)
    floor = models.CharField(max_length=20, choices=FLOOR_CHOICES)
    room_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    bed_type = models.CharField(max_length=20, choices=BED_CHOICES)
    total_beds = models.IntegerField()
    available_beds = models.IntegerField()
    room_rate = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    image = models.ImageField(upload_to='rooms/', null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rooms'
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
        ordering = ['block', 'floor', 'room_number']
    
    def __str__(self):
        return f"{self.room_number} ({self.get_block_display()})"
    
    def update_availability(self):
        """Update room availability based on available beds."""
        self.is_available = self.available_beds > 0
        self.save(update_fields=['is_available'])
    
    def allocate_bed(self):
        """Allocate a bed (decrease available beds)."""
        if self.available_beds > 0:
            self.available_beds -= 1
            self.update_availability()
            return True
        return False
    
    def deallocate_bed(self):
        """Deallocate a bed (increase available beds)."""
        if self.available_beds < self.total_beds:
            self.available_beds += 1
            self.update_availability()
            return True
        return False
