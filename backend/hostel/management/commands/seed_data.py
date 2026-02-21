"""
Management command to seed database with sample data.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hostel.models import Hosteler
from rooms.models import Room
from outpass.models import Outpass
from payments.models import Payment
from feedback.models import Feedback
from datetime import date, datetime, timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with sample data matching frontend demo data'
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create users
        self.create_users()
        
        # Create rooms first (needed for hosteler allocation)
        self.create_rooms()
        
        # Create hostelers
        self.create_hostelers()
        
        # Create outpasses
        self.create_outpasses()
        
        # Create payments
        self.create_payments()
        
        # Create feedback
        self.create_feedback()
        
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
    
    def create_users(self):
        """Create warden and student users."""
        # Create warden
        if not User.objects.filter(username='warden').exists():
            warden = User.objects.create_user(
                username='warden',
                password='warden123',
                email='warden@hostel.com',
                first_name='Warden',
                last_name='Admin',
                role='warden'
            )
            self.stdout.write(f'Created warden user: warden/warden123')
        
        # Create sample student users
        students = [
            ('Admin001', 'Rahul', 'Sharma', 'H2024001'),
            ('Admin002', 'Priya', 'Patel', 'H2024002'),
        ]
        
        for username, first_name, last_name, hosteler_id in students:
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username,
                    password=f'{first_name}123',
                    email=f'{first_name.lower()}@example.com',
                    first_name=first_name,
                    last_name=last_name,
                    role='student',
                    hosteler_id=hosteler_id
                )
                self.stdout.write(f'Created student user: {username}/{first_name}123')
    
    def create_rooms(self):
        """Create sample rooms."""
        rooms_data = [
            {'room_number': 'A101', 'block': 'a-block', 'floor': 'ground', 'room_type': 'ac', 
             'bed_type': 'triple', 'total_beds': 3, 'available_beds': 2, 'room_rate': 5000},
            {'room_number': 'B205', 'block': 'b-block', 'floor': 'second', 'room_type': 'non-ac', 
             'bed_type': 'double', 'total_beds': 2, 'available_beds': 1, 'room_rate': 3500},
            {'room_number': 'A201', 'block': 'a-block', 'floor': 'second', 'room_type': 'ac', 
             'bed_type': 'double', 'total_beds': 2, 'available_beds': 2, 'room_rate': 4500},
            {'room_number': 'A102', 'block': 'a-block', 'floor': 'ground', 'room_type': 'non-ac', 
             'bed_type': 'triple', 'total_beds': 3, 'available_beds': 1, 'room_rate': 4000},
            {'room_number': 'B206', 'block': 'b-block', 'floor': 'second', 'room_type': 'ac', 
             'bed_type': 'single', 'total_beds': 1, 'available_beds': 0, 'room_rate': 6000},
        ]
        
        for room_data in rooms_data:
            room_data['is_available'] = room_data['available_beds'] > 0
            Room.objects.get_or_create(room_number=room_data['room_number'], defaults=room_data)
        
        self.stdout.write('Created sample rooms')
    
    def create_hostelers(self):
        """Create sample hostelers."""
        room_a101 = Room.objects.get(room_number='A101')
        room_b205 = Room.objects.get(room_number='B205')
        
        hostelers_data = [
            {
                'hosteler_id': 'H2024001',
                'name': 'Rahul Sharma',
                'gender': 'male',
                'age': 20,
                'mobile': '9876543210',
                'email': 'rahul@example.com',
                'occupation': 'student',
                'room': room_a101,
                'bed': 'B1',
                'checkin_date': date(2024, 3, 15),
                'college': 'University of Technology',
                'course': 'Computer Science',
                'department': 'Computer Science',
                'year': '2',
                'roll_no': 'CS2023001',
                'student_id': 'STU2023001',
                'address': '123 Main Street, Bangalore',
                'city': 'Bangalore',
                'pincode': '560001',
                'father_name': 'Rajesh Sharma',
                'parent_phone': '9876543219',
                'parent_address': '123 Main Street, Bangalore',
                'emergency_name': 'Priya Sharma',
                'emergency_phone': '9876543218'
            },
            {
                'hosteler_id': 'H2024002',
                'name': 'Priya Patel',
                'gender': 'female',
                'age': 19,
                'mobile': '9876543211',
                'email': 'priya@example.com',
                'occupation': 'student',
                'room': room_b205,
                'bed': 'B2',
                'checkin_date': date(2024, 3, 10),
                'college': 'University of Technology',
                'course': 'Electrical Engineering',
                'department': 'Electrical Engineering',
                'year': '1',
                'roll_no': 'EE2023001',
                'student_id': 'STU2023002',
                'address': '456 Park Avenue, Bangalore',
                'city': 'Bangalore',
                'pincode': '560002',
                'father_name': 'Ramesh Patel',
                'parent_phone': '9876543217',
                'parent_address': '456 Park Avenue, Bangalore',
                'emergency_name': 'Rahul Patel',
                'emergency_phone': '9876543216'
            }
        ]
        
        for hosteler_data in hostelers_data:
            Hosteler.objects.get_or_create(hosteler_id=hosteler_data['hosteler_id'], defaults=hosteler_data)
        
        self.stdout.write('Created sample hostelers')
    
    def create_outpasses(self):
        """Create sample outpasses."""
        hosteler1 = Hosteler.objects.get(hosteler_id='H2024001')
        hosteler2 = Hosteler.objects.get(hosteler_id='H2024002')
        
        outpasses_data = [
            {
                'hosteler': hosteler1,
                'out_date': date.today() + timedelta(days=2),
                'return_date': date.today() + timedelta(days=4),
                'reason': 'home',
                'details': 'Going home for family function',
                'status': 'approved',
                'approved_by': 'Dr. Rajesh Kumar',
                'approved_on': datetime.now() - timedelta(days=1)
            },
            {
                'hosteler': hosteler2,
                'out_date': date.today() + timedelta(days=5),
                'return_date': date.today() + timedelta(days=6),
                'reason': 'medical',
                'details': 'Dental appointment',
                'status': 'pending'
            }
        ]
        
        for outpass_data in outpasses_data:
            Outpass.objects.create(**outpass_data)
        
        self.stdout.write('Created sample outpasses')
    
    def create_payments(self):
        """Create sample payments."""
        hosteler1 = Hosteler.objects.get(hosteler_id='H2024001')
        hosteler2 = Hosteler.objects.get(hosteler_id='H2024002')
        
        payments_data = [
            {
                'invoice_no': 'P2024001',
                'hosteler': hosteler1,
                'amount': Decimal('5000.00'),
                'payment_type': 'cash',
                'status': 'completed',
                'paid_on': datetime.now() - timedelta(days=10),
                'due_date': date.today() - timedelta(days=5)
            },
            {
                'invoice_no': 'P2024002',
                'hosteler': hosteler2,
                'amount': Decimal('3500.00'),
                'payment_type': 'upi',
                'status': 'completed',
                'paid_on': datetime.now() - timedelta(days=15),
                'due_date': date.today() - timedelta(days=10)
            }
        ]
        
        for payment_data in payments_data:
            Payment.objects.get_or_create(invoice_no=payment_data['invoice_no'], defaults=payment_data)
        
        self.stdout.write('Created sample payments')
    
    def create_feedback(self):
        """Create sample feedback."""
        feedback_data = [
            {
                'student_name': 'Rahul Sharma',
                'student_email': 'rahul@example.com',
                'feedback_type': 'suggestion',
                'message': 'Can we have more vegetarian options in the mess?',
                'status': 'pending'
            },
            {
                'student_name': 'Priya Patel',
                'student_email': 'priya@example.com',
                'feedback_type': 'complaint',
                'message': 'The Wi-Fi in the common area is very slow during peak hours.',
                'status': 'replied',
                'reply': 'We are working on upgrading the network infrastructure. Expected completion by next week.'
            }
        ]
        
        for feedback_item in feedback_data:
            Feedback.objects.create(**feedback_item)
        
        self.stdout.write('Created sample feedback')
