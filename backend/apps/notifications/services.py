from datetime import timedelta

from django.utils import timezone

from apps.analysis.models import InvestigationAnalysis
from apps.notifications.models import Notification
from apps.reports.models import LabResult


def notify(user, title, message, severity=Notification.Severity.INFO, category=Notification.Category.SYSTEM, patient=None):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        patient=patient,
        title=title,
        message=message,
        severity=severity,
        category=category,
    )


def evaluate_report_alerts(report):
    patient = report.patient
    user = patient.user
    results = {r.investigation_key: r for r in report.results.all()}

    creat = results.get("creatinine")
    if creat and creat.status_flag in ("high", "critical"):
        analysis = InvestigationAnalysis.objects.filter(patient=patient, investigation_key="creatinine").first()
        if analysis and analysis.trend == "increasing":
            notify(
                user,
                "Creatinine increase detected",
                f"Creatinine is {creat.standardized_value} {creat.standardized_unit} with an increasing trend.",
                Notification.Severity.WARNING,
                Notification.Category.LAB,
                patient,
            )

    egfr = results.get("egfr")
    if egfr and egfr.status_flag in ("low", "critical"):
        analysis = InvestigationAnalysis.objects.filter(patient=patient, investigation_key="egfr").first()
        if analysis and analysis.trend == "decreasing":
            notify(
                user,
                "eGFR decrease detected",
                f"eGFR is {egfr.standardized_value} {egfr.standardized_unit} with a decreasing trend.",
                Notification.Severity.WARNING,
                Notification.Category.LAB,
                patient,
            )

    protein = results.get("urine_protein") or results.get("protein_creatinine_ratio")
    if protein and protein.status_flag in ("high", "critical"):
        notify(
            user,
            "Proteinuria alert",
            f"{protein.investigation_name} is elevated ({protein.standardized_value} {protein.standardized_unit}).",
            Notification.Severity.WARNING,
            Notification.Category.LAB,
            patient,
        )

    pot = results.get("potassium")
    if pot and pot.status_flag == "critical":
        notify(
            user,
            "Critical potassium level",
            f"Potassium is {pot.standardized_value} {pot.standardized_unit}. Seek urgent medical advice if symptomatic.",
            Notification.Severity.CRITICAL,
            Notification.Category.LAB,
            patient,
        )

    # Follow-up due soon
    soon = timezone.now().date() + timedelta(days=7)
    for test in patient.upcoming_tests.filter(completed=False, due_date__lte=soon):
        notify(
            user,
            "Follow-up test due",
            f"{test.test_name} is due on {test.due_date}.",
            Notification.Severity.INFO,
            Notification.Category.FOLLOWUP,
            patient,
        )
