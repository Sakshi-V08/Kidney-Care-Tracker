import hashlib
import uuid

from django.db import models

from apps.patients.models import Patient


class LabCategory(models.TextChoices):
    KFT = "kft", "Kidney Function Test"
    URINE = "urine", "Urine Test"
    CBC = "cbc", "Complete Blood Count"
    LFT = "lft", "Liver Function Test"
    DIABETES = "diabetes", "Diabetes"
    LIPID = "lipid", "Lipid Profile"
    VITALS = "vitals", "Vitals"
    OTHER = "other", "Other"


KNOWN_INVESTIGATIONS = {
    # KFT
    "creatinine": LabCategory.KFT,
    "blood_urea": LabCategory.KFT,
    "bun": LabCategory.KFT,
    "egfr": LabCategory.KFT,
    "uric_acid": LabCategory.KFT,
    "sodium": LabCategory.KFT,
    "potassium": LabCategory.KFT,
    "chloride": LabCategory.KFT,
    "calcium": LabCategory.KFT,
    "phosphorus": LabCategory.KFT,
    "albumin": LabCategory.KFT,
    "total_protein": LabCategory.KFT,
    # Urine
    "urine_protein": LabCategory.URINE,
    "urine_albumin": LabCategory.URINE,
    "microalbumin": LabCategory.URINE,
    "protein_creatinine_ratio": LabCategory.URINE,
    "specific_gravity": LabCategory.URINE,
    "urine_ph": LabCategory.URINE,
    "urine_sugar": LabCategory.URINE,
    "ketone": LabCategory.URINE,
    "urine_blood": LabCategory.URINE,
    "urine_rbc": LabCategory.URINE,
    "urine_wbc": LabCategory.URINE,
    "casts": LabCategory.URINE,
    "crystals": LabCategory.URINE,
    # CBC
    "hemoglobin": LabCategory.CBC,
    "rbc": LabCategory.CBC,
    "wbc": LabCategory.CBC,
    "platelet": LabCategory.CBC,
    "hematocrit": LabCategory.CBC,
    # LFT
    "alt": LabCategory.LFT,
    "ast": LabCategory.LFT,
    "alp": LabCategory.LFT,
    "bilirubin": LabCategory.LFT,
    # Diabetes
    "hba1c": LabCategory.DIABETES,
    "fasting_sugar": LabCategory.DIABETES,
    "random_sugar": LabCategory.DIABETES,
    # Lipid
    "hdl": LabCategory.LIPID,
    "ldl": LabCategory.LIPID,
    "triglycerides": LabCategory.LIPID,
    "total_cholesterol": LabCategory.LIPID,
    # Vitals
    "systolic_bp": LabCategory.VITALS,
    "diastolic_bp": LabCategory.VITALS,
    "weight": LabCategory.VITALS,
    "bmi": LabCategory.VITALS,
}


def report_upload_to(instance, filename):
    folder = instance.patient.folder_name
    safe = filename.replace(" ", "_")
    return f"patients/{folder}/{safe}"


class LabReport(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        DUPLICATE = "duplicate", "Duplicate"

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="reports")
    original_filename = models.CharField(max_length=255)
    file = models.FileField(upload_to=report_upload_to)
    file_hash = models.CharField(max_length=64, db_index=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    report_date = models.DateField(null=True, blank=True)
    hospital_name = models.CharField(max_length=255, blank=True)
    doctor_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    ocr_raw_text = models.TextField(blank=True)
    processing_error = models.TextField(blank=True)
    is_encrypted = models.BooleanField(default=False)
    is_demo = models.BooleanField(
        default=False,
        help_text="Demo/sample data — excluded from real-patient clinical analysis by default.",
    )
    ocr_quality = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="good | partial | poor | failed",
    )
    ocr_message = models.TextField(
        blank=True,
        help_text="Human-readable extraction status for the user.",
    )
    extracted_patient_name = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_reports",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]
        indexes = [
            models.Index(fields=["patient", "report_date"]),
            models.Index(fields=["file_hash"]),
        ]

    def __str__(self):
        return f"{self.patient.full_name} — {self.original_filename}"

    def compute_hash(self):
        h = hashlib.sha256()
        self.file.open("rb")
        for chunk in self.file.chunks():
            h.update(chunk)
        self.file.close()
        return h.hexdigest()


class LabResult(models.Model):
    class StatusFlag(models.TextChoices):
        NORMAL = "normal", "Normal"
        LOW = "low", "Low"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"
        UNKNOWN = "unknown", "Unknown"
        NOT_AVAILABLE = "not_available", "Not Available"

    class ExtractionStatus(models.TextChoices):
        EXTRACTED = "extracted", "Extracted"
        UNCERTAIN = "uncertain", "Uncertain — needs review"
        NOT_AVAILABLE = "not_available", "Unable to Extract"

    class ReferenceSource(models.TextChoices):
        REPORT = "report", "From report"
        NONE = "none", "No range on report"

    report = models.ForeignKey(LabReport, on_delete=models.CASCADE, related_name="results")
    investigation_key = models.CharField(max_length=64, db_index=True)
    investigation_name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=LabCategory.choices, default=LabCategory.OTHER)
    raw_value = models.CharField(max_length=100)
    numeric_value = models.FloatField(null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    standardized_value = models.FloatField(null=True, blank=True)
    standardized_unit = models.CharField(max_length=50, blank=True)
    reference_range = models.CharField(max_length=100, blank=True)
    reference_low = models.FloatField(null=True, blank=True)
    reference_high = models.FloatField(null=True, blank=True)
    reference_source = models.CharField(
        max_length=20,
        choices=ReferenceSource.choices,
        default=ReferenceSource.NONE,
    )
    status_flag = models.CharField(max_length=20, choices=StatusFlag.choices, default=StatusFlag.UNKNOWN)
    extraction_status = models.CharField(
        max_length=20,
        choices=ExtractionStatus.choices,
        default=ExtractionStatus.EXTRACTED,
    )
    confidence_score = models.FloatField(
        default=0.0,
        help_text="0–1 extraction confidence from OCR/parsing. Not a clinical confidence.",
    )
    needs_review = models.BooleanField(
        default=False,
        help_text="True when OCR quality is uncertain or fields are unreadable.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "investigation_name"]
        indexes = [models.Index(fields=["investigation_key", "report"])]

    def __str__(self):
        return f"{self.investigation_name}: {self.raw_value} {self.unit}"
