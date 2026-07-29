from django.contrib import admin

from .models import HealthSummary, InvestigationAnalysis, TrendSnapshot


@admin.register(InvestigationAnalysis)
class InvestigationAnalysisAdmin(admin.ModelAdmin):
    list_display = ("investigation_name", "patient", "current_status", "trend", "urgency_level")


@admin.register(HealthSummary)
class HealthSummaryAdmin(admin.ModelAdmin):
    list_display = ("patient", "model_used", "created_at")


@admin.register(TrendSnapshot)
class TrendSnapshotAdmin(admin.ModelAdmin):
    list_display = ("patient", "investigation_key", "updated_at")
