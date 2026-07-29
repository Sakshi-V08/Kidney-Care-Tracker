from rest_framework import serializers

from .models import HealthSummary, InvestigationAnalysis, TrendSnapshot


class InvestigationAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestigationAnalysis
        fields = "__all__"


class HealthSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthSummary
        fields = (
            "id",
            "patient",
            "report",
            "summary_text",
            "preventive_suggestions",
            "model_used",
            "created_at",
        )


class TrendSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendSnapshot
        fields = ("investigation_key", "series", "updated_at")
