"""
Custom User model with role-based authentication and full student profile fields.
"""
import logging
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

logger = logging.getLogger('django')


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.

    Roles:
        student  — A hostel resident; MUST have a hosteler_id (e.g. H202601021).
        warden   — Hostel staff; hosteler_id is not required.
        admin    — Super-admin with full system access; hosteler_id not required.

    Student-required fields:
        full_name, address, email, phone_number — required when role='student'.
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('warden', 'Warden'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    # ── Student profile fields ──────────────────────────────────────────────────
    full_name = models.CharField(
        max_length=200,
        blank=True,
        help_text='Full name of the student. Required for students.',
    )
    address = models.TextField(
        blank=True,
        help_text='Residential address. Required for students.',
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        help_text='Mobile/phone number. Required for students.',
    )

    # Legacy field kept for backward compat with old frontend code
    mobile = models.CharField(max_length=15, blank=True)

    # Hostel profile link — auto-generated for students (e.g. 'H202601021')
    hosteler_id = models.CharField(
        max_length=25,
        blank=True,
        help_text='Auto-generated for students: H<year><floor><room><bed> format.',
    )

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    # ── Role helpers ──────────────────────────────────────────────────────────

    @property
    def is_warden(self) -> bool:
        """True if user is a warden."""
        return self.role == 'warden'

    @property
    def is_student(self) -> bool:
        """True if user is a student."""
        return self.role == 'student'

    @property
    def is_admin_role(self) -> bool:
        """True if user has the 'admin' custom role."""
        return self.role == 'admin'

    # ── Validation & Save hook ────────────────────────────────────────────────

    def clean(self):
        """
        Validate that student accounts always have a hosteler_id.
        Called by full_clean() / admin forms / serializer validation.
        """
        super().clean()
        if self.role == 'student' and not self.hosteler_id:
            raise ValidationError(
                {'hosteler_id': 'Student accounts must have a hosteler_id.'}
            )

    def save(self, *args, **kwargs):
        """
        Safety net: if a student is being saved without a hosteler_id,
        auto-generate one rather than allowing a NULL/empty value into the DB.
        This should NOT normally fire — the serializer handles generation first.
        Also: sync mobile → phone_number and vice versa for backward compat.
        """
        # Keep mobile and phone_number in sync
        if self.phone_number and not self.mobile:
            self.mobile = self.phone_number
        elif self.mobile and not self.phone_number:
            self.phone_number = self.mobile

        if self.role == 'student' and not self.hosteler_id:
            from .utils import generate_hosteler_id
            self.hosteler_id = generate_hosteler_id()
            logger.warning(
                f"[USER-SAVE] ⚠️ Auto-generated hosteler_id '{self.hosteler_id}' "
                f"for student '{self.username}' during save() — serializer should have done this."
            )
        super().save(*args, **kwargs)
