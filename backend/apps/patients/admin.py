from django.contrib import admin

from .models import Patient, UpcomingTest


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("full_name", "folder_name", "ckd_stage", "risk_level", "kidney_score", "is_active")
    search_fields = ("full_name", "folder_name")
    list_filter = ("ckd_stage", "risk_level", "is_active")


@admin.register(UpcomingTest)
class UpcomingTestAdmin(admin.ModelAdmin):
    list_display = ("test_name", "patient", "due_date", "completed")
