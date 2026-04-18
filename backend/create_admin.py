import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_management.settings')
django.setup()

from accounts.models import User

def create_admin():
    username = 'admin'
    password = 'adminpassword123'
    
    # Check if admin already exists
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        # Update password just in case they forgot it
        user.set_password(password)
        # Ensure role is admin and is_staff/superuser is True
        user.role = 'admin'
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"✅ Executed: Updated existing user '{username}' - password reset to '{password}', role set to 'admin'")
    else:
        # Create new admin user
        user = User.objects.create_superuser(
            username=username,
            email='admin@university.edu',
            password=password,
            # Pass our custom role
            role='admin'
        )
        print(f"✅ Success: Created new admin user '{username}' with password '{password}'")

if __name__ == '__main__':
    create_admin()
