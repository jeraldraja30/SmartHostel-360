"""
Management command: backfill_student_profile

Copies full_name, address, phone_number from Hosteler profiles into the
User model for any existing students that are missing these fields.

Usage:
    python manage.py backfill_student_profile
    python manage.py backfill_student_profile --dry-run
"""
import logging
from django.core.management.base import BaseCommand
from accounts.models import User

logger = logging.getLogger('django')


class Command(BaseCommand):
    help = 'Backfill student profile fields (full_name, address, phone_number) from Hosteler records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        mode = '[DRY-RUN]' if dry_run else '[LIVE]'

        students = User.objects.filter(role='student')
        self.stdout.write(f'{mode} Found {students.count()} student users.')

        updated = 0
        skipped = 0
        not_found = 0

        try:
            from hostel.models import Hosteler
        except ImportError:
            self.stderr.write('❌ hostel app not available. Aborting.')
            return

        for student in students:
            try:
                profile = Hosteler.objects.get(hosteler_id=student.hosteler_id)
            except Hosteler.DoesNotExist:
                self.stdout.write(
                    f'  ⚠️  No Hosteler profile for: {student.username} '
                    f'(hosteler_id={student.hosteler_id})'
                )
                not_found += 1
                continue

            changed = False
            update_fields = []

            if not student.full_name and profile.name:
                student.full_name = profile.name
                update_fields.append('full_name')
                changed = True

            if not student.phone_number and profile.mobile:
                student.phone_number = profile.mobile
                student.mobile = profile.mobile
                update_fields.extend(['phone_number', 'mobile'])
                changed = True

            if not student.address and profile.address:
                student.address = profile.address
                update_fields.append('address')
                changed = True

            if not student.email and profile.email:
                student.email = profile.email
                update_fields.append('email')
                changed = True

            if changed:
                self.stdout.write(
                    f'  ✅ {mode} Updating "{student.username}": '
                    f'{", ".join(update_fields)}'
                )
                if not dry_run:
                    student.save(update_fields=update_fields)
                updated += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n{mode} Done! Updated={updated}, Skipped={skipped}, '
                f'ProfileNotFound={not_found}'
            )
        )
