import re
import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


def patient_folder_name(instance):
    base = slugify(instance.full_name) or f"patient-{instance.pk or 'new'}"
    return f"{base}-{str(instance.uuid)[:8]}"


class Patient(models.Model):
    class Sex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNKNOWN = "unknown", "Unknown"

    class CKDStage(models.TextChoices):
        UNKNOWN = "unknown", "Unknown"
        STAGE_1 = "1", "Stage 1"
        STAGE_2 = "2", "Stage 2"
        STAGE_3A = "3a", "Stage 3a"
        STAGE_3B = "3b", "Stage 3b"
        STAGE_4 = "4", "Stage 4"
        STAGE_5 = "5", "Stage 5"

    class RiskLevel(models.TextChoices):
        LOW = "low", "Low"
        MODERATE = "moderate", "Moderate"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
        null=True,
        blank=True,
    )
    caregivers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="cared_patients",
        blank=True,
    )
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=20, choices=Sex.choices, default=Sex.UNKNOWN)
    blood_group = models.CharField(max_length=5, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    diagnosis_notes = models.TextField(blank=True)
    ckd_stage = models.CharField(max_length=10, choices=CKDStage.choices, default=CKDStage.UNKNOWN)
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW)
    kidney_score = models.PositiveSmallIntegerField(default=50, help_text="0-100 overall kidney score")
    folder_name = models.SlugField(max_length=220, unique=True, blank=True)
    primary_nephrologist = models.CharField(max_length=200, blank=True)
    emergency_contact = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.folder_name:
            self.folder_name = patient_folder_name(self)
            # Ensure uniqueness
            base = self.folder_name
            n = 1
            while Patient.objects.filter(folder_name=self.folder_name).exclude(pk=self.pk).exists():
                self.folder_name = f"{base}-{n}"
                n += 1
        super().save(*args, **kwargs)
        self.ensure_storage_folder()

    def ensure_storage_folder(self):
        path = settings.PATIENT_STORAGE_ROOT / self.folder_name
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def storage_path(self):
        return settings.PATIENT_STORAGE_ROOT / self.folder_name

    @property
    def bmi(self):
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            h_m = float(self.height_cm) / 100
            return round(float(self.weight_kg) / (h_m * h_m), 1)
        return None


class UpcomingTest(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="upcoming_tests")
    test_name = models.CharField(max_length=200)
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date"]
