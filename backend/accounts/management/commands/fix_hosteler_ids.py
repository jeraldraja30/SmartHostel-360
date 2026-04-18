"""
Management command to backfill missing hosteler_id for existing students.
"""
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from accounts.utils import generate_hosteler_id

logger = logging.getLogger('django')


class Command(BaseCommand):
    help = 'Fix missing hosteler_ids for student accounts.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the command without saving changes to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.WARNING(f"\n=========================================="))
        self.stdout.write(self.style.WARNING(f"   Hosteler ID Fix Tool"))
        if dry_run:
            self.stdout.write(self.style.WARNING(f"   [DRY RUN MODE - No changes will be saved]"))
        self.stdout.write(self.style.WARNING(f"==========================================\n"))

        # Find broken students (role='student' but blank hosteler_id)
        broken_users = User.objects.filter(role='student', hosteler_id='')
        count = broken_users.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("✅ No students with missing hosteler_id found. Database is healthy!"))
            return

        self.stdout.write(f"Found {count} student(s) requiring a hosteler_id fix.\n")
        
        fixed = 0
        errors = 0

        for user in broken_users:
            try:
                new_id = generate_hosteler_id()
                
                # Check if we should also create a hosteler profile
                try:
                    from hostel.models import Hosteler
                    profile_status = "Profile auto-created"
                    
                    if not dry_run:
                        with transaction.atomic():
                            user.hosteler_id = new_id
                            user.save(update_fields=['hosteler_id'])
                            
                            # Try to create a profile
                            full_name = f"{user.first_name} {user.last_name}".strip()
                            display_name = full_name or user.username
                            
                            Hosteler.objects.create(
                                hosteler_id=new_id,
                                name=display_name,
                                gender='male',
                                age=18,
                            )
                except Exception as e:
                    profile_status = f"Warning: Profile creation failed ({e})"
                    if not dry_run:
                        user.hosteler_id = new_id
                        user.save(update_fields=['hosteler_id'])
                        
                self.stdout.write(self.style.SUCCESS(f"  ✅ Fixed '{user.username}': Assigned '{new_id}' | {profile_status}"))
                fixed += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Error fixing '{user.username}': {e}"))
                errors += 1

        self.stdout.write(self.style.WARNING(f"\n=========================================="))
        self.stdout.write(f"Complete: {fixed} successfully processed, {errors} errors.")
        if not dry_run:
            self.stdout.write(self.style.SUCCESS('✅ Database updated.'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ Dry run finished. Run without --dry-run to apply changes.'))
        self.stdout.write(self.style.WARNING(f"==========================================\n"))
