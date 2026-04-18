"""
Admin configuration for accounts app.
Provides full student management with hosteler_id visibility and reset actions.
"""
import logging
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .utils import generate_hosteler_id

logger = logging.getLogger('django')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Enhanced Admin for User model.

    Features:
    - Shows hosteler_id directly in the list view.
    - Allows searching by hosteler_id.
    - 'Reset hosteler_id' bulk action for students.
    - Inline editing of hosteler_id from the change list.
    """

    # ── List page ─────────────────────────────────────────────────────────────
    list_display = [
        'username', 'email', 'full_name', 'phone_number',
        'role', 'hosteler_id', 'is_active', 'date_joined',
    ]
    list_display_links = ['username']
    list_editable = ['hosteler_id']          # edit hosteler_id inline on the list
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['username', 'email', 'full_name', 'phone_number', 'hosteler_id']
    ordering = ['-date_joined']

    # ── Detail page ───────────────────────────────────────────────────────────
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Hostel Role & ID', {
            'fields': ('role', 'hosteler_id'),
            'description': (
                'hosteler_id is auto-generated for students during registration. '
                'Use "Reset hosteler_id" action to regenerate if required.'
            ),
        }),
        ('Student Profile', {
            'fields': ('full_name', 'address', 'phone_number', 'mobile'),
            'description': 'These fields are REQUIRED for students.',
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Hostel Role & ID', {
            'fields': ('role', 'hosteler_id'),
            'description': (
                'Leave hosteler_id blank for students — it will be auto-generated on save.'
            ),
        }),
        ('Student Profile', {
            'fields': ('full_name', 'address', 'phone_number', 'mobile'),
            'description': 'Required for students.',
        }),
    )

    readonly_fields = ['date_joined', 'last_login']

    # ── Custom actions ────────────────────────────────────────────────────────
    actions = ['reset_hosteler_id', 'view_hosteler_summary']

    @admin.action(description='🔄 Reset hosteler_id (regenerate for selected students)')
    def reset_hosteler_id(self, request, queryset):
        """Regenerate hosteler_id for selected student users."""
        updated = 0
        skipped = 0
        for user in queryset:
            if user.role != 'student':
                skipped += 1
                continue
            old_id = user.hosteler_id
            new_id = generate_hosteler_id()
            user.hosteler_id = new_id
            user.save(update_fields=['hosteler_id'])
            logger.info(
                f'[ADMIN] hosteler_id reset for "{user.username}": '
                f'"{old_id}" → "{new_id}" by {request.user.username}'
            )
            updated += 1

        if updated:
            self.message_user(
                request,
                f'✅ Reset hosteler_id for {updated} student(s).',
                messages.SUCCESS,
            )
        if skipped:
            self.message_user(
                request,
                f'⚠️  Skipped {skipped} non-student user(s) — they do not use hosteler_id.',
                messages.WARNING,
            )

    @admin.action(description='📋 View hosteler summary (console log)')
    def view_hosteler_summary(self, request, queryset):
        """Log a summary of selected users to the server console."""
        for user in queryset:
            status = '✅' if (user.role != 'student' or user.hosteler_id) else '❌ MISSING'
            logger.info(
                f'[ADMIN-SUMMARY] {status} | username="{user.username}" | '
                f'role={user.role} | hosteler_id="{user.hosteler_id}"'
            )
        self.message_user(
            request,
            f'Summary for {queryset.count()} user(s) logged to server console.',
            messages.INFO,
        )
