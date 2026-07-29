"""
Educational analysis from REAL extracted LabResult rows only.

Rules:
- Never invent missing laboratory values.
- Compare an investigation only when it exists in multiple real reports.
- Trends require ≥2 real numeric points; otherwise report insufficient history.
- Recommendations are derived only from abnormal/uncertain extracted findings.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

from apps.analysis.models import HealthSummary, InvestigationAnalysis, TrendSnapshot
from apps.patients.models import Patient
from apps.reports.models import LabReport, LabResult

logger = logging.getLogger(__name__)

KNOWLEDGE: Dict[str, Dict[str, str]] = {
    "creatinine": {
        "high": "Elevated creatinine on this report may suggest reduced kidney filtration.",
        "low": "Low creatinine on this report can occur with low muscle mass or overhydration.",
        "causes_high": "Dehydration, CKD progression, AKI, certain medications (e.g. NSAIDs), high protein load.",
        "complications": "Progressive CKD, electrolyte imbalance — discuss with your clinician.",
        "followup": "Repeat KFT as advised by your nephrologist.",
    },
    "egfr": {
        "low": "Reduced eGFR on this report indicates decreased estimated filtration.",
        "high": "Higher eGFR generally reflects better filtration (interpret with clinical context).",
        "causes_low": "CKD, acute kidney injury, age-related decline, obstruction.",
        "complications": "CKD progression risk, anemia, bone mineral disorders.",
        "followup": "Confirm staging with your clinician using serial eGFR values.",
    },
    "blood_urea": {
        "high": "Elevated urea on this report may reflect reduced renal clearance or dehydration.",
        "low": "Low urea may relate to low protein intake or other factors.",
        "causes_high": "CKD, GI bleed, dehydration, high-protein diet.",
        "followup": "Correlate with creatinine/eGFR on the same report.",
    },
    "bun": {
        "high": "Elevated BUN on this report may reflect reduced clearance or dehydration.",
        "causes_high": "CKD, dehydration, high-protein intake.",
        "followup": "Review with full KFT panel.",
    },
    "potassium": {
        "high": "Hyperkalemia on this report can be clinically important.",
        "low": "Hypokalemia on this report may cause muscle weakness or arrhythmias.",
        "causes_high": "CKD, ACE inhibitors/ARBs, potassium-sparing diuretics, high K diet.",
        "complications": "Cardiac arrhythmias — seek urgent care if symptomatic.",
        "followup": "Urgent clinical review if potassium is critical or symptoms occur.",
    },
    "sodium": {
        "high": "Hypernatremia on this report often relates to water deficit.",
        "low": "Hyponatremia on this report has multiple possible causes.",
        "followup": "Discuss fluid and medication review with your clinician.",
    },
    "urine_protein": {
        "high": "Proteinuria on this report may indicate kidney stress.",
        "causes_high": "Diabetic nephropathy, glomerulonephritis, uncontrolled hypertension.",
        "followup": "Urine ACR/PCR if not already on this report.",
    },
    "protein_creatinine_ratio": {
        "high": "Elevated PCR on this report suggests significant proteinuria.",
        "followup": "Monitor proteinuria serially as advised.",
    },
    "hemoglobin": {
        "low": "Anemia on this report is common in advanced CKD.",
        "causes_low": "EPO deficiency, iron deficiency, blood loss.",
        "followup": "CBC and iron studies if clinically indicated.",
    },
    "hba1c": {
        "high": "Elevated HbA1c on this report indicates suboptimal glucose control.",
        "causes_high": "Diabetes with inadequate control.",
        "followup": "Diabetes follow-up and kidney risk discussion.",
    },
    "systolic_bp": {
        "high": "Elevated systolic BP on this report may accelerate kidney damage.",
        "followup": "Home BP log and clinician review.",
    },
    "diastolic_bp": {
        "high": "Elevated diastolic BP on this report warrants monitoring.",
        "followup": "BP diary and medication review.",
    },
}


def _real_reports_qs(patient_id: int):
    return LabReport.objects.filter(
        patient_id=patient_id,
        status=LabReport.Status.COMPLETED,
        is_demo=False,
    )


def _series_for(patient_id: int, key: str) -> List[Dict[str, Any]]:
    """Only real, completed, non-demo reports with an extracted numeric value."""
    rows = (
        LabResult.objects.filter(
            report__patient_id=patient_id,
            report__status=LabReport.Status.COMPLETED,
            report__is_demo=False,
            investigation_key=key,
            standardized_value__isnull=False,
            extraction_status__in=["extracted", "uncertain"],
        )
        .exclude(raw_value__iexact="Not Available")
        .select_related("report")
        .order_by("report__report_date", "report__created_at")
    )
    series = []
    for r in rows:
        series.append(
            {
                "date": (r.report.report_date or r.report.created_at.date()).isoformat(),
                "value": r.standardized_value,
                "unit": r.standardized_unit,
                "report_id": r.report_id,
                "status": r.status_flag,
                "confidence": r.confidence_score,
                "needs_review": r.needs_review,
            }
        )
    return series


def _clinical_trend(key: str, values: List[float]) -> Tuple[str, Optional[float], str]:
    """
    Improving / Stable / Worsening based on analyte directionality.
    Requires ≥2 real values; otherwise Stable with insufficient delta.
    """
    if len(values) < 2:
        return "Insufficient history", None, "low"

    delta = round(values[-1] - values[0], 3)
    rel = abs(delta) / (abs(values[0]) + 1e-6)

    # Analytes where increase is typically worsening
    higher_worse = {
        "creatinine",
        "blood_urea",
        "bun",
        "potassium",
        "urine_protein",
        "protein_creatinine_ratio",
        "microalbumin",
        "hba1c",
        "systolic_bp",
        "diastolic_bp",
        "ldl",
        "triglycerides",
    }
    # Analytes where decrease is typically worsening
    lower_worse = {"egfr", "hemoglobin", "albumin", "hdl"}

    if rel < 0.05:
        return "Stable", delta, "low"

    if key in lower_worse:
        if delta < 0:
            return "Worsening", delta, "high" if rel > 0.15 else "moderate"
        return "Improving", delta, "moderate" if rel > 0.1 else "low"

    if key in higher_worse:
        if delta > 0:
            return "Worsening", delta, "high" if rel > 0.15 else "moderate"
        return "Improving", delta, "moderate" if rel > 0.1 else "low"

    # Neutral markers: report direction only
    if delta > 0:
        return "Increasing", delta, "moderate"
    return "Decreasing", delta, "moderate"


def _urgency(key: str, status: str, trend: str, value: Optional[float]) -> str:
    if status == "critical":
        return "emergency"
    if key == "potassium" and value is not None and (value >= 5.5 or value <= 3.0):
        return "urgent"
    if trend == "Worsening" and status in ("high", "low"):
        return "soon"
    if status in ("high", "low"):
        return "soon"
    return "routine"


def analyze_patient_after_report(patient_id: int, report_id: Optional[int] = None):
    patient = Patient.objects.get(pk=patient_id)
    report = LabReport.objects.filter(pk=report_id, is_demo=False).first() if report_id else None

    keys = set(
        LabResult.objects.filter(
            report__patient=patient,
            report__status=LabReport.Status.COMPLETED,
            report__is_demo=False,
            standardized_value__isnull=False,
        )
        .exclude(extraction_status="not_available")
        .values_list("investigation_key", flat=True)
    )

    # Clear stale analyses for keys no longer present in real data
    InvestigationAnalysis.objects.filter(patient=patient).exclude(investigation_key__in=keys).delete()

    for key in keys:
        series = _series_for(patient_id, key)
        TrendSnapshot.objects.update_or_create(
            patient=patient,
            investigation_key=key,
            defaults={"series": series},
        )
        if not series:
            continue

        values = [p["value"] for p in series]
        current = values[-1]
        previous = values[-2] if len(values) > 1 else None
        oldest = values[0] if len(values) >= 1 else None
        trend, rate, severity = _clinical_trend(key, values)
        latest_status = series[-1].get("status", "unknown")
        unit = series[-1].get("unit", "")
        name = key.replace("_", " ").title()
        avg_conf = sum(p.get("confidence") or 0 for p in series) / max(len(series), 1)

        kb = KNOWLEDGE.get(key, {})
        if latest_status == "high":
            meaning = kb.get("high", "Value is above the reference range printed on the report.")
            causes = kb.get("causes_high", "Clinical correlation required — not diagnosed by this app.")
        elif latest_status == "low":
            meaning = kb.get("low", "Value is below the reference range printed on the report.")
            causes = kb.get("causes_low", kb.get("causes_high", "Clinical correlation required."))
        elif latest_status == "unknown":
            meaning = (
                "Value was extracted from the report, but no reference range was found on the report, "
                "so Normal/High/Low was not assumed."
            )
            causes = "Unable to classify without the report's reference range."
        else:
            meaning = "Value is within the reference range printed on the latest report."
            causes = "Continue current care plan unless symptoms change — confirm with your clinician."

        complications = kb.get("complications", "Discuss persistent abnormalities with your healthcare provider.")
        if len(values) < 2:
            meaning += " Insufficient historical data to establish a trend (need at least two real reports with this test)."

        InvestigationAnalysis.objects.update_or_create(
            patient=patient,
            investigation_key=key,
            defaults={
                "report": report,
                "investigation_name": name,
                "current_value": current,
                "current_unit": unit,
                "current_status": latest_status,
                "previous_value": previous,
                "oldest_value": oldest,
                "trend": trend,
                "severity": severity,
                "rate_of_change": rate,
                "possible_clinical_meaning": meaning,
                "possible_causes": causes,
                "possible_complications": complications,
                "urgency_level": _urgency(key, latest_status, trend, current),
                "confidence_score": round(avg_conf, 2),
            },
        )

    from apps.analysis.services.scoring import update_patient_kidney_metrics

    update_patient_kidney_metrics(patient)
    return generate_health_summary(patient, report)


def generate_health_summary(patient: Patient, report: Optional[LabReport] = None) -> HealthSummary:
    analyses = list(
        InvestigationAnalysis.objects.filter(patient=patient).order_by("-updated_at")[:30]
    )
    real_count = (
        LabResult.objects.filter(
            report__patient=patient,
            report__status=LabReport.Status.COMPLETED,
            report__is_demo=False,
        ).count()
    )

    if real_count == 0:
        text = (
            "No extracted laboratory values are available yet for this patient. "
            "Upload a real laboratory report (PDF or image) to generate insights. "
            "This system does not invent or assume missing results.\n\n"
            + settings.MEDICAL_DISCLAIMER
        )
        suggestions: List[Dict[str, str]] = []
        model = "real-data-only-v1"
    else:
        suggestions = _personalized_suggestions(patient, analyses)
        if settings.OPENAI_API_KEY:
            text = _llm_summary(patient, analyses)
            model = settings.OPENAI_MODEL
        else:
            text = _rule_summary(patient, analyses)
            model = "rule-based-real-data-v1"

    return HealthSummary.objects.create(
        patient=patient,
        report=report,
        summary_text=text,
        preventive_suggestions=suggestions,
        model_used=model,
    )


def _rule_summary(patient: Patient, analyses: List[InvestigationAnalysis]) -> str:
    parts = []
    by_key = {a.investigation_key: a for a in analyses}

    creat = by_key.get("creatinine")
    egfr = by_key.get("egfr")
    urea = by_key.get("blood_urea") or by_key.get("bun")
    pot = by_key.get("potassium")
    protein = by_key.get("urine_protein") or by_key.get("protein_creatinine_ratio")

    if creat and creat.previous_value is not None and creat.current_value is not None:
        parts.append(
            f"Creatinine changed from {creat.previous_value} to {creat.current_value} "
            f"{creat.current_unit} versus the previous extracted report "
            f"(Δ {creat.rate_of_change}; trend: {creat.trend})."
        )
    elif creat and creat.current_value is not None:
        parts.append(
            f"Latest extracted creatinine is {creat.current_value} {creat.current_unit} "
            f"(status: {creat.current_status}). Only one real value is available — no trend computed."
        )

    if egfr and egfr.current_value is not None:
        if egfr.previous_value is not None:
            parts.append(
                f"eGFR changed from {egfr.previous_value} to {egfr.current_value} "
                f"{egfr.current_unit} (trend: {egfr.trend})."
            )
        else:
            parts.append(
                f"Latest extracted eGFR is {egfr.current_value} {egfr.current_unit} "
                f"(status: {egfr.current_status})."
            )

    if urea and urea.current_status in ("high", "critical"):
        parts.append(
            f"Blood urea/BUN is {urea.current_status} at {urea.current_value} {urea.current_unit} "
            "on the latest extracted report."
        )
    if pot and pot.current_value is not None:
        parts.append(
            f"Potassium is {pot.current_status} at {pot.current_value} {pot.current_unit} "
            f"(trend: {pot.trend})."
        )
    if protein and protein.current_status in ("high", "critical"):
        parts.append(
            f"Proteinuria marker {protein.investigation_name} remains {protein.current_status} "
            f"at {protein.current_value} {protein.current_unit}."
        )

    uncertain = LabResult.objects.filter(
        report__patient=patient,
        report__is_demo=False,
        needs_review=True,
    ).count()
    if uncertain:
        parts.append(
            f"{uncertain} extracted field(s) were marked uncertain and need manual review — "
            "they were not replaced with assumed values."
        )

    if not parts:
        parts.append(
            "Extracted labs exist but are insufficient for a detailed narrative. "
            "Upload additional dated reports containing the same investigations to enable trends."
        )

    if patient.ckd_stage != Patient.CKDStage.UNKNOWN:
        parts.append(
            f" Estimated CKD stage from extracted eGFR: {patient.get_ckd_stage_display()}; "
            f"risk: {patient.get_risk_level_display()}."
        )

    parts.append(" " + settings.MEDICAL_DISCLAIMER)
    return "".join(parts)


def _llm_summary(patient: Patient, analyses: List[InvestigationAnalysis]) -> str:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        payload = [
            {
                "name": a.investigation_name,
                "current": a.current_value,
                "unit": a.current_unit,
                "status": a.current_status,
                "previous": a.previous_value,
                "delta": a.rate_of_change,
                "trend": a.trend,
            }
            for a in analyses
            if a.current_value is not None
        ]
        if not payload:
            return _rule_summary(patient, analyses)

        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an educational assistant. Use ONLY the provided extracted lab values. "
                        "Do NOT invent missing tests or estimate values. "
                        "If history is insufficient for a trend, say so. "
                        "Do not diagnose. End with a clinician-consult reminder."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Write a concise paragraph from these REAL extracted values only:\n{payload}"
                    ),
                },
            ],
            temperature=0.2,
        )
        return (resp.choices[0].message.content or "").strip() + "\n\n" + settings.MEDICAL_DISCLAIMER
    except Exception as exc:
        logger.warning("LLM summary failed: %s", exc)
        return _rule_summary(patient, analyses)


def _personalized_suggestions(
    patient: Patient, analyses: List[InvestigationAnalysis]
) -> List[Dict[str, str]]:
    """Only emit suggestions tied to actual abnormal/worsening extracted findings."""
    suggestions: List[Dict[str, str]] = []
    by_key = {a.investigation_key: a for a in analyses}
    disclaimer = "Educational information only — not medical advice."

    def add(text: str, evidence: str, category: str):
        suggestions.append(
            {"text": text, "evidence": evidence, "category": category, "disclaimer": disclaimer}
        )

    creat = by_key.get("creatinine")
    if creat and (creat.current_status in ("high", "critical") or creat.trend == "Worsening"):
        add(
            "Discuss rising/high creatinine with your nephrologist; avoid NSAIDs unless prescribed",
            f"Based on extracted creatinine {creat.current_value} {creat.current_unit} (trend: {creat.trend}).",
            "care",
        )
        add(
            "Repeat kidney function tests as scheduled by your clinician",
            "Serial extracted KFTs are required to confirm trends.",
            "monitoring",
        )

    egfr = by_key.get("egfr")
    if egfr and (egfr.current_status in ("low", "critical") or egfr.trend == "Worsening"):
        add(
            "Follow a clinician-guided renal diet (sodium/protein individualized)",
            f"Based on extracted eGFR {egfr.current_value} {egfr.current_unit}.",
            "diet",
        )

    pot = by_key.get("potassium")
    if pot and pot.current_status in ("high", "critical", "low"):
        add(
            "Review potassium intake and medications with your clinician promptly",
            f"Based on extracted potassium {pot.current_value} {pot.current_unit}.",
            "diet",
        )

    bp = by_key.get("systolic_bp") or by_key.get("diastolic_bp")
    if bp and bp.current_status in ("high", "critical"):
        add(
            "Monitor blood pressure at home and share logs with your clinician",
            f"Based on extracted BP-related value {bp.current_value} {bp.current_unit}.",
            "monitoring",
        )

    hba1c = by_key.get("hba1c")
    sugar = by_key.get("fasting_sugar") or by_key.get("random_sugar")
    if (hba1c and hba1c.current_status == "high") or (sugar and sugar.current_status == "high"):
        add(
            "Prioritize diabetes management and glucose monitoring",
            "Based on extracted glucose/HbA1c abnormalities on your reports.",
            "monitoring",
        )

    protein = by_key.get("urine_protein") or by_key.get("protein_creatinine_ratio")
    if protein and protein.current_status in ("high", "critical"):
        add(
            "Reduce processed/high-salt foods as advised for proteinuria care",
            f"Based on extracted {protein.investigation_name}={protein.current_value}.",
            "diet",
        )

    if any(a.current_status in ("high", "low", "critical") for a in analyses):
        add(
            "Drink fluids only as advised for your kidney stage and heart status",
            "Hydration targets must be individualized — based on your abnormal extracted labs.",
            "lifestyle",
        )

    # If everything normal / insufficient — do not dump generic CKD tips
    if not suggestions:
        add(
            "No abnormal extracted findings triggered specific recommendations yet",
            "Upload more dated reports to enable personalized, evidence-linked suggestions.",
            "monitoring",
        )

    return suggestions[:12]
