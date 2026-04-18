import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hostel_management.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.request import Request
from django.test import RequestFactory
from outpass.serializers import OutpassSerializer

# Create a mock student user
User = get_user_model()
try:
    user = User.objects.filter(role='student').first()
except:
    user = None

factory = RequestFactory()
django_request = factory.post('/fake/')
django_request.user = user

request = Request(django_request)

data = {'hosteler_id': '', 'parent_phone': '919965637023', 'out_date': '2026-04-08', 'return_date': '2026-04-08', 'reason': 'home', 'details': 'hho'}

serializer = OutpassSerializer(data=data, context={'request': request})
is_valid = serializer.is_valid()

print("Is Valid:", is_valid)
if not is_valid:
    print("Errors:", dict(serializer.errors))
