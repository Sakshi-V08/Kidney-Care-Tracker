from django.db import models

from apps.patients.models import Patient


class BloodPressureEntry(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="bp_entries")
    systolic = models.PositiveSmallIntegerField()
    diastolic = models.PositiveSmallIntegerField()
    pulse = models.PositiveSmallIntegerField(null=True, blank=True)
    measured_at = models.DateTimeField()
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-measured_at"]


class WeightEntry(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="weight_entries")
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1)
    measured_at = models.DateTimeField()
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-measured_at"]


class WaterIntakeEntry(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="water_entries")
    amount_ml = models.PositiveIntegerField()
    recorded_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]


class MedicineReminder(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="medicine_reminders")
    medicine_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100, blank=True)
    schedule = models.CharField(max_length=200, help_text="e.g. daily 08:00, 20:00")
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AppointmentReminder(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    doctor_name = models.CharField(max_length=200)
    location = models.CharField(max_length=255, blank=True)
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]


class DietPlan(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="diet_plans")
    title = models.CharField(max_length=200, default="Renal Diet Plan")
    guidelines = models.JSONField(default=list)
    daily_sodium_mg = models.PositiveIntegerField(null=True, blank=True)
    protein_guidance = models.TextField(blank=True)
    potassium_guidance = models.TextField(blank=True)
    phosphorus_guidance = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
