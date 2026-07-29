from rest_framework import serializers

from .models import Patient, UpcomingTest


class UpcomingTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UpcomingTest
        fields = ("id", "test_name", "due_date", "notes", "completed", "created_at")
        read_only_fields = ("id", "created_at")


class PatientSerializer(serializers.ModelSerializer):
    bmi = serializers.FloatField(read_only=True)
    upcoming_tests = UpcomingTestSerializer(many=True, read_only=True)
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            "id",
            "uuid",
            "user",
            "full_name",
            "date_of_birth",
            "sex",
            "blood_group",
            "height_cm",
            "weight_kg",
            "bmi",
            "diagnosis_notes",
            "ckd_stage",
            "risk_level",
            "kidney_score",
            "folder_name",
            "primary_nephrologist",
            "emergency_contact",
            "is_active",
            "upcoming_tests",
            "report_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "uuid", "folder_name", "created_at", "updated_at", "bmi")

    def get_report_count(self, obj):
        return obj.reports.count()


class PatientListSerializer(serializers.ModelSerializer):
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            "id",
            "uuid",
            "full_name",
            "folder_name",
            "ckd_stage",
            "risk_level",
            "kidney_score",
            "report_count",
            "is_active",
            "updated_at",
        )

    def get_report_count(self, obj):
        return obj.reports.count()


class DashboardSerializer(serializers.Serializer):
    patient = PatientSerializer()
    latest_kidney_stage = serializers.CharField()
    risk_level = serializers.CharField()
    overall_kidney_score = serializers.IntegerField()
    recent_reports = serializers.ListField()
    upcoming_tests = UpcomingTestSerializer(many=True)
    abnormal_parameters = serializers.ListField()
    historical_trends = serializers.DictField()
    disclaimer = serializers.CharField()
