import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
for u in User.objects.all():
    print(u.username, u.is_active)

try:
    if not User.objects.filter(username='warden').exists():
        user = User.objects.create_superuser('warden', 'warden@example.com', 'warden123')
        print("Created warden superuser")
except Exception as e:
    print("Error:", e)
