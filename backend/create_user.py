import os
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_presence.settings')
django.setup()

# Import the User model
from django.contrib.auth import get_user_model
User = get_user_model()

# Create a superuser
username = 'admin'
email = 'admin@example.com'
password = 'Admin123!'

# Check if the user already exists
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created successfully!")
    print(f"Username: {username}")
    print(f"Password: {password}")
else:
    print(f"User '{username}' already exists.")
    # Update the password
    user = User.objects.get(username=username)
    user.set_password(password)
    user.save()
    print(f"Password for '{username}' has been updated to: {password}")
