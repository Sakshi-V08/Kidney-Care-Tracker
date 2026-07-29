"""CKD staging and dashboard from REAL extracted labs only."""
from __future__ import annotations

from datetime import timedelta
from typing import Any, Dict, Optional

from django.conf import settings
from django.utils import timezone

from apps.analysis.models import InvestigationAnalysis, TrendSnapshot
from apps.patients.models import Patient
from apps.reports.models import LabReport, LabResult


def egfr_to_stage(egfr: float) -> str:
    if egfr >= 90:
        return Patient.CKDStage.STAGE_1
    if egfr >= 60:
        return Patient.CKDStage.STAGE_2
    if egfr >= 45:
        return Patient.CKDStage.STAGE_3A
    if egfr >= 30:
        return Patient.CKDStage.STAGE_3B
    if egfr >= 15:
        return Patient.CKDStage.STAGE_4
    return Patient.CKDStage.STAGE_5


def compute_kidney_score(patient: Patient) -> Optional[int]:
    """
    Educational 0–100 score derived only from extracted eGFR/creatinine/etc.
    Returns None when there is insufficient real extracted data (never invents a score).
    """
    analyses = {
        a.investigation_key: a
        for a in InvestigationAnalysis.objects.filter(patient=patient)
        if a.current_value is not None
    }
    egfr = analyses.get("egfr")
    creat = analyses.get("creatinine")
    if not egfr and not creat:
        return None

    score = 50  # baseline only when at least one real kidney marker exists
    if egfr and egfr.current_value is not None:
        e = egfr.current_value
        if e >= 90:
            score += 30
        elif e >= 60:
            score += 15
        elif e >= 45:
            score += 0
        elif e >= 30:
            score -= 10
        elif e >= 15:
            score -= 20
        else:
            score -= 35
        if egfr.trend == "Worsening":
            score -= 10
        elif egfr.trend == "Improving":
            score += 5

    if creat and creat.trend == "Worsening":
        score -= 10
    pot = analyses.get("potassium")
    if pot and pot.current_status in ("high", "critical", "low"):
        score -= 8
    protein = analyses.get("urine_protein") or analyses.get("protein_creatinine_ratio")
    if protein and protein.current_status in ("high", "critical"):
        score -= 8

    return max(0, min(100, int(score)))


def risk_from_score_and_stage(score: Optional[int], stage: str) -> str:
    if score is None and stage == Patient.CKDStage.UNKNOWN:
        return Patient.RiskLevel.LOW  # unknown / no data — not a fabricated high risk
    if stage == Patient.CKDStage.STAGE_5 or (score is not None and score < 30):
        return Patient.RiskLevel.CRITICAL
    if stage in (Patient.CKDStage.STAGE_4, Patient.CKDStage.STAGE_3B) or (score is not None and score < 50):
        return Patient.RiskLevel.HIGH
    if stage in (Patient.CKDStage.STAGE_3A, Patient.CKDStage.STAGE_2) or (score is not None and score < 70):
        return Patient.RiskLevel.MODERATE
    return Patient.RiskLevel.LOW


def update_patient_kidney_metrics(patient: Patient):
    egfr_result = (
        LabResult.objects.filter(
            report__patient=patient,
            report__status=LabReport.Status.COMPLETED,
            report__is_demo=False,
            investigation_key="egfr",
            standardized_value__isnull=False,
        )
        .order_by("-report__report_date", "-report__created_at")
        .first()
    )
    if egfr_result:
        patient.ckd_stage = egfr_to_stage(egfr_result.standardized_value)
    else:
        patient.ckd_stage = Patient.CKDStage.UNKNOWN

    score = compute_kidney_score(patient)
    # Persist 0 when unknown so UI can show "Not Available" when no real labs
    patient.kidney_score = score if score is not None else 0
    patient.risk_level = risk_from_score_and_stage(score, patient.ckd_stage)
    patient.save(update_fields=["ckd_stage", "kidney_score", "risk_level", "updated_at"])


def build_dashboard_payload(patient: Patient) -> Dict[str, Any]:
    recent = (
        LabReport.objects.filter(patient=patient, is_demo=False)
        .order_by("-report_date", "-created_at")[:5]
    )
    latest_ids = [r.id for r in recent[:1]]
    abnormal = LabResult.objects.none()
    if latest_ids:
        abnormal = LabResult.objects.filter(
            report_id__in=latest_ids,
            status_flag__in=["high", "low", "critical"],
        )
    if not abnormal.exists():
        abnormal = LabResult.objects.filter(
            report__patient=patient,
            report__is_demo=False,
            status_flag__in=["high", "low", "critical"],
        ).order_by("-report__report_date")[:10]

    trend_keys = [
        "creatinine",
        "egfr",
        "blood_urea",
        "potassium",
        "sodium",
        "hemoglobin",
        "systolic_bp",
        "protein_creatinine_ratio",
    ]
    historical = {}
    for key in trend_keys:
        snap = TrendSnapshot.objects.filter(patient=patient, investigation_key=key).first()
        historical[key] = snap.series if snap else []

    needs_review = LabResult.objects.filter(
        report__patient=patient,
        report__is_demo=False,
        needs_review=True,
    ).count()

    real_result_count = LabResult.objects.filter(
        report__patient=patient,
        report__is_demo=False,
        report__status=LabReport.Status.COMPLETED,
    ).count()

    from apps.patients.serializers import PatientSerializer, UpcomingTestSerializer
    from apps.reports.serializers import LabReportListSerializer, LabResultSerializer

    score = patient.kidney_score if real_result_count else None

    return {
        "patient": PatientSerializer(patient).data,
        "latest_kidney_stage": patient.ckd_stage if real_result_count else "unknown",
        "risk_level": patient.risk_level if real_result_count else "unknown",
        "overall_kidney_score": score,
        "has_real_lab_data": real_result_count > 0,
        "fields_needing_review": needs_review,
        "recent_reports": LabReportListSerializer(recent, many=True).data,
        "upcoming_tests": UpcomingTestSerializer(
            patient.upcoming_tests.filter(
                completed=False,
                due_date__gte=timezone.now().date() - timedelta(days=1),
            ),
            many=True,
        ).data,
        "abnormal_parameters": LabResultSerializer(abnormal[:15], many=True).data,
        "historical_trends": historical,
        "disclaimer": settings.MEDICAL_DISCLAIMER,
        "data_policy": (
            "Insights use only laboratory values extracted from uploaded reports. "
            "Missing tests are Not Available — they are never assumed or estimated."
        ),
    }
