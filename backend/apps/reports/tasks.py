from pathlib import Path

from celery import shared_task
from django.utils.dateparse import parse_date

from apps.audit.services import log_action
from apps.notifications.services import evaluate_report_alerts
from apps.reports.models import LabReport, LabResult
from apps.reports.services.ocr import process_report_file


@shared_task
def process_lab_report(report_id: int):
    """OCR + parse uploaded report only. Never invent missing laboratory values."""
    report = LabReport.objects.select_related("patient").get(pk=report_id)
    if report.is_demo:
        # Demo seeds are not re-processed as live clinical uploads
        return

    report.status = LabReport.Status.PROCESSING
    report.save(update_fields=["status"])

    try:
        path = Path(report.file.path)
        parsed = process_report_file(path)
        report.ocr_raw_text = parsed.raw_text
        report.ocr_quality = parsed.ocr_quality
        report.ocr_message = parsed.ocr_message
        report.extracted_patient_name = parsed.patient_name if parsed.patient_name != "Not Available" else ""

        if parsed.report_date:
            report.report_date = parse_date(parsed.report_date)
        if parsed.hospital_name and parsed.hospital_name != "Not Available":
            report.hospital_name = parsed.hospital_name
        if parsed.doctor_name and parsed.doctor_name != "Not Available":
            report.doctor_name = parsed.doctor_name

        report.results.all().delete()

        if parsed.ocr_quality == "poor" and not parsed.results:
            report.status = LabReport.Status.FAILED
            report.processing_error = parsed.ocr_message or (
                "Unable to extract laboratory values. No values were assumed."
            )
            report.save()
            log_action(
                user=report.uploaded_by,
                action="report.extraction_failed",
                details={"report_id": report.id, "quality": parsed.ocr_quality},
            )
            return

        for r in parsed.results:
            # Cross-check: do not store empty fabricated rows
            if not r.raw_value or r.raw_value.lower() in {"n/a", "na", "none"}:
                continue
            LabResult.objects.create(
                report=report,
                investigation_key=r.investigation_key,
                investigation_name=r.investigation_name,
                category=r.category,
                raw_value=r.raw_value,
                numeric_value=r.numeric_value,
                unit=r.unit,
                standardized_value=r.standardized_value,
                standardized_unit=r.standardized_unit,
                reference_range=r.reference_range or "Not Available",
                reference_low=r.reference_low,
                reference_high=r.reference_high,
                reference_source=r.reference_source,
                status_flag=r.status_flag,
                extraction_status=r.extraction_status,
                confidence_score=r.confidence_score,
                needs_review=r.needs_review,
            )

        report.status = LabReport.Status.COMPLETED
        report.processing_error = ""
        report.save()

        # Analysis uses ONLY extracted LabResult rows for this patient (non-demo)
        from apps.analysis.services.engine import analyze_patient_after_report

        analyze_patient_after_report(report.patient_id, report.id)
        evaluate_report_alerts(report)
        log_action(
            user=report.uploaded_by,
            action="report.processed",
            details={
                "report_id": report.id,
                "results": report.results.count(),
                "ocr_quality": report.ocr_quality,
            },
        )
    except Exception as exc:
        report.status = LabReport.Status.FAILED
        report.processing_error = str(exc)
        report.ocr_quality = "failed"
        report.ocr_message = (
            "Processing failed. No laboratory values were assumed. Please retry with a clearer file."
        )
        report.save(update_fields=["status", "processing_error", "ocr_quality", "ocr_message"])
        raise
