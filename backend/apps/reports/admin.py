from django.contrib import admin

from .models import LabReport, LabResult


class LabResultInline(admin.TabularInline):
    model = LabResult
    extra = 0


@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "patient", "report_date", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("original_filename", "patient__full_name", "file_hash")
    inlines = [LabResultInline]


@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ("investigation_name", "standardized_value", "standardized_unit", "status_flag", "report")
    list_filter = ("category", "status_flag")
