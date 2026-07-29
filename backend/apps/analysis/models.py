from django.conf import settings
from django.db import models

from apps.patients.models import Patient
from apps.reports.models import LabReport


class InvestigationAnalysis(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="analyses")
    report = models.ForeignKey(LabReport, on_delete=models.CASCADE, related_name="analyses", null=True)
    investigation_key = models.CharField(max_length=64, db_index=True)
    investigation_name = models.CharField(max_length=200)
    current_value = models.FloatField(null=True)
    current_unit = models.CharField(max_length=50, blank=True)
    current_status = models.CharField(max_length=20, default="unknown")
    previous_value = models.FloatField(null=True, blank=True)
    oldest_value = models.FloatField(null=True, blank=True)
    trend = models.CharField(max_length=30, default="stable")  # increasing/decreasing/stable/fluctuating
    severity = models.CharField(max_length=20, default="low")
    rate_of_change = models.FloatField(null=True, blank=True)
    possible_clinical_meaning = models.TextField(blank=True)
    possible_causes = models.TextField(blank=True)
    possible_complications = models.TextField(blank=True)
    urgency_level = models.CharField(max_length=20, default="routine")  # routine/soon/urgent/emergency
    confidence_score = models.FloatField(default=0.7)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ("patient", "investigation_key")


class HealthSummary(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="summaries")
    report = models.ForeignKey(LabReport, on_delete=models.SET_NULL, null=True, blank=True)
    summary_text = models.TextField()
    preventive_suggestions = models.JSONField(default=list)
    model_used = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Health summaries"


class TrendSnapshot(models.Model):
    """Cached series for charting."""

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="trend_snapshots")
    investigation_key = models.CharField(max_length=64)
    series = models.JSONField(default=list)  # [{date, value, unit}]
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("patient", "investigation_key")
