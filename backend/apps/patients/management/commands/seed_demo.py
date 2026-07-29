from datetime import date, timedelta
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile

from apps.analysis.services.engine import analyze_patient_after_report
from apps.patients.models import Patient, UpcomingTest
from apps.reports.models import LabReport, LabResult
from apps.reports.services.units import convert_value, flag_status
from apps.trackers.models import DietPlan, MedicineReminder

User = get_user_model()

SAMPLE_REPORTS = {
    "Rahul": [
        {
            "filename": "Report_April_2025.txt",
            "date": date(2025, 4, 15),
            "hospital": "City Kidney Care Lab",
            "doctor": "Dr. Mehta",
            "labs": {
                "creatinine": (2.4, "mg/dL"),
                "blood_urea": (48, "mg/dL"),
                "egfr": (32, "mL/min/1.73m2"),
                "potassium": (4.2, "mEq/L"),
                "sodium": (138, "mEq/L"),
                "hemoglobin": (11.2, "g/dL"),
                "urine_protein": (1, ""),
                "protein_creatinine_ratio": (320, "mg/g"),
                "hba1c": (7.1, "%"),
                "systolic_bp": (138, "mmHg"),
                "diastolic_bp": (86, "mmHg"),
            },
        },
        {
            "filename": "Report_July_2025.txt",
            "date": date(2025, 7, 20),
            "hospital": "City Kidney Care Lab",
            "doctor": "Dr. Mehta",
            "labs": {
                "creatinine": (2.6, "mg/dL"),
                "blood_urea": (52, "mg/dL"),
                "egfr": (29, "mL/min/1.73m2"),
                "potassium": (4.5, "mEq/L"),
                "sodium": (137, "mEq/L"),
                "hemoglobin": (10.8, "g/dL"),
                "urine_protein": (1, ""),
                "protein_creatinine_ratio": (380, "mg/g"),
                "hba1c": (7.4, "%"),
                "systolic_bp": (142, "mmHg"),
                "diastolic_bp": (88, "mmHg"),
            },
        },
        {
            "filename": "Report_Dec_2025.txt",
            "date": date(2025, 12, 10),
            "hospital": "City Kidney Care Lab",
            "doctor": "Dr. Mehta",
            "labs": {
                "creatinine": (3.1, "mg/dL"),
                "blood_urea": (58, "mg/dL"),
                "egfr": (24, "mL/min/1.73m2"),
                "potassium": (4.8, "mEq/L"),
                "sodium": (136, "mEq/L"),
                "hemoglobin": (10.1, "g/dL"),
                "urine_protein": (2, ""),
                "protein_creatinine_ratio": (450, "mg/g"),
                "hba1c": (7.8, "%"),
                "systolic_bp": (148, "mmHg"),
                "diastolic_bp": (90, "mmHg"),
            },
        },
    ],
    "Sakshi": [
        {
            "filename": "Report1.txt",
            "date": date(2025, 6, 1),
            "hospital": "Metro Diagnostics",
            "doctor": "Dr. Sharma",
            "labs": {
                "creatinine": (1.1, "mg/dL"),
                "blood_urea": (28, "mg/dL"),
                "egfr": (72, "mL/min/1.73m2"),
                "potassium": (4.0, "mEq/L"),
                "sodium": (140, "mEq/L"),
                "hemoglobin": (13.2, "g/dL"),
                "hba1c": (5.4, "%"),
            },
        },
        {
            "filename": "Report2.txt",
            "date": date(2025, 11, 15),
            "hospital": "Metro Diagnostics",
            "doctor": "Dr. Sharma",
            "labs": {
                "creatinine": (1.2, "mg/dL"),
                "blood_urea": (30, "mg/dL"),
                "egfr": (68, "mL/min/1.73m2"),
                "potassium": (4.1, "mEq/L"),
                "sodium": (139, "mEq/L"),
                "hemoglobin": (12.9, "g/dL"),
                "hba1c": (5.5, "%"),
            },
        },
    ],
}


