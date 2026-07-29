import logging

from django.conf import settings

from apps.analysis.models import HealthSummary, InvestigationAnalysis
from apps.reports.models import LabReport, LabResult

logger = logging.getLogger(__name__)


def build_patient_context(patient) -> str:
    analyses = InvestigationAnalysis.objects.filter(patient=patient)[:25]
    lines = [
        f"Patient: {patient.full_name}",
        f"CKD stage (from extracted eGFR only): {patient.ckd_stage}",
        f"Risk: {patient.risk_level}",
        "RULE: Answer using ONLY the extracted values below. Never invent missing labs.",
    ]
    if not analyses:
        lines.append("No extracted investigation analyses available yet.")
    for a in analyses:
        lines.append(
            f"{a.investigation_name}: current={a.current_value} {a.current_unit} "
            f"({a.current_status}), previous={a.previous_value}, delta={a.rate_of_change}, trend={a.trend}"
        )
    summary = HealthSummary.objects.filter(patient=patient).first()
    if summary:
        lines.append(f"Latest summary: {summary.summary_text[:800]}")
    recent = LabReport.objects.filter(
        patient=patient, status=LabReport.Status.COMPLETED, is_demo=False
    )[:3]
    for r in recent:
        lines.append(
            f"Report {r.id} date={r.report_date} lab={r.hospital_name or 'Not Available'} "
            f"quality={r.ocr_quality}"
        )
    return "\n".join(lines)


def answer_question(patient, question: str) -> str:
    q = question.lower().strip()
    has_labs = LabResult.objects.filter(
        report__patient=patient,
        report__is_demo=False,
        report__status=LabReport.Status.COMPLETED,
    ).exists()

    if not has_labs:
        return _with_disclaimer(
            "No real laboratory values have been extracted for this patient yet. "
            "Please upload a PDF or image of a lab report. "
            "I will not invent or assume any test results."
        )

    context = build_patient_context(patient)

    if "creatinine" in q and ("why" in q or "increasing" in q or "increase" in q):
        a = InvestigationAnalysis.objects.filter(patient=patient, investigation_key="creatinine").first()
        if a and a.current_value is not None:
            base = (
                f"Based on your extracted reports, creatinine trend is {a.trend}. "
                f"Latest extracted value: {a.current_value} {a.current_unit} "
                f"(previous: {a.previous_value if a.previous_value is not None else 'Not Available'}; "
                f"Δ {a.rate_of_change if a.rate_of_change is not None else 'Not Available'}). "
                f"Educational note: {a.possible_causes}"
            )
        else:
            base = (
                "Creatinine was not extracted from your uploaded reports "
                "(Not Available). I will not invent a creatinine value."
            )
        return _with_disclaimer(base)

    if "food" in q or "avoid" in q or "diet" in q:
        summary = HealthSummary.objects.filter(patient=patient).first()
        tips = []
        if summary:
            tips = [
                s.get("text")
                for s in summary.preventive_suggestions
                if s.get("category") == "diet" and s.get("text")
            ]
        if not tips:
            return _with_disclaimer(
                "No diet recommendations are available yet because there are no abnormal "
                "extracted findings that triggered diet-specific suggestions. "
                "Upload additional reports or ask your clinician/dietitian for personalized advice."
            )
        return _with_disclaimer(
            "Diet considerations linked to your extracted lab findings:\n- " + "\n- ".join(tips)
        )

    if "compare" in q and ("last" in q or "two" in q or "report" in q):
        reports = list(
            LabReport.objects.filter(
                patient=patient, status=LabReport.Status.COMPLETED, is_demo=False
            ).order_by("-report_date", "-created_at")[:2]
        )
        if len(reports) < 2:
            return _with_disclaimer(
                "Need at least two completed real reports to compare. "
                "I will not simulate a comparison."
            )
        parts = [f"Comparing extracted values: {reports[1].report_date} → {reports[0].report_date}"]
        compared = 0
        keys = set(
            LabResult.objects.filter(report=reports[0]).values_list("investigation_key", flat=True)
        ) & set(
            LabResult.objects.filter(report=reports[1]).values_list("investigation_key", flat=True)
        )
        for key in sorted(keys):
            older = LabResult.objects.filter(
                report=reports[1], investigation_key=key, standardized_value__isnull=False
            ).first()
            newer = LabResult.objects.filter(
                report=reports[0], investigation_key=key, standardized_value__isnull=False
            ).first()
            if older and newer:
                delta = round(newer.standardized_value - older.standardized_value, 3)
                parts.append(
                    f"{key}: {older.standardized_value} → {newer.standardized_value} "
                    f"{newer.standardized_unit} (Δ {delta})"
                )
                compared += 1
        if compared == 0:
            parts.append(
                "No overlapping extracted numeric investigations were found between the two reports."
            )
        return _with_disclaimer("\n".join(parts))

    if "improved" in q or "improve" in q:
        notes = []
        for key in ("egfr", "creatinine"):
            a = InvestigationAnalysis.objects.filter(patient=patient, investigation_key=key).first()
            if a and a.current_value is not None:
                notes.append(
                    f"{a.investigation_name} trend is {a.trend} "
                    f"(current extracted {a.current_value} {a.current_unit})."
                )
        if not notes:
            return _with_disclaimer(
                "Not enough overlapping extracted history to assess improvement."
            )
        return _with_disclaimer(" ".join(notes))

    if "egfr" in q and ("explain" in q or "what" in q):
        a = InvestigationAnalysis.objects.filter(patient=patient, investigation_key="egfr").first()
        base = (
            "eGFR estimates kidney filtration. Higher values generally indicate better filtration. "
            "Clinicians use eGFR with other findings to stage CKD."
        )
        if a and a.current_value is not None:
            base += (
                f" Your latest extracted eGFR is {a.current_value} {a.current_unit} "
                f"(trend: {a.trend})."
            )
        else:
            base += " eGFR has not been extracted from your uploaded reports yet (Not Available)."
        return _with_disclaimer(base)

    if settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are KHIS educational assistant. Use ONLY provided extracted lab context. "
                            "Never invent missing lab values. If data is missing, say Not Available. "
                            "Do not diagnose. Remind that this is informational only."
                        ),
                    },
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
                ],
                temperature=0.3,
            )
            return _with_disclaimer((resp.choices[0].message.content or "").strip())
        except Exception as exc:
            logger.warning("Chat LLM failed: %s", exc)

    return _with_disclaimer(
        "I can explain trends from your extracted labs only. "
        "Try asking about creatinine, eGFR, diet suggestions linked to your findings, "
        "or comparing your last two reports.\n\n" + context[:800]
    )


def _with_disclaimer(text: str) -> str:
    if settings.MEDICAL_DISCLAIMER.lower()[:40] in text.lower():
        return text
    return f"{text}\n\n—\n{settings.MEDICAL_DISCLAIMER}"
