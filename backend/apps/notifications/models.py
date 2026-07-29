from django.conf import settings
from django.db import models

from apps.patients.models import Patient


class Notification(models.Model):
    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    class Category(models.TextChoices):
        LAB = "lab", "Lab Alert"
        FOLLOWUP = "followup", "Follow-up"
        MEDICATION = "medication", "Medication"
        APPOINTMENT = "appointment", "Appointment"
        SYSTEM = "system", "System"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="notifications", null=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.SYSTEM)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
