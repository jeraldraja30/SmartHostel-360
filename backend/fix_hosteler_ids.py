"""
DEPRECATED: Use the Django management command instead.

Run: python manage.py fix_hosteler_ids
"""
import sys

if __name__ == "__main__":
    print("This script is deprecated.")
    print("Please run the management command instead:")
    print("  python manage.py fix_hosteler_ids [--dry-run]")
    sys.exit(1)