def _text_for_labs(meta, labs):
    lines = [
        f"Hospital: {meta['hospital']}",
        f"Doctor: {meta['doctor']}",
        f"Report Date: {meta['date'].strftime('%d/%m/%Y')}",
        "",
        "Investigation\tValue\tUnit\tReference",
    ]
    refs = {
        "creatinine": "0.6-1.3",
        "blood_urea": "15-40",
        "egfr": "90-200",
        "potassium": "3.5-5.0",
        "sodium": "135-145",
        "hemoglobin": "12-17.5",
        "hba1c": "4.0-5.6",
        "protein_creatinine_ratio": "0-150",
    }
    for key, (val, unit) in labs.items():
        name = key.replace("_", " ").title()
        lines.append(f"{name} {val} {unit} ({refs.get(key, '')})")
    return "\n".join(lines)


class Command(BaseCommand):
    help = "Seed demo admin/patient users and sample kidney lab reports"

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@khis.local", "role": User.Role.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if not admin.has_usable_password():
            admin.set_password("admin123")
            admin.role = User.Role.ADMIN
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()

        for name, reports in SAMPLE_REPORTS.items():
            username = name.lower()
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@khis.local",
                    "first_name": name,
                    "role": User.Role.PATIENT,
                },
            )
            if created or not user.has_usable_password():
                user.set_password("patient123")
                user.role = User.Role.PATIENT
                user.save()

            patient, _ = Patient.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": name,
                    "sex": Patient.Sex.UNKNOWN,
                    "height_cm": 165,
                    "weight_kg": 70,
                    "primary_nephrologist": reports[0]["doctor"],
                },
            )
            patient.full_name = name
            patient.save()
            patient.ensure_storage_folder()

            UpcomingTest.objects.get_or_create(
                patient=patient,
                test_name="Kidney Function Test (KFT)",
                defaults={"due_date": date.today() + timedelta(days=15)},
            )
            MedicineReminder.objects.get_or_create(
                patient=patient,
                medicine_name="Amlodipine",
                defaults={"dosage": "5 mg", "schedule": "daily 08:00"},
            )
            DietPlan.objects.get_or_create(
                patient=patient,
                title="Renal Diet Plan",
                defaults={
                    "guidelines": [
                        "Limit sodium to <2300 mg/day unless advised lower",
                        "Choose fresh foods over processed",
                        "Distribute protein as advised by dietitian",
                    ],
                    "daily_sodium_mg": 2000,
                    "protein_guidance": "Moderate protein unless dialysis — confirm with clinician",
                    "potassium_guidance": "Adjust based on latest potassium labs",
                    "phosphorus_guidance": "Limit cola and processed cheese if phosphorus high",
                },
            )

            for meta in reports:
                text = _text_for_labs(meta, meta["labs"])
                existing = LabReport.objects.filter(patient=patient, original_filename=meta["filename"]).first()
                if existing:
                    continue
                report = LabReport(
                    patient=patient,
                    original_filename=meta["filename"],
                    report_date=meta["date"],
                    hospital_name=meta["hospital"],
                    doctor_name=meta["doctor"],
                    status=LabReport.Status.COMPLETED,
                    ocr_raw_text=text,
                    uploaded_by=user,
                    is_demo=True,
                    ocr_quality="good",
                    ocr_message="Demo seed data — excluded from real-patient clinical analysis.",
                )
                report.file.save(meta["filename"], ContentFile(text.encode("utf-8")), save=True)
                for key, (val, unit) in meta["labs"].items():
                    std, std_unit = convert_value(key, float(val), unit)
                    LabResult.objects.create(
                        report=report,
                        investigation_key=key,
                        investigation_name=key.replace("_", " ").title(),
                        category="kft" if key in ("creatinine", "egfr", "blood_urea", "potassium", "sodium") else "other",
                        raw_value=str(val),
                        numeric_value=float(val),
                        unit=unit,
                        standardized_value=std,
                        standardized_unit=std_unit,
                        status_flag=flag_status(key, std, None, None, allow_default_refs=True),
                        reference_source="none",
                        extraction_status="extracted",
                        confidence_score=1.0,
                        needs_review=False,
                    )
            analyze_patient_after_report(patient.id)
            self.stdout.write(self.style.SUCCESS(f"Seeded patient {name} -> folder {patient.folder_name}"))

        self.stdout.write(self.style.SUCCESS("Done. Login: admin/admin123 or rahul/patient123 or sakshi/patient123"))
