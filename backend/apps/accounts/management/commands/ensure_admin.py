from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create default admin user if missing"

    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@khis.local",
                password="admin123",
            )
            self.stdout.write(self.style.SUCCESS("Created admin/admin123"))
        else:
            self.stdout.write("Admin already exists")
