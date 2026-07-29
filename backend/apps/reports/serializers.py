from rest_framework import serializers

from .models import LabReport, LabResult


class LabResultSerializer(serializers.ModelSerializer):
    display_value = serializers.SerializerMethodField()

    class Meta:
        model = LabResult
        fields = (
            "id",
            "investigation_key",
            "investigation_name",
            "category",
            "raw_value",
            "numeric_value",
            "unit",
            "standardized_value",
            "standardized_unit",
            "display_value",
            "reference_range",
            "reference_low",
            "reference_high",
            "reference_source",
            "status_flag",
            "extraction_status",
            "confidence_score",
            "needs_review",
        )

    def get_display_value(self, obj):
        if obj.extraction_status == LabResult.ExtractionStatus.NOT_AVAILABLE:
            return "Not Available"
        if obj.standardized_value is not None:
            return obj.standardized_value
        return obj.raw_value or "Unable to Extract"


class LabReportSerializer(serializers.ModelSerializer):
    results = LabResultSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = LabReport
        fields = (
            "id",
            "uuid",
            "patient",
            "patient_name",
            "extracted_patient_name",
            "original_filename",
            "file",
            "file_hash",
            "content_type",
            "report_date",
            "hospital_name",
            "doctor_name",
            "status",
            "processing_error",
            "ocr_quality",
            "ocr_message",
            "is_demo",
            "is_encrypted",
            "results",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "uuid",
            "file_hash",
            "status",
            "processing_error",
            "ocr_quality",
            "ocr_message",
            "extracted_patient_name",
            "is_demo",
            "is_encrypted",
            "created_at",
            "updated_at",
        )


class LabReportListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = LabReport
        fields = (
            "id",
            "uuid",
            "patient",
            "patient_name",
            "original_filename",
            "report_date",
            "hospital_name",
            "status",
            "ocr_quality",
            "is_demo",
            "result_count",
            "created_at",
        )

    def get_result_count(self, obj):
        return obj.results.count()


class MultiUploadSerializer(serializers.Serializer):
    patient = serializers.IntegerField()
    files = serializers.ListField(child=serializers.FileField(), allow_empty=False)
