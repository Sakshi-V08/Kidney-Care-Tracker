"""Export PDF / CSV / Excel summaries for clinicians and patients."""
from __future__ import annotations

import csv
import io
from datetime import datetime

from django.conf import settings
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.analysis.models import HealthSummary, InvestigationAnalysis
from apps.reports.models import LabReport, LabResult


def export_csv(patient) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "report_date",
            "investigation",
            "value",
            "unit",
            "status",
            "reference_range",
            "hospital",
        ]
    )
    results = LabResult.objects.filter(report__patient=patient).select_related("report").order_by(
        "report__report_date", "investigation_name"
    )
    for r in results:
        writer.writerow(
            [
                r.report.report_date,
                r.investigation_name,
                r.standardized_value or r.raw_value,
                r.standardized_unit or r.unit,
                r.status_flag,
                r.reference_range,
                r.report.hospital_name,
            ]
        )
    return buffer.getvalue().encode("utf-8")


def export_excel(patient) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Lab Results"
    ws.append(["Report Date", "Investigation", "Value", "Unit", "Status", "Reference", "Hospital"])
    results = LabResult.objects.filter(report__patient=patient).select_related("report").order_by(
        "report__report_date", "investigation_name"
    )
    for r in results:
        ws.append(
            [
                str(r.report.report_date or ""),
                r.investigation_name,
                r.standardized_value or r.raw_value,
                r.standardized_unit or r.unit,
                r.status_flag,
                r.reference_range,
                r.report.hospital_name,
            ]
        )
    analysis_ws = wb.create_sheet("Analysis")
    analysis_ws.append(["Investigation", "Current", "Trend", "Severity", "Urgency", "Meaning"])
    for a in InvestigationAnalysis.objects.filter(patient=patient):
        analysis_ws.append(
            [a.investigation_name, a.current_value, a.trend, a.severity, a.urgency_level, a.possible_clinical_meaning]
        )
    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def export_pdf_summary(patient, doctor_mode: bool = False) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    title = "Doctor Report — KHIS" if doctor_mode else "Patient Health Summary — KHIS"
    story.append(Paragraph(title, styles["Title"]))
    story.append(Paragraph(f"Patient: {patient.full_name}", styles["Heading2"]))
    story.append(
        Paragraph(
            f"CKD Stage: {patient.get_ckd_stage_display()} | Risk: {patient.get_risk_level_display()} | "
            f"Kidney Score: {patient.kidney_score}/100",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 12))

    summary = HealthSummary.objects.filter(patient=patient).first()
    if summary:
        story.append(Paragraph("AI Health Summary (Educational)", styles["Heading2"]))
        story.append(Paragraph(summary.summary_text.replace("\n", "<br/>"), styles["Normal"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph("Preventive Suggestions", styles["Heading2"]))
        for s in summary.preventive_suggestions:
            story.append(Paragraph(f"• {s.get('text')} — {s.get('evidence', '')}", styles["Normal"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Recent Lab Results", styles["Heading2"]))
    data = [["Date", "Test", "Value", "Unit", "Status"]]
    results = (
        LabResult.objects.filter(report__patient=patient)
        .select_related("report")
        .order_by("-report__report_date")[:40]
    )
    for r in results:
        data.append(
            [
                str(r.report.report_date or ""),
                r.investigation_name,
                str(r.standardized_value or r.raw_value),
                r.standardized_unit or r.unit,
                r.status_flag,
            ]
        )
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D9488")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 16))
    story.append(Paragraph(settings.MEDICAL_DISCLAIMER, styles["Italic"]))
    story.append(Paragraph(f"Generated: {datetime.utcnow().isoformat()}Z", styles["Normal"]))
    doc.build(story)
    return buffer.getvalue()
